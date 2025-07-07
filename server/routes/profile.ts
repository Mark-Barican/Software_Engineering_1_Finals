import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "./auth";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// GET /api/profile
export async function getProfile(req: Request, res: Response) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(payload.userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user._id, name: user.name, email: user.email, preferences: user.preferences });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// PUT /api/profile
export async function updateProfile(req: Request, res: Response) {
  // TODO: Implement with JWT and MongoDB
  res.status(501).json({ message: "Not implemented" });
}

// POST /api/profile/change-password
export async function changePassword(req: Request, res: Response) {
  // TODO: Implement with JWT and MongoDB
  res.status(501).json({ message: "Not implemented" });
}

// DELETE /api/profile
export async function deleteProfile(req: Request, res: Response) {
  // TODO: Implement with JWT and MongoDB
  res.status(501).json({ message: "Not implemented" });
} 