import path from "path";
import * as express from "express";
import express__default, { Router } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import crypto from "crypto";
import multer from "multer";
import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import session from "express-session";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
function parseUserAgent(userAgent, ipAddress) {
  const deviceInfo = {
    browser: "Unknown",
    os: "Unknown",
    device: "Unknown",
    ipAddress: ipAddress || "Unknown"
  };
  if (userAgent) {
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
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: {
    type: String,
    enum: ["admin", "librarian", "user"],
    default: "user"
  },
  // Additional user details
  userId: { type: String, unique: true },
  // Student Number or Employee ID
  contactNumber: { type: String, default: "" },
  department: { type: String, default: "" },
  // Department/Course/Year for students or Assigned Section for librarians
  accountStatus: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active"
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    defaultSearch: { type: String, default: "title" },
    displayMode: { type: String, default: "list" }
  },
  profilePicture: {
    data: { type: Buffer, default: null },
    contentType: { type: String, default: null },
    fileName: { type: String, default: null },
    uploadDate: { type: Date, default: null }
  },
  resetToken: String,
  resetTokenExpiry: Date,
  sessions: [{
    sessionId: String,
    deviceInfo: {
      browser: String,
      os: String,
      device: String,
      ipAddress: String
    },
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }],
  lastLogin: Date
}, { timestamps: true });
const User$1 = mongoose.model("User", userSchema);
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "456992381735-bo0lp411162a4c065lfo65ki21bj1890.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";
passport.use(new Strategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User$1.findOne({ email: profile.emails[0].value });
    if (!user) {
      let newUserId;
      let tries = 0;
      while (tries < 20) {
        newUserId = await generateUserId("user") + "-" + Math.floor(1e5 + Math.random() * 9e5);
        try {
          user = await User$1.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            passwordHash: "",
            // No password for Google users
            userId: newUserId,
            accountStatus: "active"
          });
          break;
        } catch (err) {
          if (err.code === 11e3 && err.keyPattern && err.keyPattern.userId) {
            tries++;
          } else {
            return done(err, null);
          }
        }
      }
      if (!user) {
        try {
          user = await User$1.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            passwordHash: "",
            userId: profile.emails[0].value,
            // fallback
            accountStatus: "active"
          });
        } catch (err) {
          return done(new Error("Failed to create user after multiple attempts and fallback"), null);
        }
      }
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));
async function generateUserId(role, department) {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const currentDate = /* @__PURE__ */ new Date();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");
  const dateCode = month + day;
  let prefix = "";
  let deptCode = "";
  switch (role) {
    case "user":
      prefix = "STD";
      deptCode = department ? department.toUpperCase().slice(0, 2) : "CS";
      break;
    case "librarian":
      prefix = "LIB";
      deptCode = department ? department.toUpperCase().slice(0, 2) : "LI";
      break;
    case "admin":
      prefix = "ADM";
      deptCode = department ? department.toUpperCase().slice(0, 2) : "AD";
      break;
    default:
      prefix = "USR";
      deptCode = "XX";
  }
  const startOfDay = /* @__PURE__ */ new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = /* @__PURE__ */ new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const todayCount = await User$1.countDocuments({
    role,
    department: { $regex: new RegExp(`^${deptCode}`, "i") },
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });
  const sequentialNumber = (todayCount + 1).toString().padStart(3, "0");
  return `${prefix}-${yearSuffix}${deptCode}-${dateCode}-${sequentialNumber}`;
}
async function register(req, res) {
  console.log("Registration attempt:", req.body);
  const { name, email, password, department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }
  try {
    console.log("Checking if user exists:", email);
    const existing = await User$1.findOne({ email });
    if (existing) {
      console.log("User already exists");
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    const userId = await generateUserId("user", department);
    console.log("Generated user ID:", userId);
    console.log("Hashing password...");
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("Creating new user...");
    const user = await User$1.create({
      name,
      email,
      passwordHash,
      userId,
      department: department || "Computer Science"
    });
    console.log("User created successfully:", user._id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userId: user.userId
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: "Registration failed", error: err });
  }
}
async function login(req, res) {
  console.log("Login attempt:", req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }
  try {
    console.log("Looking for user:", email);
    const user = await User$1.findOne({ email });
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
    const sessionId = crypto.randomBytes(32).toString("hex");
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = req.ip || req.connection.remoteAddress || "";
    const deviceInfo = parseUserAgent(userAgent, ipAddress);
    const token = jwt.sign({ userId: user._id, sessionId }, JWT_SECRET, { expiresIn: "7d" });
    console.log("Token generated successfully");
    await User$1.findByIdAndUpdate(user._id, {
      $push: {
        sessions: {
          sessionId,
          deviceInfo,
          createdAt: /* @__PURE__ */ new Date(),
          lastActivity: /* @__PURE__ */ new Date(),
          isActive: true
        }
      },
      lastLogin: /* @__PURE__ */ new Date()
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
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }
  try {
    const user = await User$1.findOne({ email });
    if (!user) {
      return res.json({ success: true, message: "If the email exists, a reset link has been sent" });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 36e5);
    await User$1.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry
    });
    console.log(`Password reset token for ${email}: ${resetToken}`);
    res.json({
      success: true,
      message: "If the email exists, a reset link has been sent",
      // Remove this in production - only for development
      resetToken
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: "Token and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
  }
  try {
    const user = await User$1.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: /* @__PURE__ */ new Date() }
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await User$1.findByIdAndUpdate(user._id, {
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
function verifyTokenWithSession(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.sessionId = payload.sessionId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
async function getUserSessions(req, res) {
  try {
    const user = await User$1.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const activeSessions = user.sessions.filter((session2) => session2.isActive);
    const currentSessionId = req.sessionId;
    const sessionsData = activeSessions.map((session2) => ({
      sessionId: session2.sessionId,
      deviceInfo: session2.deviceInfo,
      createdAt: session2.createdAt,
      lastActivity: session2.lastActivity,
      isCurrent: session2.sessionId === currentSessionId
    }));
    res.json({ success: true, sessions: sessionsData });
  } catch (err) {
    console.error("Get sessions error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function revokeSession(req, res) {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;
    const currentSessionId = req.sessionId;
    if (sessionId === currentSessionId) {
      return res.status(400).json({ message: "Cannot revoke current session" });
    }
    const result = await User$1.findByIdAndUpdate(
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
async function revokeAllSessions(req, res) {
  try {
    const userId = req.userId;
    const currentSessionId = req.sessionId;
    await User$1.findByIdAndUpdate(
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
async function refreshSession(req, res) {
  try {
    const userId = req.userId;
    const sessionId = req.sessionId;
    await User$1.findByIdAndUpdate(
      userId,
      { $set: { "sessions.$[elem].lastActivity": /* @__PURE__ */ new Date() } },
      { arrayFilters: [{ "elem.sessionId": sessionId }] }
    );
    res.json({ success: true, message: "Session refreshed" });
  } catch (err) {
    console.error("Refresh session error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
function requireRole(roles) {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await User$1.findById(userId);
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
      req.user = user;
      next();
    } catch (err) {
      console.error("Role check error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}
const requireAdmin = requireRole(["admin"]);
const requireLibrarian = requireRole(["admin", "librarian"]);
const requireUser = requireRole(["admin", "librarian", "user"]);
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
async function uploadProfilePicture(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    upload.single("profilePicture")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      await User$1.findByIdAndUpdate(user.id, {
        profilePicture: {
          data: file.buffer,
          contentType: file.mimetype,
          fileName: file.originalname,
          uploadDate: /* @__PURE__ */ new Date()
        }
      });
      res.json({
        success: true,
        message: "Profile picture uploaded successfully"
      });
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({ message: "Failed to upload profile picture" });
  }
}
async function getProfilePicture(req, res) {
  try {
    const { userId } = req.params;
    const user = await User$1.findById(userId).select("profilePicture");
    if (!user || !user.profilePicture || !user.profilePicture.data) {
      return res.status(404).json({ message: "Profile picture not found" });
    }
    res.set("Content-Type", user.profilePicture.contentType);
    res.set("Content-Disposition", `inline; filename="${user.profilePicture.fileName}"`);
    res.send(user.profilePicture.data);
  } catch (error) {
    console.error("Get profile picture error:", error);
    res.status(500).json({ message: "Failed to get profile picture" });
  }
}
async function removeProfilePicture(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await User$1.findByIdAndUpdate(user.id, {
      $unset: { profilePicture: 1 }
    });
    res.json({
      success: true,
      message: "Profile picture removed successfully"
    });
  } catch (error) {
    console.error("Remove profile picture error:", error);
    res.status(500).json({ message: "Failed to remove profile picture" });
  }
}
const router$2 = express__default.Router();
router$2.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router$2.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.redirect(`http://localhost:5173/login?token=${token}`);
  }
);
process.env.JWT_SECRET || "dev_secret";
async function updateSessionActivity(userId, sessionId) {
  try {
    await User$1.findByIdAndUpdate(
      userId,
      { $set: { "sessions.$[elem].lastActivity": /* @__PURE__ */ new Date() } },
      { arrayFilters: [{ "elem.sessionId": sessionId }] }
    );
  } catch (err) {
    console.error("Session activity update error:", err);
  }
}
async function getProfile(req, res) {
  try {
    const userId = req.userId;
    const sessionId = req.sessionId;
    const user = await User$1.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    await updateSessionActivity(userId, sessionId);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      userId: user.userId,
      department: user.department,
      preferences: user.preferences,
      profilePicture: user.profilePicture
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateProfile(req, res) {
  try {
    const userId = req.userId;
    const sessionId = req.sessionId;
    const { name, email, preferences } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    const existingUser = await User$1.findOne({
      email,
      _id: { $ne: userId }
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const updatedUser = await User$1.findByIdAndUpdate(
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
async function changePassword(req, res) {
  try {
    const userId = req.userId;
    const sessionId = req.sessionId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }
    const user = await User$1.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await User$1.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });
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
async function deleteProfile(req, res) {
  try {
    const userId = req.userId;
    const sessionId = req.sessionId;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required to delete account" });
    }
    const user = await User$1.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Password is incorrect" });
    }
    await User$1.findByIdAndDelete(userId);
    res.json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (err) {
    console.error("Account deletion error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, unique: true, required: true },
  publisher: { type: String, required: true },
  publishedYear: { type: Number, required: true },
  genre: { type: String, required: true },
  categories: [String],
  description: String,
  coverImage: String,
  totalCopies: { type: Number, default: 1, required: true },
  availableCopies: { type: Number, default: 1 },
  location: { type: String, required: true },
  // e.g., "Shelf A3, Section B"
  language: { type: String, default: "English" },
  pages: Number,
  hasDownload: { type: Boolean, default: false },
  hasReadOnline: { type: Boolean, default: false },
  addedDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });
const Book = mongoose.model("Book", bookSchema, "books");
async function getAdminStats(req, res) {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const totalUsers = await User$1.countDocuments();
    const totalBooks = await Book.countDocuments();
    const newUsersToday = await User$1.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1e3) }
    });
    const booksAddedThisMonth = await Book.countDocuments({
      addedDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3) }
    });
    const { Loan: Loan2, Reservation: Reservation2 } = require("./librarian");
    const activeLoans = await Loan2.countDocuments({ status: "active" });
    const pendingReservations = await Reservation2.countDocuments({ status: "pending" });
    const stats = {
      totalUsers,
      totalBooks,
      activeLoans,
      pendingReservations,
      newUsersToday,
      booksAddedThisMonth,
      systemStatus: "healthy"
    };
    res.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getUsers(req, res) {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const users = await User$1.find().select("-passwordHash -resetToken -resetTokenExpiry -sessions").sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await User$1.countDocuments();
    const { Loan: Loan2, Fine: Fine2, Reservation: Reservation2 } = require("./librarian");
    const usersWithDetails = await Promise.all(
      users.map(async (user2) => {
        let additionalInfo = {};
        if (user2.role === "user") {
          const currentLoans = await Loan2.countDocuments({
            userId: user2._id,
            status: "active"
          });
          const totalBorrowed = await Loan2.countDocuments({
            userId: user2._id
          });
          const outstandingFines = await Fine2.aggregate([
            { $match: { userId: user2._id, status: "pending" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
          ]);
          const reservations = await Reservation2.countDocuments({
            userId: user2._id,
            status: { $in: ["pending", "ready"] }
          });
          additionalInfo = {
            currentBorrowedBooks: currentLoans,
            totalBooksBorrowed: totalBorrowed,
            outstandingFines: outstandingFines[0]?.total || 0,
            numberOfReservations: reservations
          };
        }
        return {
          id: user2._id,
          name: user2.name,
          email: user2.email,
          role: user2.role,
          userId: user2.userId || `${user2.role.toUpperCase()}-${user2._id.toString().slice(-6)}`,
          contactNumber: user2.contactNumber || "+1-555-0123",
          department: user2.department || (user2.role === "user" ? "Computer Science - Year 3" : user2.role === "librarian" ? "Reference Section" : "Administration"),
          createdAt: user2.createdAt,
          lastLogin: user2.lastLogin,
          accountStatus: user2.accountStatus || "active",
          profilePicture: user2.profilePicture,
          ...additionalInfo
        };
      })
    );
    res.json({
      users: usersWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function createUser(req, res) {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (!["admin", "librarian", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const existingUser = await User$1.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    const { generateUserId: generateUserId2 } = require("./auth");
    const userId = await generateUserId2(role, department);
    const bcrypt2 = require("bcryptjs");
    const passwordHash = await bcrypt2.hash(password, 10);
    const newUser = await User$1.create({
      name,
      email,
      passwordHash,
      role,
      userId,
      department: department || (role === "user" ? "Computer Science" : "General")
    });
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        userId: newUser.userId,
        department: newUser.department,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateUser(req, res) {
  try {
    const adminUser = req.user;
    if (adminUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    const { name, email, role, userId, department } = req.body;
    if (!["admin", "librarian", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User$1.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin" && adminUser._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Admins cannot edit other admins' profiles." });
    }
    if (email !== user.email) {
      const existingUser = await User$1.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already taken" });
      }
    }
    if (userId && userId !== user.userId) {
      return res.status(400).json({
        message: "User ID cannot be modified. It is used throughout the system for tracking loans, fines, and reservations. For major corrections, consider creating a new account."
      });
    }
    const updatedUser = await User$1.findByIdAndUpdate(
      id,
      { name, email, role, userId, department },
      { new: true }
    ).select("-passwordHash -resetToken -resetTokenExpiry -sessions");
    res.json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        userId: updatedUser.userId,
        department: updatedUser.department,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function deleteUser(req, res) {
  try {
    const adminUser = req.user;
    if (adminUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    if (adminUser._id.toString() === id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    const user = await User$1.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { Loan: Loan2, Reservation: Reservation2, Fine: Fine2 } = require("./librarian");
    const activeLoans = await Loan2.countDocuments({ userId: id, status: "active" });
    const activeReservations = await Reservation2.countDocuments({ userId: id, status: { $in: ["pending", "ready"] } });
    const unpaidFines = await Fine2.countDocuments({ userId: id, status: { $in: ["pending", "partial"] } });
    if (activeLoans > 0 || activeReservations > 0 || unpaidFines > 0) {
      let issues = [];
      if (activeLoans > 0) issues.push(`${activeLoans} active loan(s)`);
      if (activeReservations > 0) issues.push(`${activeReservations} active reservation(s)`);
      if (unpaidFines > 0) issues.push(`${unpaidFines} unpaid fine(s)`);
      return res.status(400).json({ message: `Cannot delete user. Please resolve: ${issues.join(", ")}.` });
    }
    await User$1.findByIdAndDelete(id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getBooks(req, res) {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const books = await Book.find().sort({ addedDate: -1 }).skip(skip).limit(limit);
    const total = await Book.countDocuments();
    const booksWithStatus = books.map((book) => ({
      id: book._id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre,
      publisher: book.publisher,
      publishedYear: book.publishedYear,
      description: book.description,
      coverImage: book.coverImage,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      location: book.location,
      language: book.language,
      pages: book.pages,
      hasDownload: book.hasDownload,
      hasReadOnline: book.hasReadOnline,
      categories: book.categories,
      addedDate: book.addedDate,
      status: book.availableCopies === 0 ? "out-of-stock" : book.availableCopies <= 2 ? "low-stock" : "available"
    }));
    res.json({
      books: booksWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function createBook$1(req, res) {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const {
      title,
      author,
      isbn,
      genre,
      publishedYear,
      publisher,
      description,
      coverImage,
      totalCopies,
      categories,
      language,
      pages,
      hasDownload,
      hasReadOnline,
      location
    } = req.body;
    if (!title || !author || !isbn || !publisher || !publishedYear || !genre || !location) {
      return res.status(400).json({
        message: "Title, author, ISBN, publisher, publication year, genre, and location are required"
      });
    }
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.status(400).json({ message: "Book with this ISBN already exists" });
    }
    const newBook = await Book.create({
      title,
      author,
      isbn,
      genre,
      publishedYear,
      publisher,
      description,
      coverImage,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1,
      categories: categories || [],
      language: language || "English",
      pages,
      hasDownload: hasDownload || false,
      hasReadOnline: hasReadOnline || false,
      location
    });
    res.status(201).json({
      message: "Book created successfully",
      book: {
        id: newBook._id,
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn,
        genre: newBook.genre,
        publisher: newBook.publisher,
        publishedYear: newBook.publishedYear,
        description: newBook.description,
        coverImage: newBook.coverImage,
        totalCopies: newBook.totalCopies,
        availableCopies: newBook.availableCopies,
        location: newBook.location,
        language: newBook.language,
        pages: newBook.pages,
        hasDownload: newBook.hasDownload,
        hasReadOnline: newBook.hasReadOnline,
        categories: newBook.categories,
        addedDate: newBook.addedDate
      }
    });
  } catch (error) {
    console.error("Create book error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateBook$1(req, res) {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    const updateData = req.body;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (updateData.isbn && updateData.isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn: updateData.isbn });
      if (existingBook) {
        return res.status(400).json({ message: "ISBN is already taken" });
      }
    }
    const { Reservation: Reservation2 } = require("./librarian");
    if (updateData.totalCopies !== void 0 && updateData.totalCopies < book.totalCopies) {
      const reduction = book.totalCopies - updateData.totalCopies;
      if (book.availableCopies - reduction < 0) {
        return res.status(400).json({
          message: `Cannot reduce total copies to ${updateData.totalCopies}. There are ${book.availableCopies} available copies and ${book.totalCopies - book.availableCopies} on loan.`
        });
      }
      const pendingReservations = await Reservation2.countDocuments({
        bookId: id,
        status: "pending"
      });
      if (pendingReservations > 0) {
        return res.status(400).json({
          message: `Cannot reduce copies. There are ${pendingReservations} pending reservation(s) for this book. Please handle reservations first.`
        });
      }
      updateData.availableCopies = Math.max(0, book.availableCopies - reduction);
    }
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { ...updateData, lastUpdated: /* @__PURE__ */ new Date() },
      { new: true }
    );
    res.json({
      message: "Book updated successfully",
      book: {
        id: updatedBook._id,
        title: updatedBook.title,
        author: updatedBook.author,
        isbn: updatedBook.isbn,
        genre: updatedBook.genre,
        publisher: updatedBook.publisher,
        publishedYear: updatedBook.publishedYear,
        description: updatedBook.description,
        coverImage: updatedBook.coverImage,
        totalCopies: updatedBook.totalCopies,
        availableCopies: updatedBook.availableCopies,
        location: updatedBook.location,
        language: updatedBook.language,
        pages: updatedBook.pages,
        hasDownload: updatedBook.hasDownload,
        hasReadOnline: updatedBook.hasReadOnline,
        categories: updatedBook.categories,
        addedDate: updatedBook.addedDate,
        lastUpdated: updatedBook.lastUpdated
      }
    });
  } catch (error) {
    console.error("Update book error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function deleteBook(req, res) {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    const { Reservation: Reservation2, Loan: Loan2 } = require("./librarian");
    const activeReservations = await Reservation2.find({
      bookId: id,
      status: { $in: ["pending", "ready"] }
    }).populate("userId", "name email");
    const activeLoans = await Loan2.countDocuments({ bookId: id, status: "active" });
    if (activeReservations.length > 0 || activeLoans > 0) {
      let issues = [];
      if (activeReservations.length > 0) issues.push(`${activeReservations.length} active reservation(s)`);
      if (activeLoans > 0) issues.push(`${activeLoans} active loan(s)`);
      return res.status(400).json({
        message: `Cannot delete book. Please resolve: ${issues.join(", ")}.`,
        reservations: activeReservations
      });
    }
    await Reservation2.updateMany(
      { bookId: id },
      {
        status: "cancelled",
        notes: "Book deleted from library"
      }
    );
    await Book.findByIdAndDelete(id);
    res.json({
      message: "Book deleted successfully",
      cancelledReservations: activeReservations.length
    });
  } catch (error) {
    console.error("Delete book error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Librarian who issued
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  renewalCount: { type: Number, default: 0 },
  maxRenewals: { type: Number, default: 2 },
  status: {
    type: String,
    enum: ["active", "returned", "overdue", "lost", "damaged"],
    default: "active"
  },
  fineAmount: { type: Number, default: 0 },
  finePaid: { type: Boolean, default: false },
  notes: String
}, { timestamps: true });
const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  requestDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "ready", "fulfilled", "cancelled", "expired"],
    default: "pending"
  },
  priority: { type: Number, default: 1 },
  notificationSent: { type: Boolean, default: false },
  expiryDate: Date,
  notes: String
}, { timestamps: true });
const fineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
  amount: { type: Number, required: true },
  reason: {
    type: String,
    enum: ["overdue", "damage", "lost", "replacement", "other"],
    required: true
  },
  description: String,
  dateIssued: { type: Date, default: Date.now },
  datePaid: Date,
  paidAmount: { type: Number, default: 0 },
  waived: { type: Boolean, default: false },
  waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  waivedReason: String,
  status: {
    type: String,
    enum: ["pending", "paid", "partial", "waived", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["overdue", "reservation_ready", "fine", "general", "book_reminder"],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  sent: { type: Boolean, default: false },
  sentDate: Date,
  read: { type: Boolean, default: false },
  readDate: Date,
  relatedLoanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
  relatedReservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
  relatedFineId: { type: mongoose.Schema.Types.ObjectId, ref: "Fine" }
}, { timestamps: true });
const inventoryAuditSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  auditDate: { type: Date, default: Date.now },
  expectedCount: { type: Number, required: true },
  actualCount: { type: Number, required: true },
  discrepancy: { type: Number, required: true },
  status: {
    type: String,
    enum: ["match", "shortage", "surplus", "damaged", "missing"],
    required: true
  },
  notes: String,
  resolved: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedDate: Date
}, { timestamps: true });
const Loan = mongoose.model("Loan", loanSchema);
const Reservation = mongoose.model("Reservation", reservationSchema);
const Fine = mongoose.model("Fine", fineSchema);
const Notification = mongoose.model("Notification", notificationSchema);
const InventoryAudit = mongoose.model("InventoryAudit", inventoryAuditSchema);
function calculateDueDate(days = 14) {
  const date = /* @__PURE__ */ new Date();
  date.setDate(date.getDate() + days);
  return date;
}
function calculateOverdueFine(dueDate, returnDate = /* @__PURE__ */ new Date()) {
  const msPerDay = 24 * 60 * 60 * 1e3;
  const overdueDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / msPerDay);
  return overdueDays > 0 ? overdueDays * 0.5 : 0;
}
async function getLibrarianDashboard(req, res) {
  try {
    const user = req.user;
    const totalBooks = await Book.countDocuments();
    const totalLoans = await Loan.countDocuments({ status: "active" });
    const overdueLoans = await Loan.countDocuments({
      status: "active",
      dueDate: { $lt: /* @__PURE__ */ new Date() }
    });
    const pendingReservations = await Reservation.countDocuments({ status: "pending" });
    const totalFines = await Fine.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const stats = {
      totalBooks,
      totalLoans,
      overdueLoans,
      pendingReservations,
      totalFines: totalFines[0]?.total || 0,
      systemStatus: "healthy"
    };
    res.json(stats);
  } catch (error) {
    console.error("Librarian dashboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getLibrarianBooks(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const skip = (page - 1) * limit;
    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
          { isbn: { $regex: search, $options: "i" } }
        ]
      };
    }
    const books = await Book.find(query).sort({ title: 1 }).skip(skip).limit(limit);
    const total = await Book.countDocuments(query);
    const booksWithLoanInfo = await Promise.all(
      books.map(async (book) => {
        const activeLoans = await Loan.countDocuments({
          bookId: book._id,
          status: "active"
        });
        return {
          id: book._id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          genre: book.genre,
          publisher: book.publisher,
          publishedYear: book.publishedYear,
          description: book.description,
          coverImage: book.coverImage,
          totalCopies: book.totalCopies,
          availableCopies: book.availableCopies,
          currentLoans: activeLoans,
          location: book.location,
          language: book.language,
          pages: book.pages,
          hasDownload: book.hasDownload,
          hasReadOnline: book.hasReadOnline,
          categories: book.categories,
          addedDate: book.addedDate,
          status: book.availableCopies === 0 ? "out-of-stock" : book.availableCopies <= 2 ? "low-stock" : "available"
        };
      })
    );
    res.json({
      books: booksWithLoanInfo,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get librarian books error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function issueBook(req, res) {
  try {
    const librarian = req.user;
    const { userId, bookId, loanDays = 14 } = req.body;
    if (!userId || !bookId) {
      return res.status(400).json({ message: "User ID and Book ID are required" });
    }
    let user;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User$1.findById(userId);
    } else {
      user = await User$1.findOne({
        $or: [
          { userId },
          { email: userId }
        ]
      });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found. Please check the Student ID." });
    }
    let book;
    if (mongoose.Types.ObjectId.isValid(bookId)) {
      book = await Book.findById(bookId);
    } else {
      book = await Book.findOne({
        $or: [
          { isbn: bookId },
          { title: { $regex: bookId, $options: "i" } }
        ]
      });
    }
    if (!book) {
      return res.status(404).json({ message: "Book not found. Please check the Book ID/ISBN." });
    }
    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: "Book is not available for loan" });
    }
    const existingLoan = await Loan.findOne({
      userId: user._id,
      bookId: book._id,
      status: "active"
    });
    if (existingLoan) {
      return res.status(400).json({ message: "User already has this book on loan" });
    }
    const currentLoans = await Loan.countDocuments({
      userId: user._id,
      status: "active"
    });
    const borrowingLimit = 5;
    if (currentLoans >= borrowingLimit) {
      return res.status(400).json({
        message: `User has reached their borrowing limit of ${borrowingLimit} books. Please return some books before borrowing more.`
      });
    }
    const outstandingFines = await Fine.aggregate([
      { $match: { userId: user._id, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalFines = outstandingFines[0]?.total || 0;
    if (totalFines > 0) {
      return res.status(400).json({
        message: `User has outstanding fines of $${totalFines.toFixed(2)}. Please pay fines before borrowing books.`
      });
    }
    const overdueBooks = await Loan.countDocuments({
      userId: user._id,
      status: "active",
      dueDate: { $lt: /* @__PURE__ */ new Date() }
    });
    if (overdueBooks > 0) {
      return res.status(400).json({
        message: `User has ${overdueBooks} overdue book(s). Please return overdue books before borrowing new ones.`
      });
    }
    const loan = await Loan.create({
      userId: user._id,
      bookId: book._id,
      issuedBy: librarian._id,
      dueDate: calculateDueDate(loanDays)
    });
    await Book.findByIdAndUpdate(book._id, {
      $inc: { availableCopies: -1 }
    });
    const populatedLoan = await Loan.findById(loan._id).populate("userId", "name email userId").populate("bookId", "title author isbn");
    res.status(201).json({
      message: "Book issued successfully",
      loan: populatedLoan
    });
  } catch (error) {
    console.error("Issue book error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function returnBook(req, res) {
  try {
    const { loanId, condition = "good", notes } = req.body;
    if (!loanId) {
      return res.status(400).json({ message: "Loan ID is required" });
    }
    const loan = await Loan.findById(loanId).populate("userId", "name email").populate("bookId", "title author");
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }
    if (loan.status !== "active") {
      return res.status(400).json({ message: "Book is not currently on loan" });
    }
    const returnDate = /* @__PURE__ */ new Date();
    let fine = 0;
    if (returnDate > loan.dueDate) {
      fine = calculateOverdueFine(loan.dueDate, returnDate);
    }
    loan.returnDate = returnDate;
    loan.status = condition === "damaged" ? "damaged" : "returned";
    loan.fineAmount = fine;
    if (notes) loan.notes = notes;
    await loan.save();
    if (condition !== "lost" && condition !== "damaged") {
      await Book.findByIdAndUpdate(loan.bookId, {
        $inc: { availableCopies: 1 }
      });
    }
    if (fine > 0) {
      await Fine.create({
        userId: loan.userId,
        loanId: loan._id,
        amount: fine,
        reason: "overdue",
        description: `Overdue fine for "${loan.bookId.title}"`
      });
    }
    res.json({
      message: "Book returned successfully",
      loan,
      fine: fine > 0 ? fine : null
    });
  } catch (error) {
    console.error("Return book error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getLoans(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;
    let query = {};
    if (status) {
      query = { status };
    }
    const loans = await Loan.find(query).populate("userId", "name email").populate("bookId", "title author isbn").populate("issuedBy", "name").sort({ issueDate: -1 }).skip(skip).limit(limit);
    const total = await Loan.countDocuments(query);
    res.json({
      loans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get loans error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getOverdueBooks(req, res) {
  try {
    const overdueLoans = await Loan.find({
      status: "active",
      dueDate: { $lt: /* @__PURE__ */ new Date() }
    }).populate("userId", "name email").populate("bookId", "title author isbn").sort({ dueDate: 1 });
    const overdueWithFines = overdueLoans.map((loan) => {
      const overdueDays = Math.ceil((Date.now() - loan.dueDate.getTime()) / (24 * 60 * 60 * 1e3));
      const potentialFine = overdueDays * 0.5;
      return {
        ...loan.toObject(),
        overdueDays,
        potentialFine
      };
    });
    res.json(overdueWithFines);
  } catch (error) {
    console.error("Get overdue books error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getReservations(req, res) {
  try {
    const status = req.query.status;
    let query = {};
    if (status) {
      query = { status };
    }
    const expiredReservations = await Reservation.find({
      status: "ready",
      expiryDate: { $lt: /* @__PURE__ */ new Date() }
    });
    for (const reservation of expiredReservations) {
      reservation.status = "expired";
      reservation.notes = "Reservation expired - not picked up within 7 days";
      await reservation.save();
      await Notification.create({
        userId: reservation.userId,
        type: "general",
        title: "Reservation Expired",
        message: `Your reservation for "${reservation.bookId.title}" has expired because it was not picked up within 7 days.`,
        relatedReservationId: reservation._id
      });
    }
    const reservations = await Reservation.find(query).populate("userId", "name email").populate("bookId", "title author isbn").sort({ requestDate: 1 });
    res.json(reservations);
  } catch (error) {
    console.error("Get reservations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function searchUsers(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }
    const users = await User$1.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { userId: { $regex: q, $options: "i" } }
      ],
      role: { $ne: "admin" }
      // Don't show admin users
    }).select("name email userId role department createdAt lastLogin profilePicture").limit(20);
    const usersWithLoans = await Promise.all(
      users.map(async (user) => {
        const activeLoans = await Loan.countDocuments({
          userId: user._id,
          status: "active"
        });
        const overdueLoans = await Loan.countDocuments({
          userId: user._id,
          status: "active",
          dueDate: { $lt: /* @__PURE__ */ new Date() }
        });
        const totalFines = await Fine.aggregate([
          { $match: { userId: user._id, status: "pending" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        return {
          ...user.toObject(),
          activeLoans,
          overdueLoans,
          totalFines: totalFines[0]?.total || 0
        };
      })
    );
    res.json(usersWithLoans);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getUserLoans(req, res) {
  try {
    const { id } = req.params;
    const loans = await Loan.find({ userId: id }).populate("bookId", "title author isbn").populate("issuedBy", "name").sort({ issueDate: -1 });
    res.json(loans);
  } catch (error) {
    console.error("Get user loans error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getUserActivity(req, res) {
  try {
    const { id } = req.params;
    const loans = await Loan.find({ userId: id }).populate("bookId", "title author isbn").populate("issuedBy", "name").sort({ issueDate: -1 });
    const fines = await Fine.find({ userId: id }).populate("loanId", "bookId issueDate returnDate").sort({ dateIssued: -1 });
    const reservations = await Reservation.find({ userId: id }).populate("bookId", "title author isbn").sort({ requestDate: -1 });
    const audits = await InventoryAudit.find({ auditedBy: id }).populate("bookId", "title author isbn").sort({ auditDate: -1 });
    const activity = [];
    for (const loan of loans) {
      activity.push({
        type: "loan-issued",
        date: loan.issueDate,
        details: {
          book: loan.bookId,
          issuedBy: loan.issuedBy,
          dueDate: loan.dueDate,
          status: loan.status
        }
      });
      if (loan.returnDate) {
        activity.push({
          type: "loan-returned",
          date: loan.returnDate,
          details: {
            book: loan.bookId,
            issuedBy: loan.issuedBy,
            dueDate: loan.dueDate,
            status: loan.status,
            fineAmount: loan.fineAmount
          }
        });
      }
    }
    for (const fine of fines) {
      activity.push({
        type: "fine",
        date: fine.dateIssued,
        details: {
          amount: fine.amount,
          reason: fine.reason,
          description: fine.description,
          status: fine.status,
          loan: fine.loanId
        }
      });
      if (fine.datePaid) {
        activity.push({
          type: "fine-paid",
          date: fine.datePaid,
          details: {
            amount: fine.amount,
            paidAmount: fine.paidAmount,
            status: fine.status,
            loan: fine.loanId
          }
        });
      }
    }
    for (const reservation of reservations) {
      activity.push({
        type: "reservation",
        date: reservation.requestDate,
        details: {
          book: reservation.bookId,
          status: reservation.status,
          priority: reservation.priority,
          expiryDate: reservation.expiryDate
        }
      });
      if (reservation.status === "fulfilled" && reservation.expiryDate) {
        activity.push({
          type: "reservation-fulfilled",
          date: reservation.expiryDate,
          details: {
            book: reservation.bookId,
            status: reservation.status,
            priority: reservation.priority
          }
        });
      }
    }
    for (const audit of audits) {
      activity.push({
        type: "inventory-audit",
        date: audit.auditDate,
        details: {
          book: audit.bookId,
          expectedCount: audit.expectedCount,
          actualCount: audit.actualCount,
          discrepancy: audit.discrepancy,
          status: audit.status,
          notes: audit.notes
        }
      });
      if (audit.resolved && audit.resolvedDate) {
        activity.push({
          type: "inventory-audit-resolved",
          date: audit.resolvedDate,
          details: {
            book: audit.bookId,
            status: audit.status,
            notes: audit.notes
          }
        });
      }
    }
    activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ activity });
  } catch (error) {
    console.error("Get user activity error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getInventoryAudits(req, res) {
  try {
    const { bookId, status, resolved } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let query = {};
    if (bookId) query.bookId = bookId;
    if (status) query.status = status;
    if (resolved !== void 0) query.resolved = resolved === "true";
    const audits = await InventoryAudit.find(query).populate("bookId", "title author isbn").populate("auditedBy", "name email").populate("resolvedBy", "name email").sort({ auditDate: -1 }).skip(skip).limit(limit);
    const total = await InventoryAudit.countDocuments(query);
    res.json({
      audits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get inventory audits error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function createInventoryAudit(req, res) {
  try {
    const librarian = req.user;
    const { bookId, expectedCount, actualCount, notes } = req.body;
    if (!bookId || expectedCount === void 0 || actualCount === void 0) {
      return res.status(400).json({ message: "Book ID, expected count, and actual count are required" });
    }
    if (typeof expectedCount !== "number" || expectedCount < 0) {
      return res.status(400).json({ message: "Expected count must be a non-negative number" });
    }
    if (typeof actualCount !== "number" || actualCount < 0) {
      return res.status(400).json({ message: "Actual count must be a non-negative number" });
    }
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    const discrepancy = actualCount - expectedCount;
    let status = "match";
    if (discrepancy < 0) {
      status = "shortage";
    } else if (discrepancy > 0) {
      status = "surplus";
    }
    const audit = await InventoryAudit.create({
      bookId,
      auditedBy: librarian._id,
      expectedCount,
      actualCount,
      discrepancy,
      status,
      notes: notes || ""
    });
    if (discrepancy !== 0) {
      const activeLoans = await Loan.countDocuments({
        bookId: book._id,
        status: "active"
      });
      const pendingReservations = await Reservation.countDocuments({
        bookId: book._id,
        status: "pending"
      });
      const newTotalCopies = actualCount;
      if (newTotalCopies < activeLoans) {
        return res.status(400).json({
          message: `Cannot set total copies to ${newTotalCopies}. There are currently ${activeLoans} active loans for this book. Please handle active loans first.`
        });
      }
      const newAvailableCopies = Math.max(0, newTotalCopies - activeLoans);
      if (newAvailableCopies === 0 && pendingReservations > 0) {
        console.warn(`Warning: Audit resulted in 0 available copies but there are ${pendingReservations} pending reservations for book "${book.title}"`);
      }
      await Book.findByIdAndUpdate(book._id, {
        totalCopies: newTotalCopies,
        availableCopies: newAvailableCopies,
        lastUpdated: /* @__PURE__ */ new Date()
      });
      console.log(`Audit ${audit._id}: Updated book ${book.title} quantities - Total: ${book.totalCopies} → ${newTotalCopies}, Available: ${book.availableCopies} → ${newAvailableCopies}, Active Loans: ${activeLoans}`);
    }
    const populatedAudit = await InventoryAudit.findById(audit._id).populate("bookId", "title author isbn").populate("auditedBy", "name email");
    res.status(201).json({
      message: "Inventory audit created and book quantities updated in real-time",
      audit: populatedAudit,
      quantitiesUpdated: discrepancy !== 0
    });
  } catch (error) {
    console.error("Create inventory audit error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function resolveInventoryAudit(req, res) {
  try {
    const librarian = req.user;
    const { id } = req.params;
    const { resolved, notes } = req.body;
    const audit = await InventoryAudit.findById(id).populate("bookId", "title author isbn");
    if (!audit) {
      return res.status(404).json({ message: "Inventory audit not found" });
    }
    if (audit.resolved) {
      return res.status(400).json({ message: "Audit is already resolved" });
    }
    audit.resolved = resolved || true;
    audit.resolvedBy = librarian._id;
    audit.resolvedDate = /* @__PURE__ */ new Date();
    if (notes) audit.notes = notes;
    await audit.save();
    const currentBook = await Book.findById(audit.bookId);
    const currentActiveLoans = await Loan.countDocuments({
      bookId: audit.bookId,
      status: "active"
    });
    const populatedAudit = await InventoryAudit.findById(audit._id).populate("bookId", "title author isbn").populate("auditedBy", "name email").populate("resolvedBy", "name email");
    console.log(`Audit ${audit._id} resolved by ${librarian.name}: Book "${currentBook?.title}" confirmed with ${currentBook?.totalCopies} total copies, ${currentBook?.availableCopies} available, ${currentActiveLoans} on loan`);
    res.json({
      message: "Inventory audit resolved and confirmed successfully",
      audit: populatedAudit,
      currentBookState: {
        totalCopies: currentBook?.totalCopies,
        availableCopies: currentBook?.availableCopies,
        activeLoans: currentActiveLoans
      }
    });
  } catch (error) {
    console.error("Resolve inventory audit error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateReservation(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!["pending", "ready", "fulfilled", "cancelled", "expired"].includes(status)) {
      return res.status(400).json({ message: "Invalid reservation status" });
    }
    const reservation = await Reservation.findById(id).populate("userId", "name email").populate("bookId", "title author");
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    const oldStatus = reservation.status;
    reservation.status = status;
    if (notes) reservation.notes = notes;
    if (status === "ready") {
      reservation.expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    }
    await reservation.save();
    if (status === "ready" && oldStatus === "pending") {
      const book = await Book.findById(reservation.bookId);
      if (book && book.availableCopies > 0) {
      } else if (book) {
        console.log(`Warning: Marking reservation as ready for book with ${book.availableCopies} available copies`);
      }
    } else if (status === "fulfilled" && oldStatus === "ready") {
      const book = await Book.findById(reservation.bookId);
      if (book && book.availableCopies > 0) {
        await Book.findByIdAndUpdate(reservation.bookId, {
          $inc: { availableCopies: -1 }
        });
      }
    } else if (status === "cancelled" && oldStatus === "ready") {
    }
    let notificationTitle = "";
    let notificationMessage = "";
    switch (status) {
      case "ready":
        notificationTitle = "Book Ready for Pickup";
        notificationMessage = `Your reserved book "${reservation.bookId.title}" is ready for pickup. Please collect it within 7 days.`;
        break;
      case "cancelled":
        notificationTitle = "Reservation Cancelled";
        notificationMessage = `Your reservation for "${reservation.bookId.title}" has been cancelled.`;
        break;
      case "expired":
        notificationTitle = "Reservation Expired";
        notificationMessage = `Your reservation for "${reservation.bookId.title}" has expired.`;
        break;
      case "fulfilled":
        notificationTitle = "Reservation Fulfilled";
        notificationMessage = `Your reservation for "${reservation.bookId.title}" has been fulfilled.`;
        break;
    }
    if (notificationTitle) {
      await Notification.create({
        userId: reservation.userId,
        type: "reservation_ready",
        title: notificationTitle,
        message: notificationMessage,
        relatedReservationId: reservation._id
      });
    }
    res.json({
      message: "Reservation updated successfully",
      reservation
    });
  } catch (error) {
    console.error("Update reservation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function createFine(req, res) {
  try {
    const librarian = req.user;
    const { userId, loanId, amount, reason, description } = req.body;
    if (!userId || !amount || !reason) {
      return res.status(400).json({ message: "User ID, amount, and reason are required" });
    }
    if (!["overdue", "damage", "lost", "replacement", "other"].includes(reason)) {
      return res.status(400).json({ message: "Invalid fine reason" });
    }
    const user = await User$1.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const fine = await Fine.create({
      userId,
      loanId: loanId || null,
      amount,
      reason,
      description: description || `${reason} fine`,
      dateIssued: /* @__PURE__ */ new Date()
    });
    await Notification.create({
      userId,
      type: "fine",
      title: "New Fine Issued",
      message: `A fine of $${amount.toFixed(2)} has been issued for: ${description || reason}`,
      relatedFineId: fine._id
    });
    res.status(201).json({
      message: "Fine created successfully",
      fine
    });
  } catch (error) {
    console.error("Create fine error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateFine(req, res) {
  try {
    const librarian = req.user;
    const { id } = req.params;
    const { status, paidAmount, waived, waivedReason } = req.body;
    if (!["pending", "paid", "partial", "waived", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid fine status" });
    }
    const fine = await Fine.findById(id).populate("userId", "name email");
    if (!fine) {
      return res.status(404).json({ message: "Fine not found" });
    }
    fine.status = status;
    if (status === "paid" || status === "partial") {
      fine.paidAmount = paidAmount || fine.amount;
      fine.datePaid = /* @__PURE__ */ new Date();
    }
    if (status === "waived" || waived) {
      fine.waived = true;
      fine.waivedBy = librarian._id;
      fine.waivedReason = waivedReason;
      fine.status = "waived";
    }
    await fine.save();
    let notificationMessage = "";
    switch (status) {
      case "paid":
        notificationMessage = `Your fine of $${fine.amount.toFixed(2)} has been marked as paid.`;
        break;
      case "waived":
        notificationMessage = `Your fine of $${fine.amount.toFixed(2)} has been waived.`;
        break;
      case "cancelled":
        notificationMessage = `Your fine of $${fine.amount.toFixed(2)} has been cancelled.`;
        break;
    }
    if (notificationMessage) {
      await Notification.create({
        userId: fine.userId,
        type: "fine",
        title: "Fine Status Updated",
        message: notificationMessage,
        relatedFineId: fine._id
      });
    }
    res.json({
      message: "Fine updated successfully",
      fine
    });
  } catch (error) {
    console.error("Update fine error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getFines(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;
    let query = {};
    if (status) {
      query = { status };
    }
    const fines = await Fine.find(query).populate("userId", "name email").populate("loanId").sort({ dateIssued: -1 }).skip(skip).limit(limit);
    const total = await Fine.countDocuments(query);
    res.json({
      fines,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get fines error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function createBook(req, res) {
  try {
    const librarian = req.user;
    const {
      title,
      author,
      isbn,
      genre,
      publishedYear,
      publisher,
      description,
      coverImage,
      totalCopies,
      categories,
      language,
      pages,
      hasDownload,
      hasReadOnline,
      location
    } = req.body;
    if (!title || !author || !isbn || !publisher || !publishedYear || !genre || !location) {
      return res.status(400).json({
        message: "Title, author, ISBN, publisher, publication year, genre, and location are required"
      });
    }
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.status(400).json({ message: "Book with this ISBN already exists" });
    }
    const newBook = await Book.create({
      title,
      author,
      isbn,
      genre,
      publishedYear,
      publisher,
      description,
      coverImage,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1,
      categories: categories || [],
      language: language || "English",
      pages,
      hasDownload: hasDownload || false,
      hasReadOnline: hasReadOnline || false,
      location
    });
    res.status(201).json({
      message: "Book created successfully",
      book: {
        id: newBook._id,
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn,
        genre: newBook.genre,
        publisher: newBook.publisher,
        publishedYear: newBook.publishedYear,
        description: newBook.description,
        coverImage: newBook.coverImage,
        totalCopies: newBook.totalCopies,
        availableCopies: newBook.availableCopies,
        location: newBook.location,
        language: newBook.language,
        pages: newBook.pages,
        hasDownload: newBook.hasDownload,
        hasReadOnline: newBook.hasReadOnline,
        categories: newBook.categories,
        addedDate: newBook.addedDate
      }
    });
  } catch (error) {
    console.error("Create book error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateBook(req, res) {
  try {
    const librarian = req.user;
    const { id } = req.params;
    const updateData = req.body;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (updateData.isbn && updateData.isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn: updateData.isbn });
      if (existingBook) {
        return res.status(400).json({ message: "ISBN is already taken" });
      }
    }
    if (updateData.totalCopies !== void 0 && updateData.totalCopies < book.totalCopies) {
      const reduction = book.totalCopies - updateData.totalCopies;
      if (book.availableCopies - reduction < 0) {
        return res.status(400).json({
          message: `Cannot reduce total copies to ${updateData.totalCopies}. There are ${book.availableCopies} available copies and ${book.totalCopies - book.availableCopies} on loan.`
        });
      }
      const pendingReservations = await Reservation.countDocuments({
        bookId: id,
        status: "pending"
      });
      if (pendingReservations > 0) {
        return res.status(400).json({
          message: `Cannot reduce copies. There are ${pendingReservations} pending reservation(s) for this book. Please handle reservations first.`
        });
      }
      updateData.availableCopies = Math.max(0, book.availableCopies - reduction);
    }
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      { ...updateData, lastUpdated: /* @__PURE__ */ new Date() },
      { new: true }
    );
    res.json({
      message: "Book updated successfully",
      book: {
        id: updatedBook._id,
        title: updatedBook.title,
        author: updatedBook.author,
        isbn: updatedBook.isbn,
        genre: updatedBook.genre,
        publisher: updatedBook.publisher,
        publishedYear: updatedBook.publishedYear,
        description: updatedBook.description,
        coverImage: updatedBook.coverImage,
        totalCopies: updatedBook.totalCopies,
        availableCopies: updatedBook.availableCopies,
        location: updatedBook.location,
        language: updatedBook.language,
        pages: updatedBook.pages,
        hasDownload: updatedBook.hasDownload,
        hasReadOnline: updatedBook.hasReadOnline,
        categories: updatedBook.categories,
        addedDate: updatedBook.addedDate,
        lastUpdated: updatedBook.lastUpdated
      }
    });
  } catch (error) {
    console.error("Update book error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getBook(req, res) {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    const activeLoans = await Loan.countDocuments({
      bookId: book._id,
      status: "active"
    });
    const pendingReservations = await Reservation.countDocuments({
      bookId: book._id,
      status: "pending"
    });
    const bookWithDetails = {
      ...book.toObject(),
      activeLoans,
      pendingReservations,
      status: book.availableCopies === 0 ? "out-of-stock" : book.availableCopies <= 2 ? "low-stock" : "available"
    };
    res.json(bookWithDetails);
  } catch (error) {
    console.error("Get book error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function updateBookStatus(req, res) {
  try {
    const { id } = req.params;
    const { action, notes, affectedCopies = 1 } = req.body;
    if (!["mark_lost", "mark_damaged", "mark_available", "adjust_copies"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    let updateData = { lastUpdated: /* @__PURE__ */ new Date() };
    let message = "";
    let reservationUpdates = [];
    const pendingReservations = await Reservation.find({
      bookId: id,
      status: "pending"
    }).populate("userId", "name email");
    switch (action) {
      case "mark_lost":
        if (book.availableCopies - affectedCopies <= 0 && pendingReservations.length > 0) {
          return res.status(400).json({
            message: `Cannot mark ${affectedCopies} copy(ies) as lost. There are ${pendingReservations.length} pending reservation(s) for this book.`,
            reservations: pendingReservations
          });
        }
        updateData.availableCopies = Math.max(0, book.availableCopies - affectedCopies);
        updateData.totalCopies = Math.max(0, book.totalCopies - affectedCopies);
        message = `Marked ${affectedCopies} copy(ies) as lost`;
        break;
      case "mark_damaged":
        if (book.availableCopies - affectedCopies <= 0 && pendingReservations.length > 0) {
          return res.status(400).json({
            message: `Cannot mark ${affectedCopies} copy(ies) as damaged. There are ${pendingReservations.length} pending reservation(s) for this book.`,
            reservations: pendingReservations
          });
        }
        updateData.availableCopies = Math.max(0, book.availableCopies - affectedCopies);
        message = `Marked ${affectedCopies} copy(ies) as damaged`;
        break;
      case "mark_available":
        updateData.availableCopies = book.availableCopies + affectedCopies;
        message = `Marked ${affectedCopies} copy(ies) as available`;
        if (pendingReservations.length > 0) {
          const readyReservations = pendingReservations.slice(0, Math.min(affectedCopies, pendingReservations.length));
          for (const reservation of readyReservations) {
            reservation.status = "ready";
            reservation.expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
            reservation.notes = "Automatically marked ready - book became available";
            await reservation.save();
            await Notification.create({
              userId: reservation.userId._id,
              type: "reservation_ready",
              title: "Book Ready for Pickup",
              message: `Your reserved book "${book.title}" is now ready for pickup. Please collect it within 7 days.`,
              relatedReservationId: reservation._id
            });
            reservationUpdates.push(reservation);
          }
          if (readyReservations.length > 0) {
            message += `. ${readyReservations.length} reservation(s) automatically marked as ready.`;
          }
        }
        break;
      case "adjust_copies":
        if (affectedCopies < book.totalCopies - book.availableCopies) {
          return res.status(400).json({
            message: `Cannot reduce total copies to ${affectedCopies}. There are ${book.totalCopies - book.availableCopies} copies currently on loan.`
          });
        }
        if (affectedCopies < book.availableCopies && pendingReservations.length > 0) {
          return res.status(400).json({
            message: `Cannot reduce copies to ${affectedCopies}. There are ${pendingReservations.length} pending reservation(s) for this book.`,
            reservations: pendingReservations
          });
        }
        updateData.totalCopies = affectedCopies;
        updateData.availableCopies = Math.min(book.availableCopies, affectedCopies);
        message = `Adjusted total copies to ${affectedCopies}`;
        break;
    }
    const updatedBook = await Book.findByIdAndUpdate(id, updateData, { new: true });
    res.json({
      message,
      book: updatedBook,
      reservationUpdates
    });
  } catch (error) {
    console.error("Update book status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function sendNotification(req, res) {
  try {
    const { userId, type, title, message } = req.body;
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!["overdue", "reservation_ready", "fine", "general", "book_reminder"].includes(type)) {
      return res.status(400).json({ message: "Invalid notification type" });
    }
    const user = await User$1.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      sent: true,
      sentDate: /* @__PURE__ */ new Date()
    });
    res.status(201).json({
      message: "Notification sent successfully",
      notification
    });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["general", "service", "book_request", "complaint", "suggestion"],
    default: "general"
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved"],
    default: "pending"
  },
  response: String,
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  respondedAt: Date
}, { timestamps: true });
const bookSuggestionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  reason: String,
  isbn: String,
  publisher: String,
  status: {
    type: String,
    enum: ["pending", "under_review", "approved", "rejected", "purchased"],
    default: "pending"
  },
  reviewNotes: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date
}, { timestamps: true });
const Feedback = mongoose.model("Feedback", feedbackSchema);
const BookSuggestion = mongoose.model("BookSuggestion", bookSuggestionSchema);
async function getStudentStats(req, res) {
  try {
    const userId = req.userId;
    const currentLoans = await Loan.countDocuments({
      userId,
      status: "active"
    });
    const totalBorrowed = await Loan.countDocuments({ userId });
    const outstandingFines = await Fine.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const activeReservations = await Reservation.countDocuments({
      userId,
      status: { $in: ["pending", "ready"] }
    });
    const borrowingLimit = 5;
    const availableToLoan = Math.max(0, borrowingLimit - currentLoans);
    const stats = {
      currentLoans,
      totalBorrowed,
      outstandingFines: outstandingFines[0]?.total || 0,
      activeReservations,
      borrowingLimit,
      availableToLoan
    };
    res.json(stats);
  } catch (error) {
    console.error("Student stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getBooksForStudent(req, res) {
  try {
    const { search = "", filter = "all", page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};
    let sort = { title: 1 };
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
          { categories: { $in: [new RegExp(search, "i")] } },
          { genre: { $regex: search, $options: "i" } }
        ]
      };
    }
    switch (filter) {
      case "available":
        query.availableCopies = { $gt: 0 };
        break;
      case "new":
        query.addedDate = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3) };
        sort = { addedDate: -1 };
        break;
      case "popular":
        sort = { totalCopies: -1 };
        break;
    }
    const books = await Book.find(query).sort(sort).skip(skip).limit(parseInt(limit));
    const total = await Book.countDocuments(query);
    res.json({
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get books for student error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getStudentLoans(req, res) {
  try {
    const userId = req.userId;
    const { status } = req.query;
    let query = { userId };
    if (status) {
      query.status = status;
    }
    const loans = await Loan.find(query).populate("bookId", "title author isbn genre").populate("issuedBy", "name").sort({ issueDate: -1 });
    res.json(loans);
  } catch (error) {
    console.error("Get student loans error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function renewLoan(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const loan = await Loan.findOne({ _id: id, userId, status: "active" });
    if (!loan) {
      return res.status(404).json({ message: "Loan not found or not active" });
    }
    if (loan.renewalCount >= loan.maxRenewals) {
      return res.status(400).json({ message: "Maximum renewals reached" });
    }
    if (/* @__PURE__ */ new Date() > loan.dueDate) {
      return res.status(400).json({ message: "Cannot renew overdue books. Please contact the library." });
    }
    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 14);
    await Loan.findByIdAndUpdate(id, {
      dueDate: newDueDate,
      $inc: { renewalCount: 1 }
    });
    res.json({ message: "Loan renewed successfully", newDueDate });
  } catch (error) {
    console.error("Renew loan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getStudentReservations(req, res) {
  try {
    const userId = req.userId;
    const reservations = await Reservation.find({ userId }).populate("bookId", "title author isbn genre").sort({ requestDate: -1 });
    res.json(reservations);
  } catch (error) {
    console.error("Get student reservations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function createReservation(req, res) {
  try {
    const userId = req.userId;
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ message: "Book ID is required" });
    }
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.availableCopies > 0) {
      return res.status(400).json({ message: "Book is currently available. Visit the library to borrow it." });
    }
    const existingReservation = await Reservation.findOne({
      userId,
      bookId,
      status: { $in: ["pending", "ready"] }
    });
    if (existingReservation) {
      return res.status(400).json({ message: "You already have a reservation for this book" });
    }
    const lastReservation = await Reservation.findOne({ bookId }).sort({ priority: -1 });
    const priority = (lastReservation?.priority || 0) + 1;
    const reservation = await Reservation.create({
      userId,
      bookId,
      priority,
      status: "pending"
    });
    res.status(201).json({
      message: "Reservation created successfully",
      reservation
    });
  } catch (error) {
    console.error("Create reservation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function cancelReservation(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    if (reservation.status === "fulfilled") {
      return res.status(400).json({ message: "Cannot cancel fulfilled reservation" });
    }
    await Reservation.findByIdAndUpdate(id, { status: "cancelled" });
    res.json({ message: "Reservation cancelled successfully" });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getStudentFines(req, res) {
  try {
    const userId = req.userId;
    const fines = await Fine.find({ userId }).populate("loanId").sort({ dateIssued: -1 });
    res.json(fines);
  } catch (error) {
    console.error("Get student fines error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getStudentNotifications(req, res) {
  try {
    const userId = req.userId;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    console.error("Get student notifications error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function markNotificationAsRead(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true, readDate: /* @__PURE__ */ new Date() }
    );
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function submitFeedback(req, res) {
  try {
    const userId = req.userId;
    const { message, type = "general" } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Feedback message is required" });
    }
    const feedback = await Feedback.create({
      userId,
      message: message.trim(),
      type
    });
    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function submitBookSuggestion(req, res) {
  try {
    const userId = req.userId;
    const { title, author, reason, isbn, publisher } = req.body;
    if (!title || !author) {
      return res.status(400).json({ message: "Title and author are required" });
    }
    if (isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        return res.status(400).json({ message: "This book already exists in our collection" });
      }
    }
    const suggestion = await BookSuggestion.create({
      userId,
      title: title.trim(),
      author: author.trim(),
      reason: reason?.trim(),
      isbn,
      publisher
    });
    res.status(201).json({
      message: "Book suggestion submitted successfully",
      suggestion
    });
  } catch (error) {
    console.error("Submit book suggestion error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getStudentProfile(req, res) {
  try {
    const userId = req.userId;
    const user = await User$1.findById(userId).select("-passwordHash -resetToken -resetTokenExpiry -sessions");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const currentLoans = await Loan.countDocuments({ userId, status: "active" });
    const totalBorrowed = await Loan.countDocuments({ userId });
    const outstandingFines = await Fine.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const profile = {
      ...user.toObject(),
      currentLoans,
      totalBorrowed,
      outstandingFines: outstandingFines[0]?.total || 0
    };
    res.json(profile);
  } catch (error) {
    console.error("Get student profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function borrowBook(req, res) {
  try {
    const userId = req.userId;
    const { bookId, loanDays = 14 } = req.body;
    if (!bookId) {
      return res.status(400).json({ message: "Book ID is required" });
    }
    const user = await User$1.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.accountStatus !== "active") {
      return res.status(400).json({ message: "Account is not active. Please contact the library." });
    }
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: "Book is not available for loan. Please reserve it instead." });
    }
    const existingLoan = await Loan.findOne({
      userId,
      bookId,
      status: "active"
    });
    if (existingLoan) {
      return res.status(400).json({ message: "You already have this book on loan" });
    }
    const currentLoans = await Loan.countDocuments({
      userId,
      status: "active"
    });
    const borrowingLimit = 5;
    if (currentLoans >= borrowingLimit) {
      return res.status(400).json({
        message: `You have reached your borrowing limit of ${borrowingLimit} books. Please return some books before borrowing more.`
      });
    }
    const outstandingFines = await Fine.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalFines = outstandingFines[0]?.total || 0;
    if (totalFines > 0) {
      return res.status(400).json({
        message: `You have outstanding fines of $${totalFines.toFixed(2)}. Please pay your fines before borrowing books.`
      });
    }
    const overdueBooks = await Loan.countDocuments({
      userId,
      status: "active",
      dueDate: { $lt: /* @__PURE__ */ new Date() }
    });
    if (overdueBooks > 0) {
      return res.status(400).json({
        message: `You have ${overdueBooks} overdue book(s). Please return overdue books before borrowing new ones.`
      });
    }
    const dueDate = /* @__PURE__ */ new Date();
    dueDate.setDate(dueDate.getDate() + loanDays);
    const loan = await Loan.create({
      userId,
      bookId,
      issuedBy: userId,
      // Self-service loan
      dueDate,
      status: "active"
    });
    await Book.findByIdAndUpdate(bookId, {
      $inc: { availableCopies: -1 }
    });
    const populatedLoan = await Loan.findById(loan._id).populate("bookId", "title author isbn genre");
    res.status(201).json({
      message: "Book borrowed successfully",
      loan: populatedLoan,
      dueDate: dueDate.toISOString()
    });
  } catch (error) {
    console.error("Borrow book error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function returnStudentBook(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const loan = await Loan.findOne({ _id: id, userId, status: "active" });
    if (!loan) {
      return res.status(404).json({ message: "Loan not found or not active" });
    }
    const returnDate = /* @__PURE__ */ new Date();
    let fine = 0;
    if (returnDate > loan.dueDate) {
      const daysOverdue = Math.ceil((returnDate.getTime() - loan.dueDate.getTime()) / (1e3 * 60 * 60 * 24));
      fine = daysOverdue * 0.5;
    }
    loan.returnDate = returnDate;
    loan.status = "returned";
    loan.fineAmount = fine;
    await loan.save();
    await Book.findByIdAndUpdate(loan.bookId, {
      $inc: { availableCopies: 1 }
    });
    if (fine > 0) {
      await Fine.create({
        userId: loan.userId,
        loanId: loan._id,
        amount: fine,
        reason: "overdue",
        description: `Overdue fine for book return`
      });
    }
    res.json({
      message: "Book returned successfully",
      fine: fine > 0 ? fine : null
    });
  } catch (error) {
    console.error("Return book error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
const SearchHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  query: { type: String, required: true },
  date: { type: Date, default: Date.now }
});
const SearchHistory = mongoose.model("SearchHistory", SearchHistorySchema, "search_history");
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: String
  // Add any other fields you use
});
const User = mongoose.models.User || mongoose.model("User", UserSchema, "users");
const router$1 = Router();
async function searchBooks(req, res) {
  try {
    const {
      q = "",
      // Basic search query
      refineQuery = "",
      // Search within results
      title = "",
      author = "",
      genre = "",
      // Can be array for multiple genres
      language = "",
      fromDate = "",
      toDate = "",
      isbn = "",
      filter = "all",
      // all, available, new, popular, download, online
      sortBy = "relevance",
      // relevance, title, author, date
      page = 1,
      limit = 20
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};
    let sort = { title: 1 };
    const searchTerms = [];
    if (q) {
      searchTerms.push(
        { title: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
        { categories: { $in: [new RegExp(q, "i")] } },
        { genre: { $regex: q, $options: "i" } },
        { isbn: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      );
    }
    if (refineQuery) {
      searchTerms.push(
        { title: { $regex: refineQuery, $options: "i" } },
        { author: { $regex: refineQuery, $options: "i" } },
        { categories: { $in: [new RegExp(refineQuery, "i")] } },
        { description: { $regex: refineQuery, $options: "i" } }
      );
    }
    if (title) {
      query.title = { $regex: title, $options: "i" };
    }
    if (author) {
      searchTerms.push({ author: { $regex: author, $options: "i" } });
    }
    const genres = Array.isArray(genre) ? genre : genre ? [genre] : [];
    if (genres.length > 0 && !genres.includes("All fields")) {
      const genreConditions = genres.map((g) => ({ genre: { $regex: g, $options: "i" } }));
      if (genreConditions.length === 1) {
        query.genre = genreConditions[0].genre;
      } else {
        query.$or = query.$or ? query.$or.concat(genreConditions) : genreConditions;
      }
    }
    if (language && language !== "All Languages" && language !== "Any Language") {
      query.language = { $regex: language, $options: "i" };
    }
    if (isbn) {
      searchTerms.push({ isbn: { $regex: isbn, $options: "i" } });
    }
    if (fromDate || toDate) {
      const dateQuery = {};
      if (fromDate) {
        dateQuery.$gte = parseInt(fromDate);
      }
      if (toDate) {
        dateQuery.$lte = parseInt(toDate);
      }
      query.publishedYear = dateQuery;
    }
    if (searchTerms.length > 0) {
      if (q && refineQuery) {
        const mainSearchTerms = [];
        const refineSearchTerms = [];
        if (q) {
          mainSearchTerms.push(
            { title: { $regex: q, $options: "i" } },
            { author: { $regex: q, $options: "i" } },
            { categories: { $in: [new RegExp(q, "i")] } },
            { genre: { $regex: q, $options: "i" } },
            { isbn: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } }
          );
        }
        if (refineQuery) {
          refineSearchTerms.push(
            { title: { $regex: refineQuery, $options: "i" } },
            { author: { $regex: refineQuery, $options: "i" } },
            { categories: { $in: [new RegExp(refineQuery, "i")] } },
            { description: { $regex: refineQuery, $options: "i" } }
          );
        }
        query.$and = [
          { $or: mainSearchTerms },
          { $or: refineSearchTerms }
        ];
      } else {
        query.$or = query.$or ? query.$or.concat(searchTerms) : searchTerms;
      }
    }
    switch (filter) {
      case "available":
        query.availableCopies = { $gt: 0 };
        break;
      case "new":
        query.addedDate = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3) };
        break;
      case "popular":
        break;
      case "download":
        query.hasDownload = true;
        break;
      case "online":
        query.hasReadOnline = true;
        break;
    }
    switch (sortBy) {
      case "title":
        sort = { title: 1 };
        break;
      case "author":
        sort = { author: 1 };
        break;
      case "date":
        sort = { publishedYear: -1 };
        break;
      case "relevance":
      default:
        if (q || refineQuery) {
          sort = { title: 1 };
        } else {
          sort = { title: 1 };
        }
        break;
    }
    if (filter === "new") {
      sort = { addedDate: -1 };
    } else if (filter === "popular") {
      sort = { totalCopies: -1 };
    }
    console.log("Search query:", JSON.stringify(query, null, 2));
    console.log("Sort:", sort);
    const books = await Book.find(query).sort(sort).skip(skip).limit(parseInt(limit)).select("title author isbn genre publishedYear publisher description coverImage totalCopies availableCopies categories language pages location addedDate hasDownload hasReadOnline");
    const total = await Book.countDocuments(query);
    res.json({
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      query: req.query,
      appliedFilters: {
        genres,
        language: language !== "Any Language" ? language : null,
        accessType: filter !== "all" ? filter : null,
        sortBy
      }
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
async function getSearchSuggestions(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }
    const suggestions = await Book.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { author: { $regex: q, $options: "i" } },
            { genre: { $regex: q, $options: "i" } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          titles: { $addToSet: "$title" },
          authors: { $addToSet: "$author" },
          genres: { $addToSet: "$genre" }
        }
      },
      {
        $project: {
          suggestions: {
            $slice: [
              {
                $concatArrays: [
                  { $slice: ["$titles", 5] },
                  { $slice: ["$authors", 3] },
                  { $slice: ["$genres", 2] }
                ]
              },
              10
            ]
          }
        }
      }
    ]);
    res.json({
      suggestions: suggestions[0]?.suggestions || []
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
router$1.post("/history", verifyTokenWithSession, async (req, res) => {
  try {
    const userId = req.userId;
    const { query } = req.body;
    console.log("POST /api/search/history", { userId, query });
    console.log("Request body:", req.body);
    if (!query || typeof query !== "string" || !query.trim()) {
      console.error("Query missing or invalid in request body");
      return res.status(400).json({ error: "Query required" });
    }
    console.log("Looking up user...");
    const user = await User.findById(String(userId));
    if (!user) {
      console.error("User not found for userId:", userId);
      return res.status(400).json({ error: "User not found" });
    }
    console.log("User found:", user._id);
    console.log("Creating search history...");
    const newHistory = await SearchHistory.create({ userId, query });
    console.log("Created search history:", newHistory);
    const userHistory = await SearchHistory.find({ userId }).sort({ date: -1 });
    if (userHistory.length > 10) {
      const idsToDelete = userHistory.slice(10).map((doc) => doc._id);
      await SearchHistory.deleteMany({ _id: { $in: idsToDelete } });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving search history:", err);
    res.status(500).json({ error: "Failed to save search history" });
  }
});
router$1.get("/history", verifyTokenWithSession, async (req, res) => {
  const userId = req.userId;
  const history = await SearchHistory.find({ userId }).sort({ date: -1 }).limit(10);
  res.json(history);
});
router$1.delete("/history", verifyTokenWithSession, async (req, res) => {
  const userId = req.userId;
  await SearchHistory.deleteMany({ userId });
  res.json({ success: true });
});
router$1.post("/history/test", async (req, res) => {
  try {
    const { userId, query } = req.body;
    if (!userId || !query) return res.status(400).json({ error: "userId and query required" });
    const user = await User.findById(String(userId));
    if (!user) return res.status(404).json({ error: "User not found" });
    const newHistory = await SearchHistory.create({ userId, query });
    res.json({ success: true, newHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const searchRoutes = router$1;
const router = Router();
router.get("/category-counts", async (req, res) => {
  try {
    const counts = await Book.aggregate([
      { $match: { categories: { $exists: true, $ne: [] } } },
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } }
    ]);
    res.json(counts);
  } catch (err) {
    console.error("Category count aggregation error:", err);
    res.status(500).json({ error: "Failed to fetch category counts", details: err.message });
  }
});
function createServer() {
  const app2 = express__default();
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/library";
  console.log("Connecting to MongoDB:", MONGO_URI);
  mongoose.connect(MONGO_URI).then(() => {
    console.log("Connected to MongoDB successfully");
    console.log("Database: library");
  }).catch((err) => {
    console.error("MongoDB connection error:", err);
  });
  app2.use(cors());
  app2.use(express__default.json());
  app2.use(express__default.urlencoded({ extended: true }));
  app2.use(session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false
  }));
  app2.use(passport.initialize());
  app2.use(passport.session());
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      console.log(`${req.method} ${req.path}`);
    }
    next();
  });
  app2.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });
  app2.get("/api/demo", handleDemo);
  app2.get("/api/profile", verifyTokenWithSession, getProfile);
  app2.put("/api/profile", verifyTokenWithSession, updateProfile);
  app2.post("/api/profile/change-password", verifyTokenWithSession, changePassword);
  app2.delete("/api/profile", verifyTokenWithSession, deleteProfile);
  app2.post("/api/profile/picture", verifyTokenWithSession, requireUser, uploadProfilePicture);
  app2.get("/api/profile/picture/:userId", getProfilePicture);
  app2.delete("/api/profile/picture", verifyTokenWithSession, requireUser, removeProfilePicture);
  app2.post("/api/register", register);
  app2.post("/api/login", login);
  app2.post("/api/forgot-password", forgotPassword);
  app2.post("/api/reset-password", resetPassword);
  app2.use("/api/auth", router$2);
  app2.get("/api/sessions", verifyTokenWithSession, getUserSessions);
  app2.delete("/api/sessions/:sessionId", verifyTokenWithSession, revokeSession);
  app2.delete("/api/sessions", verifyTokenWithSession, revokeAllSessions);
  app2.post("/api/sessions/refresh", verifyTokenWithSession, refreshSession);
  app2.get("/api/admin/stats", verifyTokenWithSession, requireAdmin, getAdminStats);
  app2.get("/api/admin/users", verifyTokenWithSession, requireAdmin, getUsers);
  app2.post("/api/admin/users", verifyTokenWithSession, requireAdmin, createUser);
  app2.put("/api/admin/users/:id", verifyTokenWithSession, requireAdmin, updateUser);
  app2.delete("/api/admin/users/:id", verifyTokenWithSession, requireAdmin, deleteUser);
  app2.get("/api/admin/books", verifyTokenWithSession, requireAdmin, getBooks);
  app2.post("/api/admin/books", verifyTokenWithSession, requireAdmin, createBook$1);
  app2.put("/api/admin/books/:id", verifyTokenWithSession, requireAdmin, updateBook$1);
  app2.delete("/api/admin/books/:id", verifyTokenWithSession, requireAdmin, deleteBook);
  app2.get("/api/librarian/dashboard", verifyTokenWithSession, requireLibrarian, getLibrarianDashboard);
  app2.get("/api/librarian/books", verifyTokenWithSession, requireLibrarian, getLibrarianBooks);
  app2.get("/api/librarian/books/:id", verifyTokenWithSession, requireLibrarian, getBook);
  app2.post("/api/librarian/books", verifyTokenWithSession, requireLibrarian, createBook);
  app2.put("/api/librarian/books/:id", verifyTokenWithSession, requireLibrarian, updateBook);
  app2.put("/api/librarian/books/:id/status", verifyTokenWithSession, requireLibrarian, updateBookStatus);
  app2.post("/api/librarian/loans/issue", verifyTokenWithSession, requireLibrarian, issueBook);
  app2.post("/api/librarian/loans/return", verifyTokenWithSession, requireLibrarian, returnBook);
  app2.get("/api/librarian/loans", verifyTokenWithSession, requireLibrarian, getLoans);
  app2.get("/api/librarian/overdue", verifyTokenWithSession, requireLibrarian, getOverdueBooks);
  app2.get("/api/librarian/reservations", verifyTokenWithSession, requireLibrarian, getReservations);
  app2.put("/api/librarian/reservations/:id", verifyTokenWithSession, requireLibrarian, updateReservation);
  app2.get("/api/librarian/fines", verifyTokenWithSession, requireLibrarian, getFines);
  app2.post("/api/librarian/fines", verifyTokenWithSession, requireLibrarian, createFine);
  app2.put("/api/librarian/fines/:id", verifyTokenWithSession, requireLibrarian, updateFine);
  app2.post("/api/librarian/notifications", verifyTokenWithSession, requireLibrarian, sendNotification);
  app2.get("/api/librarian/users/search", verifyTokenWithSession, requireLibrarian, searchUsers);
  app2.get("/api/librarian/users/:id/loans", verifyTokenWithSession, requireLibrarian, getUserLoans);
  app2.get("/api/librarian/users/:id/activity", verifyTokenWithSession, requireLibrarian, getUserActivity);
  app2.get("/api/librarian/inventory-audits", verifyTokenWithSession, requireLibrarian, getInventoryAudits);
  app2.post("/api/librarian/inventory-audits", verifyTokenWithSession, requireLibrarian, createInventoryAudit);
  app2.put("/api/librarian/inventory-audits/:id", verifyTokenWithSession, requireLibrarian, resolveInventoryAudit);
  app2.get("/api/student/stats", verifyTokenWithSession, requireUser, getStudentStats);
  app2.get("/api/student/books", verifyTokenWithSession, requireUser, getBooksForStudent);
  app2.get("/api/student/loans", verifyTokenWithSession, requireUser, getStudentLoans);
  app2.post("/api/student/loans", verifyTokenWithSession, requireUser, borrowBook);
  app2.post("/api/student/loans/:id/return", verifyTokenWithSession, requireUser, returnStudentBook);
  app2.post("/api/student/loans/:id/renew", verifyTokenWithSession, requireUser, renewLoan);
  app2.get("/api/student/reservations", verifyTokenWithSession, requireUser, getStudentReservations);
  app2.post("/api/student/reservations", verifyTokenWithSession, requireUser, createReservation);
  app2.delete("/api/student/reservations/:id", verifyTokenWithSession, requireUser, cancelReservation);
  app2.get("/api/student/fines", verifyTokenWithSession, requireUser, getStudentFines);
  app2.get("/api/student/notifications", verifyTokenWithSession, requireUser, getStudentNotifications);
  app2.post("/api/student/notifications/:id/read", verifyTokenWithSession, requireUser, markNotificationAsRead);
  app2.post("/api/student/feedback", verifyTokenWithSession, requireUser, submitFeedback);
  app2.post("/api/student/suggestions", verifyTokenWithSession, requireUser, submitBookSuggestion);
  app2.get("/api/student/profile", verifyTokenWithSession, requireUser, getStudentProfile);
  app2.get("/api/search", searchBooks);
  app2.get("/api/search/suggestions", getSearchSuggestions);
  app2.use("/api/search", searchRoutes);
  app2.use("/api/books", router);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`Fusion Starter server running on port ${port}`);
  console.log(`Frontend: http://localhost:${port}`);
  console.log(`API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
