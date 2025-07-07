import path from "path";
import * as express from "express";
import express__default from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
let mockUser = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  preferences: {
    notifications: true,
    defaultSearch: "title",
    displayMode: "list"
  },
  password: "password123"
  // In real apps, never store plain text!
};
function getProfile(req, res) {
  res.json({ ...mockUser, password: void 0 });
}
function updateProfile(req, res) {
  const { name, email, preferences } = req.body;
  if (name) mockUser.name = name;
  if (email) mockUser.email = email;
  if (preferences) mockUser.preferences = { ...mockUser.preferences, ...preferences };
  res.json({ success: true, user: { ...mockUser, password: void 0 } });
}
function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  if (oldPassword !== mockUser.password) {
    return res.status(400).json({ success: false, message: "Old password incorrect" });
  }
  mockUser.password = newPassword;
  res.json({ success: true });
}
function deleteProfile(req, res) {
  mockUser = null;
  res.json({ success: true });
}
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  preferences: {
    notifications: { type: Boolean, default: true },
    defaultSearch: { type: String, default: "title" },
    displayMode: { type: String, default: "list" }
  }
});
const User = mongoose.model("User", userSchema);
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Registration failed", error: err });
  }
}
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed", error: err });
  }
}
function createServer() {
  const app2 = express__default();
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/library";
  mongoose.connect(MONGO_URI).then(() => {
    console.log("Connected to MongoDB");
  }).catch((err) => {
    console.error("MongoDB connection error:", err);
  });
  app2.use(cors());
  app2.use(express__default.json());
  app2.use(express__default.urlencoded({ extended: true }));
  app2.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });
  app2.get("/api/demo", handleDemo);
  app2.get("/api/profile", getProfile);
  app2.put("/api/profile", updateProfile);
  app2.post("/api/profile/change-password", changePassword);
  app2.delete("/api/profile", deleteProfile);
  app2.post("/api/register", register);
  app2.post("/api/login", login);
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
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
