// MongoDB Script to Add Profile Picture Field to Users
// Run this script to update existing users with profile picture field

// Connect to the library database
use('library');

print("Starting Profile Picture Field Update...");

// Update all existing users to add profilePicture field with null values
const updateResult = db.users.updateMany(
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

print(`Updated ${updateResult.modifiedCount} users with profile picture field`);

// Verify the update
const usersWithProfilePicture = db.users.countDocuments({
  "profilePicture": { $exists: true }
});

const totalUsers = db.users.countDocuments({});

print(`Total users: ${totalUsers}`);
print(`Users with profile picture field: ${usersWithProfilePicture}`);

// Show sample user structure
const sampleUser = db.users.findOne({}, { profilePicture: 1, name: 1, email: 1 });
print("Sample user structure:");
printjson(sampleUser);

print("Profile picture field update completed successfully!");
print("Users can now upload profile pictures through the application."); 