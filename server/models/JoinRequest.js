import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

joinRequestSchema.index({ projectId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("JoinRequest", joinRequestSchema);
