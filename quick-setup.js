// Quick Setup Script for Library Application MongoDB Database
// This script sets up the complete database with all collections and sample data
// 
// USAGE:
// 1. Open MongoDB Compass
// 2. Connect to mongodb://localhost:27017
// 3. Open MongoDB Shell (MongoSH tab)
// 4. Copy and paste this entire script
// 5. Press Enter to execute

console.log("Starting Library Database Setup...");

// Switch to library database
use('library');

console.log("Creating Users Collection...");

// Create Users with authentication data
db.users.insertMany([
  {
    name: "John Doe",
    email: "john.doe@example.com",
    passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMye.M7eFWBmefyR2RjcPp/7dXyokbeTpx6", // password: "password123"
    preferences: {
      notifications: true,
      defaultSearch: "title",
      displayMode: "grid"
    },
    createdAt: new Date("2024-01-15T08:30:00.000Z"),
    lastLogin: new Date("2024-01-20T14:22:00.000Z")
  },
  {
    name: "Jane Smith",
    email: "jane.smith@university.edu", 
    passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMye.M7eFWBmefyR2RjcPp/7dXyokbeTpx6", // password: "password123"
    preferences: {
      notifications: false,
      defaultSearch: "author",
      displayMode: "list"
    },
    createdAt: new Date("2024-01-10T10:15:00.000Z"),
    lastLogin: new Date("2024-01-19T16:45:00.000Z")
  },
  {
    name: "Student Library User",
    email: "student@jdlcitech.ph",
    passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMye.M7eFWBmefyR2RjcPp/7dXyokbeTpx6", // password: "password123"
    preferences: {
      notifications: true,
      defaultSearch: "keyword", 
      displayMode: "compact"
    },
    createdAt: new Date("2024-01-12T09:00:00.000Z"),
    lastLogin: new Date("2024-01-20T11:30:00.000Z")
  },
  {
    name: "Mary Johnson",
    email: "mary.johnson@library.org",
    passwordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMye.M7eFWBmefyR2RjcPp/7dXyokbeTpx6", // password: "password123"
    preferences: {
      notifications: true,
      defaultSearch: "isbn",
      displayMode: "grid"
    },
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date("2024-01-08T13:20:00.000Z"),
    lastLogin: new Date("2024-01-20T09:15:00.000Z")
  }
]);

console.log("Creating Books Collection...");

