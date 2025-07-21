import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  libraryName: { type: String, default: 'My Library' },
  libraryLogoUrl: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  maxBooksPerUser: { type: Number, default: 5 },
  loanDurationDays: { type: Number, default: 14 },
  finePerDay: { type: Number, default: 5 },
  notificationEmail: { type: String, default: '' },
}, { collection: 'settings' });

export const Settings = mongoose.model('Settings', SettingsSchema); 