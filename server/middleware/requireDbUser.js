import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";

const isDummySecret =
  !process.env.CLERK_SECRET_KEY ||
  process.env.CLERK_SECRET_KEY === "sk_test_replace_me" ||
  process.env.CLERK_SECRET_KEY.includes("replace_me");

/**
 * Extract userId from request.
 * If Clerk secret key is valid, use getAuth().
 * Otherwise, manually decode the JWT from the Authorization header.
 */
function resolveUserId(req) {
  // Try Clerk first (works when secret key is valid)
  try {
    const auth = getAuth(req);
    if (auth?.userId) return auth.userId;
  } catch {
    // Clerk SDK may throw if secret is invalid — that's fine, we fallback
  }

  // Fallback: manually decode JWT from Bearer token
  if (isDummySecret) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        // JWT is three base64url-encoded parts separated by dots
        const payloadB64 = token.split(".")[1];
        // base64url → base64 → decode
        const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
        if (payload.sub) return payload.sub;
      } catch {
        // Could not decode — will fall through to null
      }
    }
  }

  return null;
}

export function requireClerkAuth(req, res, next) {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Attach for downstream middleware
  req.resolvedUserId = userId;
  next();
}

export async function requireDbUser(req, res, next) {
  try {
    const userId = req.resolvedUserId || resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      // Try to enrich from Clerk API (only when secret is real)
      let clerkUser = null;
      if (!isDummySecret) {
        try {
          clerkUser = await clerkClient.users.getUser(userId);
        } catch (clerkErr) {
          console.warn("Could not fetch Clerk user profile:", clerkErr.message);
        }
      }

      const primaryEmail = clerkUser?.emailAddresses?.find(
        (e) => e.id === clerkUser?.primaryEmailAddressId
      )?.emailAddress;

      user = await User.create({
        clerkId: userId,
        name: clerkUser
          ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
            clerkUser.username ||
            "Student"
          : "Student",
        email: primaryEmail || clerkUser?.emailAddresses?.[0]?.emailAddress || "",
        skills: [],
        interests: [],
      });
    }

    req.dbUser = user;
    next();
  } catch (error) {
    console.error("requireDbUser:", error);
    res.status(500).json({ message: "Failed to load user" });
  }
}
