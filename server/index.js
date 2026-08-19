import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./config/db.js";
import { requireClerkAuth, requireDbUser } from "./middleware/requireDbUser.js";
import userRoutes from "./routes/users.js";
import projectRoutes from "./routes/projects.js";
import joinRequestRoutes from "./routes/joinRequests.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/users", clerkMiddleware(), requireClerkAuth, requireDbUser, userRoutes);
app.use("/api/projects", clerkMiddleware(), requireClerkAuth, requireDbUser, projectRoutes);
app.use("/api/join-requests", clerkMiddleware(), requireClerkAuth, requireDbUser, joinRequestRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
