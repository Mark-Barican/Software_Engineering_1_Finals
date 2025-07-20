import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getProfile, updateProfile, changePassword, deleteProfile } from "./routes/profile";
import mongoose from "mongoose";
import { register, login, forgotPassword, resetPassword, getUserSessions, revokeSession, revokeAllSessions, refreshSession, verifyTokenWithSession, requireAdmin, requireLibrarian, requireUser, uploadProfilePicture, getProfilePicture, removeProfilePicture } from "./routes/auth";
import { getAdminStats, getUsers, createUser, updateUser, deleteUser, getBooks, createBook, updateBook, deleteBook } from "./routes/admin";
import { getLibrarianDashboard, getLibrarianBooks, getBook, createBook as createLibrarianBook, updateBook as updateLibrarianBook, issueBook, returnBook, getLoans, getOverdueBooks, getReservations, searchUsers, getUserLoans, getUserActivity, updateReservation, createFine, updateFine, getFines, updateBookStatus, sendNotification, getInventoryAudits, createInventoryAudit, resolveInventoryAudit } from "./routes/librarian";
import { getStudentStats, getBooksForStudent, getStudentLoans, borrowBook, returnStudentBook, renewLoan, getStudentReservations, createReservation, cancelReservation, getStudentFines, getStudentNotifications, markNotificationAsRead, submitFeedback, submitBookSuggestion, getStudentProfile } from "./routes/student";
import { searchBooks, getSearchSuggestions } from "./routes/search";
import { getBookDetails, getAllBooks } from "./routes/books";
import { searchRoutes } from './routes/search';
import session from "express-session";
import passport from "passport";
import { router as authRouter } from "./routes/auth";

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

  // Add session and passport middleware for OAuth
  app.use(session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
  }));
  app.use(passport.initialize());
  app.use(passport.session());

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
  
  // Profile picture routes
  app.post("/api/profile/picture", verifyTokenWithSession, requireUser, uploadProfilePicture);
  app.get("/api/profile/picture/:userId", getProfilePicture);
  app.delete("/api/profile/picture", verifyTokenWithSession, requireUser, removeProfilePicture);

  // Auth routes
  app.post("/api/register", register);
  app.post("/api/login", login);
  app.post("/api/forgot-password", forgotPassword);
  app.post("/api/reset-password", resetPassword);

  // Google OAuth routes
  app.use("/api/auth", authRouter);

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

  // Librarian routes
  app.get("/api/librarian/dashboard", verifyTokenWithSession, requireLibrarian, getLibrarianDashboard);
  app.get("/api/librarian/books", verifyTokenWithSession, requireLibrarian, getLibrarianBooks);
  app.get("/api/librarian/books/:id", verifyTokenWithSession, requireLibrarian, getBook);
  app.post("/api/librarian/books", verifyTokenWithSession, requireLibrarian, createLibrarianBook);
  app.put("/api/librarian/books/:id", verifyTokenWithSession, requireLibrarian, updateLibrarianBook);
  app.put("/api/librarian/books/:id/status", verifyTokenWithSession, requireLibrarian, updateBookStatus);
  app.post("/api/librarian/loans/issue", verifyTokenWithSession, requireLibrarian, issueBook);
  app.post("/api/librarian/loans/return", verifyTokenWithSession, requireLibrarian, returnBook);
  app.get("/api/librarian/loans", verifyTokenWithSession, requireLibrarian, getLoans);
  app.get("/api/librarian/overdue", verifyTokenWithSession, requireLibrarian, getOverdueBooks);
  app.get("/api/librarian/reservations", verifyTokenWithSession, requireLibrarian, getReservations);
  app.put("/api/librarian/reservations/:id", verifyTokenWithSession, requireLibrarian, updateReservation);
  app.get("/api/librarian/fines", verifyTokenWithSession, requireLibrarian, getFines);
  app.post("/api/librarian/fines", verifyTokenWithSession, requireLibrarian, createFine);
  app.put("/api/librarian/fines/:id", verifyTokenWithSession, requireLibrarian, updateFine);
  app.post("/api/librarian/notifications", verifyTokenWithSession, requireLibrarian, sendNotification);
  app.get("/api/librarian/users/search", verifyTokenWithSession, requireLibrarian, searchUsers);
  app.get("/api/librarian/users/:id/loans", verifyTokenWithSession, requireLibrarian, getUserLoans);
  app.get("/api/librarian/users/:id/activity", verifyTokenWithSession, requireLibrarian, getUserActivity);
  
  // Inventory audit routes
  app.get("/api/librarian/inventory-audits", verifyTokenWithSession, requireLibrarian, getInventoryAudits);
  app.post("/api/librarian/inventory-audits", verifyTokenWithSession, requireLibrarian, createInventoryAudit);
  app.put("/api/librarian/inventory-audits/:id", verifyTokenWithSession, requireLibrarian, resolveInventoryAudit);

  // Student routes
  app.get("/api/student/stats", verifyTokenWithSession, requireUser, getStudentStats);
  app.get("/api/student/books", verifyTokenWithSession, requireUser, getBooksForStudent);
  app.get("/api/student/loans", verifyTokenWithSession, requireUser, getStudentLoans);
  app.post("/api/student/loans", verifyTokenWithSession, requireUser, borrowBook);
  app.post("/api/student/loans/:id/return", verifyTokenWithSession, requireUser, returnStudentBook);
  app.post("/api/student/loans/:id/renew", verifyTokenWithSession, requireUser, renewLoan);
  app.get("/api/student/reservations", verifyTokenWithSession, requireUser, getStudentReservations);
  app.post("/api/student/reservations", verifyTokenWithSession, requireUser, createReservation);
  app.delete("/api/student/reservations/:id", verifyTokenWithSession, requireUser, cancelReservation);
  app.get("/api/student/fines", verifyTokenWithSession, requireUser, getStudentFines);
  app.get("/api/student/notifications", verifyTokenWithSession, requireUser, getStudentNotifications);
  app.post("/api/student/notifications/:id/read", verifyTokenWithSession, requireUser, markNotificationAsRead);
  app.post("/api/student/feedback", verifyTokenWithSession, requireUser, submitFeedback);
  app.post("/api/student/suggestions", verifyTokenWithSession, requireUser, submitBookSuggestion);
  app.get("/api/student/profile", verifyTokenWithSession, requireUser, getStudentProfile);

  // Search routes
  app.get("/api/search", searchBooks);
  app.get("/api/search/suggestions", getSearchSuggestions);
  app.use("/api/search", searchRoutes);

  // Book routes
  app.get("/api/books", getAllBooks);
  app.get("/api/books/:id", getBookDetails);

  return app;
}
