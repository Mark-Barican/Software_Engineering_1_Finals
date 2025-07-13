import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getProfile, updateProfile, changePassword, deleteProfile } from "./routes/profile";
import mongoose from "mongoose";
import { register, login, forgotPassword, resetPassword, getUserSessions, revokeSession, revokeAllSessions, refreshSession, verifyTokenWithSession, requireAdmin } from "./routes/auth";
import { getAdminStats, getUsers, createUser, updateUser, deleteUser, getBooks, createBook, updateBook, deleteBook } from "./routes/admin";

export function createServer() {
  const app = express();

  // Connect to MongoDB
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/library";
  console.log("Connecting to MongoDB:", MONGO_URI);
  mongoose.connect(MONGO_URI).then(() => {
    console.log("Connected to MongoDB successfully");
    console.log("Database: library");
  }).catch((err) => {
    console.error("MongoDB connection error:", err);
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add request logging middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`${req.method} ${req.path}`);
    }
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/profile", verifyTokenWithSession, getProfile);
  app.put("/api/profile", verifyTokenWithSession, updateProfile);
  app.post("/api/profile/change-password", verifyTokenWithSession, changePassword);
  app.delete("/api/profile", verifyTokenWithSession, deleteProfile);

  // Auth routes
  app.post("/api/register", register);
  app.post("/api/login", login);
  app.post("/api/forgot-password", forgotPassword);
  app.post("/api/reset-password", resetPassword);

  // Session management routes
  app.get("/api/sessions", verifyTokenWithSession, getUserSessions);
  app.delete("/api/sessions/:sessionId", verifyTokenWithSession, revokeSession);
  app.delete("/api/sessions", verifyTokenWithSession, revokeAllSessions);
  app.post("/api/sessions/refresh", verifyTokenWithSession, refreshSession);

  // Admin routes
  app.get("/api/admin/stats", verifyTokenWithSession, requireAdmin, getAdminStats);
  app.get("/api/admin/users", verifyTokenWithSession, requireAdmin, getUsers);
  app.post("/api/admin/users", verifyTokenWithSession, requireAdmin, createUser);
  app.put("/api/admin/users/:id", verifyTokenWithSession, requireAdmin, updateUser);
  app.delete("/api/admin/users/:id", verifyTokenWithSession, requireAdmin, deleteUser);
  app.get("/api/admin/books", verifyTokenWithSession, requireAdmin, getBooks);
  app.post("/api/admin/books", verifyTokenWithSession, requireAdmin, createBook);
  app.put("/api/admin/books/:id", verifyTokenWithSession, requireAdmin, updateBook);
  app.delete("/api/admin/books/:id", verifyTokenWithSession, requireAdmin, deleteBook);

  return app;
}
