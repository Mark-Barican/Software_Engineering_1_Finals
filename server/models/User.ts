import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: String,
  // Add any other fields you use
});

export default mongoose.models.User || mongoose.model('User', UserSchema, 'users');