// Create Books Collection with all book data from your UI
db.books.insertMany([
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald", 
    isbn: "978-0-7432-7356-5",
    genre: "Classic Literature",
    publishedYear: 1925,
    publisher: "Charles Scribner's Sons",
    description: "A classic American novel set in the summer of 1922, exploring themes of decadence, idealism, resistance to change, social upheaval, and excess.",
    coverImage: "https://cdn.builder.io/api/v1/image/assets/TEMP/4d1e82e2e44be4f6344a8edb761420ae9581ab72?width=324",
    totalCopies: 5,
    availableCopies: 3,
    categories: ["Fiction", "Classic", "American Literature"],
    language: "English", 
    pages: 180,
    hasDownload: false,
    hasReadOnline: true,
    addedDate: new Date("2024-01-01T00:00:00.000Z"),
    lastUpdated: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    title: "Sometimes a Great Notion",
    author: "Ken Kesey",
    isbn: "978-0-14-004367-8", 
    genre: "American Literature",
    publishedYear: 1964,
    publisher: "Viking Press",
    description: "A powerful novel about a logging family in Oregon, exploring themes of family, tradition, and the changing American West.",
    coverImage: "https://cdn.builder.io/api/v1/image/assets/TEMP/2317efad8487bf8bdeee4fcc13e8f8a64e8dc306?width=334",
    totalCopies: 3,
    availableCopies: 2,
    categories: ["Fiction", "American Literature", "Family Saga"],
    language: "English",
    pages: 628,
    hasDownload: true,
    hasReadOnline: false,
    addedDate: new Date("2024-01-02T00:00:00.000Z"),
    lastUpdated: new Date("2024-01-16T14:20:00.000Z")
  },
  {
    title: "The Great Divorce", 
    author: "C.S. Lewis",
    isbn: "978-0-06-065209-3",
    genre: "Christian Literature",
    publishedYear: 1945,
    publisher: "Geoffrey Bles",
    description: "A theological fantasy novel exploring themes of good and evil, choice, and redemption.",
    coverImage: "https://cdn.builder.io/api/v1/image/assets/TEMP/79b68601f2a8971604c71ff5cd5cebeddd29f4bf?width=333",
    totalCopies: 4,
    availableCopies: 4, 
    categories: ["Fiction", "Christian Literature", "Fantasy"],
    language: "English",
    pages: 146,
    hasDownload: true,
    hasReadOnline: false,
    addedDate: new Date("2024-01-03T00:00:00.000Z"),
    lastUpdated: new Date("2024-01-17T16:45:00.000Z")
  },
  {
    title: "The Great Wall of China",
    author: "Franz Kafka",
    isbn: "978-0-8052-4238-7",
    genre: "Classic Literature", 
    publishedYear: 1931,
    publisher: "Martin Secker",
    description: "A collection of short stories and fragments exploring themes of bureaucracy, alienation, and the human condition.",
    coverImage: "https://cdn.builder.io/api/v1/image/assets/TEMP/bda1bead17f9d868a5a74ec57185e8d880dd4105?width=329",
    totalCopies: 2,
    availableCopies: 2,
    categories: ["Fiction", "Classic", "Philosophy"],
    language: "English",
    pages: 156,
    hasDownload: true,
    hasReadOnline: false,
    addedDate: new Date("2024-01-04T00:00:00.000Z"),
    lastUpdated: new Date("2024-01-18T11:10:00.000Z")
  },
  {
    title: "The Great Depression and the Great Recession",
    author: "Harold James",
    isbn: "978-0-393-07013-4",
    genre: "History",
    publishedYear: 2009,
    publisher: "W. W. Norton & Company",
    description: "A comparative analysis of two major economic crises and their lasting impact on society.",
    coverImage: "https://cdn.builder.io/api/v1/image/assets/TEMP/434dedace7c7d57369634b25533ff8274338c542?width=338",
    totalCopies: 3,
    availableCopies: 3,
    categories: ["History", "Economics", "Politics"],
    language: "English", 
    pages: 224,
    hasDownload: false,
    hasReadOnline: true,
    addedDate: new Date("2024-01-05T00:00:00.000Z"),
    lastUpdated: new Date("2024-01-19T15:30:00.000Z")
  },
  {
    title: "Sunrise on the Reaping",
    author: "Suzanne Collins",
    isbn: "978-1-338-63517-3",
    genre: "Young Adult Fiction",
    publishedYear: 2024,
    publisher: "Scholastic Press", 
    description: "The highly anticipated prequel to The Hunger Games trilogy, exploring the world of Panem decades before Katniss Everdeen.",
    coverImage: "https://cdn.builder.io/api/v1/image/assets/TEMP/34edae358b26ed6a89538e9afac38d52f316c31c?width=339",
    totalCopies: 8,
    availableCopies: 6,
    categories: ["Young Adult", "Dystopian", "Science Fiction"],
    language: "English",
    pages: 464,
    hasDownload: false,
    hasReadOnline: true,
    addedDate: new Date("2024-01-10T00:00:00.000Z"),
    lastUpdated: new Date("2024-01-18T12:00:00.000Z")
  },
  {
    title: "Intermezzo",
    author: "Sally Rooney",
    isbn: "978-0-374-60400-1", 
    genre: "Contemporary Fiction",
    publishedYear: 2024,
    publisher: "Farrar, Straus and Giroux",
    description: "A nuanced exploration of grief, love, and family relationships in contemporary Ireland.",
    coverImage: "https://cdn.builder.io/api/v1/image/assets/TEMP/13643314ca30ce6917105bcb4ffdce9b411d2806?width=317",
    totalCopies: 6,
    availableCopies: 5,
    categories: ["Fiction", "Contemporary", "Literary Fiction"],
    language: "English",
    pages: 448,
    hasDownload: false,
    hasReadOnline: true,
    addedDate: new Date("2024-01-12T00:00:00.000Z"),
    lastUpdated: new Date("2024-01-19T08:30:00.000Z")
  },
  {
    title: "Main Street Millionaire",
    author: "Codie Sanchez",
    isbn: "978-0-593-54321-9",
    genre: "Business",
    publishedYear: 2024,
    publisher: "Portfolio",
    description: "A practical guide to building wealth through small business ownership and investment strategies.",
    coverImage: "https://cdn.builder.io/api/v1/image/assets/TEMP/b3085b1bccc4fb6986e6b397dc396a1fe957eb91?width=348",
    totalCopies: 4,
    availableCopies: 3,
    categories: ["Business", "Finance", "Entrepreneurship"],
    language: "English",
    pages: 288,
    hasDownload: true,
    hasReadOnline: false,
    addedDate: new Date("2024-01-14T00:00:00.000Z"),
    lastUpdated: new Date("2024-01-20T10:15:00.000Z")
  },
  {
    title: "The Emperor of Gladness",
    author: "Ocean Vuong",
    isbn: "978-0-525-52041-2",
    genre: "Poetry",
    publishedYear: 2024,
    publisher: "Penguin Press",
    description: "A collection of deeply personal and powerful poems exploring identity, family, and the immigrant experience.",
    coverImage: "https://cdn.builder.io/api/v1/image/assets/TEMP/8a157da7bbdb17da560b2cfbafd3a86812ce7788?width=328",
    totalCopies: 3,
    availableCopies: 3,
    categories: ["Poetry", "Asian American Literature", "LGBTQ+"],
    language: "English",
    pages: 192,
    hasDownload: false,
    hasReadOnline: true,
    addedDate: new Date("2024-01-16T00:00:00.000Z"),
    lastUpdated: new Date("2024-01-20T14:45:00.000Z")
  },
  {
    title: "Never Flinch",
    author: "Stephen King",
    isbn: "978-1-982-17783-4",
    genre: "Horror Fiction",
    publishedYear: 2024,
    publisher: "Scribner",
    description: "A gripping psychological thriller that explores the darkness that lurks beneath seemingly ordinary circumstances.",
    coverImage: "https://cdn.builder.io/api/v1/image/assets/TEMP/f221dededd14a380781475af812f35c224444d72?width=326",
    totalCopies: 5,
    availableCopies: 4,
    categories: ["Horror", "Thriller", "Suspense"],
    language: "English",
    pages: 368,
    hasDownload: true,
    hasReadOnline: false,
    addedDate: new Date("2024-01-18T00:00:00.000Z"),
    lastUpdated: new Date("2024-01-20T16:20:00.000Z")
  }
]);

console.log("Creating additional collections...");

// Create performance indexes
console.log("Creating database indexes...");
db.users.createIndex({email: 1}, {unique: true});
db.books.createIndex({title: 1});
db.books.createIndex({author: 1});
db.books.createIndex({isbn: 1}, {unique: true});
db.books.createIndex({categories: 1});

console.log("Database setup completed successfully!");
console.log("");
console.log("Database: library");
console.log("Users created: " + db.users.countDocuments());
console.log("Books created: " + db.books.countDocuments());
console.log("");
console.log("Login with these test accounts:");
console.log("  john.doe@example.com (password: password123)");
console.log("  jane.smith@university.edu (password: password123)"); 
console.log("  student@jdlcitech.ph (password: password123)");
console.log("  mary.johnson@library.org (password: password123)");
console.log("");
console.log("Your library application is ready!");
console.log("   Run 'npm run dev' to start your application"); 