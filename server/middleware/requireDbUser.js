import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";

/**
 * Extract userId from request.
 * Tries Clerk getAuth first, and falls back to decoding the JWT Bearer token.
 */
export function resolveUserId(req) {
  try {
    const auth = getAuth(req);
    if (auth?.userId) return auth.userId;
  } catch {
    // Clerk SDK might not have parsed session — fall through
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const parts = token.split(".");
      if (parts.length >= 2) {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
        if (payload.sub) return payload.sub;
      }
    } catch (err) {
      console.warn("Could not decode JWT payload:", err.message);
    }
  }

  return null;
}

export function requireClerkAuth(req, res, next) {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: please sign in" });
  }
  req.resolvedUserId = userId;
  next();
}

export async function requireDbUser(req, res, next) {
  try {
    const userId = req.resolvedUserId || resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: please sign in" });
    }

    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      let name = "Student";
      let email = "";

      try {
        if (clerkClient?.users?.getUser) {
          const clerkUser = await clerkClient.users.getUser(userId);
          if (clerkUser) {
            name =
              [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
              clerkUser.username ||
              "Student";
            const primary = clerkUser.emailAddresses?.find(
              (e) => e.id === clerkUser.primaryEmailAddressId
            );
            email = primary?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || "";
          }
        }
      } catch (clerkErr) {
        console.warn("Clerk user lookup note:", clerkErr.message);
      }

      user = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          $setOnInsert: {
            clerkId: userId,
            name,
            email,
            skills: [],
            interests: [],
            college: "",
            branch: "",
            year: "",
            bio: "",
            github: "",
            linkedin: "",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    req.dbUser = user;
    next();
  } catch (error) {
    console.error("requireDbUser error:", error);
    res.status(500).json({ message: error.message || "Failed to load user profile" });
  }
}

