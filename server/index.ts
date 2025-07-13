import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getProfile, updateProfile, changePassword, deleteProfile } from "./routes/profile";
import mongoose from "mongoose";
import { register, login, forgotPassword, resetPassword } from "./routes/auth";

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
  app.get("/api/profile", getProfile);
  app.put("/api/profile", updateProfile);
  app.post("/api/profile/change-password", changePassword);
  app.delete("/api/profile", deleteProfile);

  // Auth routes
  app.post("/api/register", register);
  app.post("/api/login", login);
  app.post("/api/forgot-password", forgotPassword);
  app.post("/api/reset-password", resetPassword);

  return app;
}
