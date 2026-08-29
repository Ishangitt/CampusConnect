import express from "express";
import { PREDEFINED_SKILLS, PROJECT_CATEGORIES } from "../constants/skills.js";
import Project from "../models/Project.js";
import JoinRequest from "../models/JoinRequest.js";

const router = express.Router();

// ── Create project ─────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { title, description, category, requiredSkills, teamSize, deadline, whatsappNumber } = req.body;

    if (!title || !description || !category || !teamSize || !deadline) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!PROJECT_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const skills = Array.isArray(requiredSkills) ? requiredSkills : [];
    if (skills.some((s) => !PREDEFINED_SKILLS.includes(s))) {
      return res.status(400).json({ message: "Invalid required skills" });
    }

    const size = Number(teamSize);
    if (!Number.isInteger(size) || size < 2) {
      return res.status(400).json({ message: "Team size must be an integer of at least 2" });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return res.status(400).json({ message: "Deadline must be a valid future date" });
    }

    if (whatsappNumber && !/^[+\d\s\-().]{7,20}$/.test(String(whatsappNumber).trim())) {
      return res.status(400).json({ message: "Invalid WhatsApp number format" });
    }

    const project = await Project.create({
      title,
      description,
      category,
      requiredSkills: skills,
      whatsappNumber: whatsappNumber ? String(whatsappNumber).trim() : "",
      creatorId: req.dbUser._id,
      members: [req.dbUser._id],
      teamSize: size,
      isOpen: size > 1,
      deadline: deadlineDate,
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error("create project:", error);
    res.status(500).json({ message: "Failed to create project" });
  }
});

// ── List projects (with search, category filter, deadline filter, pagination) ─
router.get("/", async (req, res) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    const filter = { isOpen: true, deadline: { $gte: new Date() } };

    if (q) {
      filter.$or = [
        { title: { $regex: String(q), $options: "i" } },
        { description: { $regex: String(q), $options: "i" } },
      ];
    }
    if (category && category !== "All") {
      filter.category = category;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate("creatorId", "name college")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Project.countDocuments(filter),
    ]);

    res.json({
      projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("list projects:", error);
    res.status(500).json({ message: "Failed to load projects" });
  }
});

// ── Get project by id ──────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("creatorId", "name email college branch skills github linkedin")
      .populate("members", "name email college branch skills")
      .lean();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only expose whatsappNumber to team members
    const isMember = project.members.some(
      (m) => (m._id || m).toString() === req.dbUser._id.toString()
    );
    if (!isMember) {
      delete project.whatsappNumber;
    }

    const existingRequest = await JoinRequest.findOne({
      projectId: project._id,
      studentId: req.dbUser._id,
    }).lean();

    res.json({
      project,
      joinRequest: existingRequest,
    });
  } catch (error) {
    console.error("get project:", error);
    res.status(500).json({ message: "Failed to load project" });
  }
});

// ── Edit project (owner only) ──────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.creatorId.toString() !== req.dbUser._id.toString()) {
      return res.status(403).json({ message: "Only the owner can edit this project" });
    }

    const { title, description, category, requiredSkills, teamSize, deadline, whatsappNumber, isOpen } = req.body;

    if (category && !PROJECT_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (requiredSkills) {
      const skills = Array.isArray(requiredSkills) ? requiredSkills : [];
      if (skills.some((s) => !PREDEFINED_SKILLS.includes(s))) {
        return res.status(400).json({ message: "Invalid required skills" });
      }
      project.requiredSkills = skills;
    }

    if (teamSize !== undefined) {
      const size = Number(teamSize);
      if (!Number.isInteger(size) || size < 2) {
        return res.status(400).json({ message: "Team size must be an integer of at least 2" });
      }
      if (size < project.members.length) {
        return res.status(400).json({ message: `Team size cannot be less than current member count (${project.members.length})` });
      }
      project.teamSize = size;
    }

    if (deadline !== undefined) {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({ message: "Invalid deadline date" });
      }
      project.deadline = deadlineDate;
    }

    if (whatsappNumber !== undefined) {
      const num = String(whatsappNumber).trim();
      if (num && !/^[+\d\s\-().]{7,20}$/.test(num)) {
        return res.status(400).json({ message: "Invalid WhatsApp number format" });
      }
      project.whatsappNumber = num;
    }

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (isOpen !== undefined) {
      // Allow manual toggle only if team isn't full
      if (isOpen && project.members.length >= project.teamSize) {
        return res.status(400).json({ message: "Cannot reopen a full team. Increase team size first." });
      }
      project.isOpen = Boolean(isOpen);
    }

    // Auto-recalculate isOpen based on members vs teamSize
    if (teamSize !== undefined) {
      project.isOpen = project.members.length < project.teamSize;
    }

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("creatorId", "name email college branch skills github linkedin")
      .populate("members", "name email college branch skills")
      .lean();

    res.json({ project: populated });
  } catch (error) {
    console.error("edit project:", error);
    res.status(500).json({ message: "Failed to update project" });
  }
});

