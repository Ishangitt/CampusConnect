import express from "express";
import { PREDEFINED_SKILLS } from "../constants/skills.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import JoinRequest from "../models/JoinRequest.js";

const router = express.Router();

router.get("/me", async (req, res) => {
  try {
    const createdCount = await Project.countDocuments({ creatorId: req.dbUser._id });
    const membershipCount = await Project.countDocuments({ members: req.dbUser._id });

    res.json({
      user: req.dbUser,
      metrics: {
        projectsCreated: createdCount,
        activeMemberships: membershipCount,
      },
    });
  } catch (err) {
    console.error("GET /api/users/me error:", err);
    res.status(500).json({ message: "Failed to load user info" });
  }
});

router.get("/me/notifications", async (req, res) => {
  try {
    const userId = req.dbUser._id;

    // Get all projects owned by this user
    const ownedProjects = await Project.find({ creatorId: userId }).select("_id title").lean();
    const projectIds = ownedProjects.map((p) => p._id);

    if (projectIds.length === 0) {
      return res.json({ notifications: [], count: 0 });
    }

    // Get all pending join requests for those projects
    const pendingRequests = await JoinRequest.find({
      projectId: { $in: projectIds },
      status: "pending",
    })
      .populate("studentId", "name email college branch year skills")
      .sort({ createdAt: -1 })
      .lean();

    // Attach project title to each request
    const projectMap = {};
    ownedProjects.forEach((p) => { projectMap[p._id.toString()] = p.title; });

    const notifications = pendingRequests.map((req) => ({
      ...req,
      projectTitle: projectMap[req.projectId.toString()] || "Unknown project",
    }));

    res.json({ notifications, count: notifications.length });
  } catch (err) {
    console.error("GET /api/users/me/notifications error:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

router.get("/me/dashboard", async (req, res) => {
  try {
    const userId = req.dbUser._id;

    const [createdProjects, applications, createdCount, membershipCount] = await Promise.all([
      Project.find({ creatorId: userId }).sort({ createdAt: -1 }).lean(),
      JoinRequest.find({ studentId: userId })
        .populate("projectId", "title isOpen")
        .sort({ createdAt: -1 })
        .lean(),
      Project.countDocuments({ creatorId: userId }),
      Project.countDocuments({ members: userId }),
    ]);

    // Get pending request counts per created project
    const projectIds = (createdProjects || []).map((p) => p._id);
    const pendingCounts = projectIds.length
      ? await JoinRequest.aggregate([
          { $match: { projectId: { $in: projectIds }, status: "pending" } },
          { $group: { _id: "$projectId", count: { $sum: 1 } } },
        ])
      : [];

    const pendingCountMap = {};
    pendingCounts.forEach(({ _id, count }) => {
      pendingCountMap[_id.toString()] = count;
    });

    res.json({
      user: req.dbUser,
      metrics: {
        projectsCreated: createdCount,
        activeMemberships: membershipCount,
      },
      createdProjects: (createdProjects || []).map((p) => ({
        ...p,
        pendingRequestsCount: pendingCountMap[p._id.toString()] || 0,
      })),
      applications: (applications || []).map((app) => ({
        _id: app._id,
        status: app.status,
        createdAt: app.createdAt,
        projectTitle: app.projectId?.title || "Deleted project",
        projectId: app.projectId?._id,
      })),
    });
  } catch (err) {
    console.error("GET /api/users/me/dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const { name, college, branch, year, bio, skills, interests, github, linkedin } = req.body;

    if (skills && !Array.isArray(skills)) {
      return res.status(400).json({ message: "Skills must be an array" });
    }

    if (skills) {
      const invalid = skills.filter((s) => !PREDEFINED_SKILLS.includes(s));
      if (invalid.length) {
        return res.status(400).json({ message: "Invalid skills selected" });
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.dbUser._id,
      {
        name: name ?? req.dbUser.name,
        college: college ?? req.dbUser.college,
        branch: branch ?? req.dbUser.branch,
        year: year ?? req.dbUser.year,
        bio: bio ?? req.dbUser.bio,
        skills: skills ?? req.dbUser.skills,
        interests: Array.isArray(interests)
          ? interests
          : typeof interests === "string"
            ? interests
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean)
            : req.dbUser.interests,
        github: github ?? req.dbUser.github,
        linkedin: linkedin ?? req.dbUser.linkedin,
      },
      { new: true }
    );

    res.json({ user: updated });
  } catch (err) {
    console.error("PUT /api/users/profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
