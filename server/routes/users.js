import express from "express";
import { PREDEFINED_SKILLS } from "../constants/skills.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import JoinRequest from "../models/JoinRequest.js";

const router = express.Router();

router.get("/me", async (req, res) => {
  const createdCount = await Project.countDocuments({ creatorId: req.dbUser._id });
  const membershipCount = await Project.countDocuments({ members: req.dbUser._id });

  res.json({
    user: req.dbUser,
    metrics: {
      projectsCreated: createdCount,
      activeMemberships: membershipCount,
    },
  });
});

router.get("/me/dashboard", async (req, res) => {
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

  res.json({
    user: req.dbUser,
    metrics: {
      projectsCreated: createdCount,
      activeMemberships: membershipCount,
    },
    createdProjects,
    applications: applications.map((app) => ({
      _id: app._id,
      status: app.status,
      createdAt: app.createdAt,
      projectTitle: app.projectId?.title || "Deleted project",
      projectId: app.projectId?._id,
    })),
  });
});

router.put("/profile", async (req, res) => {
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
});

export default router;
