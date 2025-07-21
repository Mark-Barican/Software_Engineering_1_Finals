import mongoose from "mongoose";

// Define the schema for the activity log
const ActivityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['new_user', 'book_added', 'loan_issued', 'loan_returned', 'reservation_created', 'settings_changed'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
  },
  details: {
    type: String,
  },
}, {
  timestamps: true,
  collection: 'activity_logs',
});

export const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);

// Function to log an activity
export const logActivity = async (
  type: 'new_user' | 'book_added' | 'loan_issued' | 'loan_returned' | 'reservation_created' | 'settings_changed',
  details: string,
  userId?: string,
  bookId?: string
) => {
  try {
    await ActivityLog.create({ type, details, userId, bookId });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}; 