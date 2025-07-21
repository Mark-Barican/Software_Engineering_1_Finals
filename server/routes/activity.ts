import { Request, Response } from "express";
import { requireAdmin, verifyTokenWithSession } from "./auth";
import { Router } from "express";
import { ActivityLog } from "../utils/activityLogger";

const router = Router();

// API endpoint to get recent activities
router.get("/", verifyTokenWithSession, requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50; // Increased limit
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 }) // Sort by creation date
      .limit(limit)
      .populate('userId', 'name email')
      .populate('bookId', 'title')
      .lean(); // Use lean for better performance

    res.json(activities);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router; 