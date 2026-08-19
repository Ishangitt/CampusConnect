import express from "express";
import { PREDEFINED_SKILLS, PROJECT_CATEGORIES } from "../constants/skills.js";
import Project from "../models/Project.js";
import JoinRequest from "../models/JoinRequest.js";

const router = express.Router();

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
      deadline,
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error("create project:", error);
    res.status(500).json({ message: "Failed to create project" });
  }
});

router.get("/", async (req, res) => {
  const { q, category } = req.query;
  const filter = { isOpen: true };

  if (q) {
    filter.title = { $regex: String(q), $options: "i" };
  }
  if (category && category !== "All") {
    filter.category = category;
  }

  const projects = await Project.find(filter)
    .populate("creatorId", "name college")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ projects });
});

router.get("/:id", async (req, res) => {
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
});

router.post("/:id/join", async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (!project.isOpen) {
    return res.status(400).json({ message: "This project is no longer accepting members" });
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
});

router.get("/:id/requests", async (req, res) => {
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
});

export default router;
