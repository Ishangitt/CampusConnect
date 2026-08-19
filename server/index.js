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

const isDummySecret =
  !process.env.CLERK_SECRET_KEY ||
  process.env.CLERK_SECRET_KEY === "sk_test_replace_me" ||
  process.env.CLERK_SECRET_KEY.includes("replace_me");

if (isDummySecret) {
  console.warn(
    "⚠️  CLERK_SECRET_KEY is missing or dummy — running with JWT-decode fallback (dev mode)"
  );
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_ORIGIN,
]
  .filter(Boolean)
  .map((o) => o.trim().replace(/\/+$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const clean = origin.trim().replace(/\/+$/, "");
      if (
        allowedOrigins.includes(clean) ||
        clean.endsWith(".vercel.app") ||
        clean.includes("localhost")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Only attach clerkMiddleware when the secret key is valid.
// When it's a dummy key, our requireClerkAuth does its own JWT decoding.
const authChain = isDummySecret
  ? [requireClerkAuth, requireDbUser]
  : [clerkMiddleware(), requireClerkAuth, requireDbUser];

app.use("/api/users", ...authChain, userRoutes);
app.use("/api/projects", ...authChain, projectRoutes);
app.use("/api/join-requests", ...authChain, joinRequestRoutes);

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
