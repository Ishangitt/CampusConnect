import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    requiredSkills: { type: [String], default: [] },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    teamSize: { type: Number, required: true, min: 2 },
    isOpen: { type: Boolean, default: true },
    deadline: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
