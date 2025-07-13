import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User, verifyTokenWithSession } from "./auth";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Middleware to verify JWT token
function verifyToken(req: Request, res: Response, next: Function) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Helper function to update session activity
async function updateSessionActivity(userId: string, sessionId: string) {
  try {
    await User.findByIdAndUpdate(
      userId,
      { $set: { "sessions.$[elem].lastActivity": new Date() } },
      { arrayFilters: [{ "elem.sessionId": sessionId }] }
    );
  } catch (err) {
    console.error("Session activity update error:", err);
  }
}

// GET /api/profile
export async function getProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const sessionId = (req as any).sessionId;
    
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Update session activity
    await updateSessionActivity(userId, sessionId);
    
    res.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      preferences: user.preferences 
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// PUT /api/profile
export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const sessionId = (req as any).sessionId;
    const { name, email, preferences } = req.body;
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: userId } 
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        name, 
        email, 
        preferences: preferences || {} 
      },
      { new: true }
    ).lean();
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update session activity
    await updateSessionActivity(userId, sessionId);
    
    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        preferences: updatedUser.preferences
      }
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/profile/change-password
export async function changePassword(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const sessionId = (req as any).sessionId;
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }
    
    // Find user and verify current password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });
    
    // Update session activity
    await updateSessionActivity(userId, sessionId);
    
    res.json({ 
      success: true, 
      message: "Password changed successfully" 
    });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/profile
export async function deleteProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const sessionId = (req as any).sessionId;
    const { password } = req.body;
    
    // Validate input
    if (!password) {
      return res.status(400).json({ message: "Password is required to delete account" });
    }
    
    // Find user and verify password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Password is incorrect" });
    }
    
    // Delete user account
    await User.findByIdAndDelete(userId);
    
    res.json({ 
      success: true, 
      message: "Account deleted successfully" 
    });
  } catch (err) {
    console.error("Account deletion error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
} 