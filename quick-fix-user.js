// Quick fix for dummy user login - Copy and paste this into MongoDB Compass shell

// First check if user exists and fix the password field
db.users.updateOne(
  { email: "alex.johnson@student.edu" },
  { 
    $set: { 
      passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMye.M7eFWBmefyR2RjcPp/7dXyokbeTpx6",
      name: "Alex Johnson",
      role: "user"
    },
    $unset: { password: 1 }
  },
  { upsert: true }
);

console.log("User fixed! You can now log in with:");
console.log("Email: alex.johnson@student.edu");
console.log("Password: password123"); 