// ── Join project ───────────────────────────────────────────────────────────
router.post("/:id/join", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.isOpen) {
      return res.status(400).json({ message: "This project is no longer accepting members" });
    }

    // Also check deadline
    if (project.deadline < new Date()) {
      return res.status(400).json({ message: "This project's deadline has passed" });
    }

    const userId = req.dbUser._id.toString();
    if (project.members.map(String).includes(userId)) {
      return res.status(400).json({ message: "You are already a member" });
    }

    const existing = await JoinRequest.findOne({
      projectId: project._id,
      studentId: req.dbUser._id,
    });

    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({ message: "Request already pending" });
      }
      if (existing.status === "accepted") {
        return res.status(400).json({ message: "You are already accepted" });
      }
      existing.status = "pending";
      await existing.save();
      return res.status(201).json({ joinRequest: existing });
    }

    const joinRequest = await JoinRequest.create({
      projectId: project._id,
      studentId: req.dbUser._id,
      status: "pending",
    });

    res.status(201).json({ joinRequest });
  } catch (error) {
    console.error("join project:", error);
    res.status(500).json({ message: "Failed to send join request" });
  }
});

// ── Leave project (member only, not owner) ─────────────────────────────────
router.delete("/:id/members/me", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const userId = req.dbUser._id.toString();

    if (project.creatorId.toString() === userId) {
      return res.status(400).json({ message: "Project owner cannot leave. Delete the project instead." });
    }

    if (!project.members.map(String).includes(userId)) {
      return res.status(400).json({ message: "You are not a member of this project" });
    }

    project.members = project.members.filter((m) => m.toString() !== userId);

    // Reopen if team is no longer full
    if (!project.isOpen && project.members.length < project.teamSize) {
      project.isOpen = true;
    }

    await project.save();

    // Also update their join request status back to rejected so they can re-apply
    await JoinRequest.updateOne(
      { projectId: project._id, studentId: req.dbUser._id },
      { status: "rejected" }
    );

    res.json({ message: "You have left the project" });
  } catch (error) {
    console.error("leave project:", error);
    res.status(500).json({ message: "Failed to leave project" });
  }
});

// ── Get join requests (owner only) ─────────────────────────────────────────
router.get("/:id/requests", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.creatorId.toString() !== req.dbUser._id.toString()) {
      return res.status(403).json({ message: "Only the owner can view join requests" });
    }

    const requests = await JoinRequest.find({ projectId: project._id })
      .populate("studentId", "name email college branch year bio skills github linkedin")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ project, requests });
  } catch (error) {
    console.error("get requests:", error);
    res.status(500).json({ message: "Failed to load join requests" });
  }
});

// ── Delete project (owner only) ────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.creatorId.toString() !== req.dbUser._id.toString()) {
      return res.status(403).json({ message: "Only the owner can delete this project" });
    }

    // Cascade delete all join requests for this project
    await JoinRequest.deleteMany({ projectId: project._id });
    await project.deleteOne();

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("delete project:", error);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

export default router;
