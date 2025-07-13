import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// User schema and model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  preferences: {
    notifications: { type: Boolean, default: true },
    defaultSearch: { type: String, default: "title" },
    displayMode: { type: String, default: "list" },
  },
  resetToken: String,
  resetTokenExpiry: Date,
});
const User = mongoose.model("User", userSchema);

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// POST /api/register
export async function register(req: Request, res: Response) {
  console.log("Registration attempt:", req.body);
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }
  try {
    console.log("Checking if user exists:", email);
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("User already exists");
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    console.log("Hashing password...");
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("Creating new user...");
    const user = await User.create({ name, email, passwordHash });
    console.log("User created successfully:", user._id);
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: "Registration failed", error: err });
  }
}

// POST /api/login
export async function login(req: Request, res: Response) {
  console.log("Login attempt:", req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }
  try {
    console.log("Looking for user:", email);
    const user = await User.findOne({ email });
    console.log("User found:", user ? "Yes" : "No");
    
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    
    console.log("Comparing passwords...");
    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log("Password valid:", valid);
    
    if (!valid) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    // Issue JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    console.log("🎫 Token generated successfully");
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed", error: err });
  }
}

// POST /api/forgot-password
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether user exists or not for security
      return res.json({ success: true, message: "If the email exists, a reset link has been sent" });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Save token to user
    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry
    });
    
    // In a real application, you would send an email here
    // For now, we'll just return the token (remove this in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    
    res.json({ 
      success: true, 
      message: "If the email exists, a reset link has been sent",
      // Remove this in production - only for development
      resetToken: resetToken
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// POST /api/reset-password
export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: "Token and password are required" });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
  }
  
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update password and clear reset token
    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null
    });
    
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Export User model for use in profile endpoints
export { User }; 