import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";

export function requireClerkAuth(req, res, next) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function requireDbUser(req, res, next) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const primaryEmail = clerkUser.emailAddresses?.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;

      user = await User.create({
        clerkId: userId,
        name:
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          clerkUser.username ||
          "Student",
        email: primaryEmail || clerkUser.emailAddresses?.[0]?.emailAddress || "",
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
