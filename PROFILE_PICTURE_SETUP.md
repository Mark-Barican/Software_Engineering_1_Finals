# Profile Picture Functionality Setup Guide

## 🎯 Overview

This guide explains how to set up and use the new profile picture functionality in the Integrated Library System. Users can now upload, resize, and manage their profile pictures with full database storage.

## ✨ Features

- **Image Upload**: Support for JPG, PNG, GIF formats
- **File Size Limit**: 5MB maximum file size
- **Image Preview**: Real-time preview before upload
- **Image Controls**: Zoom (0.5x - 3x) and rotation (90° increments)
- **Database Storage**: Images stored as binary data in MongoDB
- **Automatic Cleanup**: Old images replaced when new ones uploaded
- **Error Handling**: Comprehensive validation and error messages

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install multer @types/multer --legacy-peer-deps
```

### 2. Update Database Schema

The User schema has been updated to include profile picture fields:

```javascript
profilePicture: {
  data: { type: Buffer, default: null },        // Image binary data
  contentType: { type: String, default: null }, // MIME type (e.g., image/jpeg)
  fileName: { type: String, default: null },    // Original filename
  uploadDate: { type: Date, default: null }     // Upload timestamp
}
```

### 3. Update Existing Database

Run the MongoDB script to add profile picture fields to existing users:

```bash
# Connect to MongoDB shell
mongosh

# Run the update script
load("mongodb-add-profile-picture.js")
```

Or manually execute:

```javascript
use('library');

db.users.updateMany(
  { profilePicture: { $exists: false } },
  {
    $set: {
      profilePicture: {
        data: null,
        contentType: null,
        fileName: null,
        uploadDate: null
      }
    }
  }
);
```

## 🔧 API Endpoints

### Upload Profile Picture
- **POST** `/api/profile/picture`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Field Name**: `profilePicture`
- **Response**: Success/error message

### Get Profile Picture
- **GET** `/api/profile/picture/:userId`
- **Authentication**: Not required (public)
- **Response**: Image binary data with proper headers

### Remove Profile Picture
- **DELETE** `/api/profile/picture`
- **Authentication**: Required
- **Response**: Success/error message

## 🎨 User Interface

### Profile Picture Component
- **Location**: `client/components/ProfilePictureUpload.tsx`
- **Features**:
  - Drag & drop file selection
  - Image preview with zoom/rotate controls
  - File validation (type, size)
  - Upload progress indication
  - Success/error feedback

### Integration
- **MyAccount Page**: Profile tab now includes picture upload
- **Responsive Design**: Works on desktop and mobile
- **Accessibility**: Full keyboard navigation support

## 📱 Usage Instructions

### For Users

1. **Navigate to Profile**: Go to My Account → Profile tab
2. **Upload Picture**: Click "Choose Image" or drag & drop
3. **Preview & Edit**: Use zoom and rotate controls
4. **Upload**: Click "Upload Picture" button
5. **Remove**: Click the X button on current picture

### For Developers

```typescript
// Import the component
import ProfilePictureUpload from '../components/ProfilePictureUpload';

// Use in your component
<ProfilePictureUpload 
  onUploadSuccess={() => console.log('Upload successful')}
  className="custom-class"
/>
```

## 🔒 Security Features

- **File Type Validation**: Only image files accepted
- **Size Limits**: 5MB maximum file size
- **Authentication**: Upload/delete requires valid token
- **User Isolation**: Users can only manage their own pictures
- **Content-Type Headers**: Proper MIME type handling

## 🗄️ Database Schema

### User Collection Update

```javascript
// Before
{
  name: String,
  email: String,
  // ... other fields
}

// After
{
  name: String,
  email: String,
  profilePicture: {
    data: Buffer,        // Binary image data
    contentType: String, // e.g., "image/jpeg"
    fileName: String,    // e.g., "profile.jpg"
    uploadDate: Date     // Upload timestamp
  },
  // ... other fields
}
```

## 🚀 Performance Considerations

- **Memory Storage**: Images stored in memory during upload
- **Binary Storage**: Efficient MongoDB binary storage
- **Caching**: Browser caching with timestamp parameters
- **Lazy Loading**: Images loaded on demand
- **Error Fallbacks**: Graceful handling of missing images

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot find module 'multer'"**
   - Run: `npm install multer @types/multer --legacy-peer-deps`

2. **"Profile picture not found"**
   - Check if user has uploaded a picture
   - Verify database connection

3. **"File size too large"**
   - Ensure file is under 5MB
   - Compress image if needed

4. **"Only image files are allowed"**
   - Check file extension and MIME type
   - Use JPG, PNG, or GIF formats

### Database Verification

```javascript
// Check if profile picture field exists
db.users.findOne({}, { profilePicture: 1, name: 1 });

// Count users with profile pictures
db.users.countDocuments({ "profilePicture.data": { $ne: null } });

// Find users without profile pictures
db.users.find({ "profilePicture.data": null }, { name: 1, email: 1 });
```

## 📋 Testing Checklist

- [ ] Upload different image formats (JPG, PNG, GIF)
- [ ] Test file size limits (under and over 5MB)
- [ ] Verify image preview and controls
- [ ] Test upload success/failure scenarios
- [ ] Check database storage
- [ ] Verify image retrieval
- [ ] Test remove functionality
- [ ] Check responsive design
- [ ] Verify accessibility features

## 🔄 Future Enhancements

- **Image Cropping**: Add crop functionality
- **Multiple Formats**: Support for WebP, AVIF
- **Cloud Storage**: Move to cloud storage (AWS S3, etc.)
- **Image Optimization**: Automatic compression
- **Bulk Operations**: Admin bulk image management
- **CDN Integration**: Content delivery network

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify database schema updates
3. Test with different image formats
4. Check browser console for errors
5. Verify API endpoint responses

---

**Note**: This functionality requires MongoDB 4.0+ and Node.js 14+ for optimal performance. 