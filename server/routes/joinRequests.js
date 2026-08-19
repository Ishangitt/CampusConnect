import express from "express";
import Project from "../models/Project.js";
import JoinRequest from "../models/JoinRequest.js";

const router = express.Router();

async function handleDecision(req, res, nextStatus) {
  const joinRequest = await JoinRequest.findById(req.params.id);
  if (!joinRequest) {
    return res.status(404).json({ message: "Join request not found" });
  }

  const project = await Project.findById(joinRequest.projectId);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (project.creatorId.toString() !== req.dbUser._id.toString()) {
    return res.status(403).json({ message: "Only the owner can update join requests" });
  }

  if (joinRequest.status !== "pending") {
    return res.status(400).json({ message: "This request has already been processed" });
  }

  if (nextStatus === "accepted") {
    if (project.members.length >= project.teamSize) {
      return res.status(400).json({ message: "Team is already full" });
    }

    if (project.members.map(String).includes(joinRequest.studentId.toString())) {
      return res.status(400).json({ message: "Student is already a member" });
    }

    joinRequest.status = "accepted";
    await joinRequest.save();

    project.members.push(joinRequest.studentId);

    if (project.members.length >= project.teamSize) {
      project.isOpen = false;
      await JoinRequest.updateMany(
        {
          projectId: project._id,
          status: "pending",
          _id: { $ne: joinRequest._id },
        },
        { status: "rejected" }
      );
    }

    await project.save();
    return res.json({ joinRequest, project });
  }

  joinRequest.status = "rejected";
  await joinRequest.save();
  res.json({ joinRequest });
}

router.put("/:id/accept", (req, res) => handleDecision(req, res, "accepted"));
router.put("/:id/reject", (req, res) => handleDecision(req, res, "rejected"));

export default router;
