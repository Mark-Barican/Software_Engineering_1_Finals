import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Helper function to parse user agent and extract device info
function parseUserAgent(userAgent: string, ipAddress: string) {
  const deviceInfo = {
    browser: "Unknown",
    os: "Unknown", 
    device: "Unknown",
    ipAddress: ipAddress || "Unknown"
  };

  if (userAgent) {
    // Browser detection
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      deviceInfo.browser = "Chrome";
    } else if (userAgent.includes("Firefox")) {
      deviceInfo.browser = "Firefox";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      deviceInfo.browser = "Safari";
    } else if (userAgent.includes("Edg")) {
      deviceInfo.browser = "Edge";
    } else if (userAgent.includes("Opera")) {
      deviceInfo.browser = "Opera";
    }

    // OS detection
    if (userAgent.includes("Windows")) {
      deviceInfo.os = "Windows";
    } else if (userAgent.includes("Mac OS")) {
      deviceInfo.os = "macOS";
    } else if (userAgent.includes("Linux")) {
      deviceInfo.os = "Linux";
    } else if (userAgent.includes("Android")) {
      deviceInfo.os = "Android";
    } else if (userAgent.includes("iOS")) {
      deviceInfo.os = "iOS";
    }

    // Device detection
    if (userAgent.includes("Mobile")) {
      deviceInfo.device = "Mobile";
    } else if (userAgent.includes("Tablet")) {
      deviceInfo.device = "Tablet";
    } else {
      deviceInfo.device = "Desktop";
    }
  }

  return deviceInfo;
}

// User schema and model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { 
    type: String, 
    enum: ['admin', 'librarian', 'user'], 
    default: 'user' 
  },
  // Additional user details
  userId: { type: String, unique: true }, // Student Number or Employee ID
  contactNumber: { type: String, default: '' },
  department: { type: String, default: '' }, // Department/Course/Year for students or Assigned Section for librarians
  accountStatus: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    defaultSearch: { type: String, default: "title" },
    displayMode: { type: String, default: "list" },
  },
  resetToken: String,
  resetTokenExpiry: Date,
  sessions: [{
    sessionId: String,
    deviceInfo: {
      browser: String,
      os: String,
      device: String,
      ipAddress: String,
    },
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  }],
  lastLogin: Date,
}, { timestamps: true });
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
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
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
    // Create new session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const deviceInfo = parseUserAgent(userAgent, ipAddress);
    
    // Issue JWT with session ID
    const token = jwt.sign({ userId: user._id, sessionId }, JWT_SECRET, { expiresIn: "7d" });
    console.log("Token generated successfully");
    
    // Add session to user
    await User.findByIdAndUpdate(user._id, {
      $push: {
        sessions: {
          sessionId,
          deviceInfo,
          createdAt: new Date(),
          lastActivity: new Date(),
          isActive: true
        }
      },
      lastLogin: new Date()
    });
    
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        preferences: user.preferences 
      } 
    });
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

// Middleware to verify JWT token and extract session info
function verifyTokenWithSession(req: Request, res: Response, next: Function) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId: string };
    (req as any).userId = payload.userId;
    (req as any).sessionId = payload.sessionId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// GET /api/sessions - Get all active sessions for the user
export async function getUserSessions(req: Request, res: Response) {
  try {
    const user = await User.findById((req as any).userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const activeSessions = user.sessions.filter(session => session.isActive);
    const currentSessionId = (req as any).sessionId;

    const sessionsData = activeSessions.map(session => ({
      sessionId: session.sessionId,
      deviceInfo: session.deviceInfo,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      isCurrent: session.sessionId === currentSessionId
    }));

    res.json({ success: true, sessions: sessionsData });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/sessions/:sessionId - Revoke a specific session
export async function revokeSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).userId;
    const currentSessionId = (req as any).sessionId;

    if (sessionId === currentSessionId) {
      return res.status(400).json({ message: "Cannot revoke current session" });
    }

    const result = await User.findByIdAndUpdate(
      userId,
      { $set: { "sessions.$[elem].isActive": false } },
      { arrayFilters: [{ "elem.sessionId": sessionId }], new: true }
    );

    if (!result) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ success: true, message: "Session revoked successfully" });
  } catch (err) {
    console.error("Revoke session error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/sessions - Revoke all sessions except current one
export async function revokeAllSessions(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const currentSessionId = (req as any).sessionId;

    await User.findByIdAndUpdate(
      userId,
      { $set: { "sessions.$[elem].isActive": false } },
      { arrayFilters: [{ "elem.sessionId": { $ne: currentSessionId } }] }
    );

    res.json({ success: true, message: "All other sessions revoked successfully" });
  } catch (err) {
    console.error("Revoke all sessions error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/sessions/refresh - Update session activity
export async function refreshSession(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const sessionId = (req as any).sessionId;

    await User.findByIdAndUpdate(
      userId,
      { $set: { "sessions.$[elem].lastActivity": new Date() } },
      { arrayFilters: [{ "elem.sessionId": sessionId }] }
    );

    res.json({ success: true, message: "Session refreshed" });
  } catch (err) {
    console.error("Refresh session error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Role-based middleware
export function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: Function) => {
    try {
      const userId = (req as any).userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          message: "Access denied. Insufficient permissions.",
          requiredRole: roles,
          userRole: user.role 
        });
      }
      
      // Add user info to request for use in route handlers
      (req as any).user = user;
      next();
    } catch (err) {
      console.error("Role check error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

// Convenience middleware functions
export const requireAdmin = requireRole(['admin']);
export const requireLibrarian = requireRole(['admin', 'librarian']);
export const requireUser = requireRole(['admin', 'librarian', 'user']);

// Export User model for use in profile endpoints
export { User, verifyTokenWithSession }; 