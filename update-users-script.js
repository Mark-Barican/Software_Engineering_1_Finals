// MongoDB Script to Update Users Collection
// Copy and paste this entire script into MongoDB terminal (mongosh)
// 
// This script will:
// 1. Connect to the library database
// 2. Remove existing users
// 3. Create new admin and librarian users with proper schema structure
// 4. Hash passwords correctly for the application

// Switch to library database
use('library');

// Function to generate user ID based on role and current date
function generateUserId(role, department = '') {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2); // Last 2 digits of year
  const currentDate = new Date();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const day = currentDate.getDate().toString().padStart(2, '0');
  const dateCode = month + day; // MMDD format
  
  let prefix = '';
  let deptCode = '';
  
  switch (role) {
    case 'user': // Students
      prefix = 'STD';
      deptCode = department ? department.toUpperCase().slice(0, 2) : 'CS';
      break;
    case 'librarian':
      prefix = 'LIB';
      deptCode = department ? department.toUpperCase().slice(0, 2) : 'LI';
      break;
    case 'admin':
      prefix = 'ADM';
      deptCode = department ? department.toUpperCase().slice(0, 2) : 'AD';
      break;
    default:
      prefix = 'USR';
      deptCode = 'XX';
  }
  
  // Generate sequential number based on current timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-3); // Last 3 digits of timestamp
  
  // Format: PREFIX-YEARDEPT-DATE-TIMESTAMP
  // Example: ADM-25AD-0714-123
  return `${prefix}-${yearSuffix}${deptCode}-${dateCode}-${timestamp}`;
}

console.log("Starting user update process...");

// Drop existing users collection
console.log("Removing existing users...");
db.users.deleteMany({});

console.log("Creating new admin and librarian users...");

// Create the new users with proper bcrypt hashes
// Note: These are pre-computed bcrypt hashes for the passwords
// thinker123 -> $2b$10$bufOrmrGB.aFmafU3Vy/N.M84bAuVkw89okf6/trXVzCJsDVcDhgi
// Handler123 -> $2b$10$OD4ds25iuT/EHWi739KDYuZLnP3upF9/75vtICef3x2fz9AkEs.6G

const adminUsers = [
  {
    name: "Mark Barican",
    email: "mark_barican@admin.com",
    passwordHash: "$2b$10$bufOrmrGB.aFmafU3Vy/N.M84bAuVkw89okf6/trXVzCJsDVcDhgi", // thinker123
    role: "admin",
    userId: generateUserId('admin', 'Administration'),
    contactNumber: "",
    department: "Administration",
    accountStatus: "active",
    preferences: {
      notifications: true,
      defaultSearch: "title",
      displayMode: "grid"
    },
    profilePicture: {
      data: null,
      contentType: null,
      fileName: null,
      uploadDate: null
    },
    resetToken: null,
    resetTokenExpiry: null,
    sessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null
  },
  {
    name: "Jabez Tan",
    email: "jabez_tan@admin.com",
    passwordHash: "$2b$10$bufOrmrGB.aFmafU3Vy/N.M84bAuVkw89okf6/trXVzCJsDVcDhgi", // thinker123
    role: "admin",
    userId: generateUserId('admin', 'Administration'),
    contactNumber: "",
    department: "Administration",
    accountStatus: "active",
    preferences: {
      notifications: true,
      defaultSearch: "author",
      displayMode: "list"
    },
    profilePicture: {
      data: null,
      contentType: null,
      fileName: null,
      uploadDate: null
    },
    resetToken: null,
    resetTokenExpiry: null,
    sessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null
  },
  {
    name: "Karl Manangan",
    email: "karl_manangan@admin.com",
    passwordHash: "$2b$10$bufOrmrGB.aFmafU3Vy/N.M84bAuVkw89okf6/trXVzCJsDVcDhgi", // thinker123
    role: "admin",
    userId: generateUserId('admin', 'Administration'),
    contactNumber: "",
    department: "Administration",
    accountStatus: "active",
    preferences: {
      notifications: true,
      defaultSearch: "keyword",
      displayMode: "grid"
    },
    profilePicture: {
      data: null,
      contentType: null,
      fileName: null,
      uploadDate: null
    },
    resetToken: null,
    resetTokenExpiry: null,
    sessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null
  }
];

const librarianUsers = [
  {
    name: "Cathy",
    email: "cathy@library.com",
    passwordHash: "$2b$10$OD4ds25iuT/EHWi739KDYuZLnP3upF9/75vtICef3x2fz9AkEs.6G", // Handler123
    role: "librarian",
    userId: generateUserId('librarian', 'Library'),
    contactNumber: "",
    department: "Library Services",
    accountStatus: "active",
    preferences: {
      notifications: true,
      defaultSearch: "title",
      displayMode: "list"
    },
    profilePicture: {
      data: null,
      contentType: null,
      fileName: null,
      uploadDate: null
    },
    resetToken: null,
    resetTokenExpiry: null,
    sessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null
  }
];

// Insert admin users
console.log("Inserting admin users...");
const adminResult = db.users.insertMany(adminUsers);
console.log(`Created ${adminResult.insertedIds.length} admin users`);

// Insert librarian users  
console.log("Inserting librarian users...");
const librarianResult = db.users.insertMany(librarianUsers);
console.log(`Created ${librarianResult.insertedIds.length} librarian users`);

// Verify the users were created
console.log("\nVerification:");
console.log("Total users created:", db.users.countDocuments());
console.log("Admin users:", db.users.countDocuments({role: "admin"}));
console.log("Librarian users:", db.users.countDocuments({role: "librarian"}));

console.log("\nCreated users:");
db.users.find({}, {name: 1, email: 1, role: 1, userId: 1, department: 1}).forEach(user => {
  console.log(`- ${user.name} (${user.email}) - ${user.role} - ID: ${user.userId}`);
});

console.log("\nUser update completed successfully!");
console.log("\nLogin credentials:");
console.log("ADMINS:");
console.log("  mark_barican@admin.com / thinker123");
console.log("  jabez_tan@admin.com / thinker123"); 
console.log("  karl_manangan@admin.com / thinker123");
console.log("\nLIBRARIAN:");
console.log("  cathy@library.com / Handler123");
console.log("\nThe database structure matches your application's authentication logic."); 