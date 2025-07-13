// Additional Collections for Library Management System
// Run this script after the main import script

use('library');

// 3. Create Borrowed Books Collection (for tracking loans)
db.borrowed_books.insertMany([
  {
    userId: db.users.findOne({email: "john.doe@example.com"})._id,
    bookId: db.books.findOne({title: "The Great Gatsby"})._id,
    borrowDate: new Date("2024-01-18T10:00:00.000Z"),
    dueDate: new Date("2024-02-15T23:59:59.000Z"),
    returnDate: null,
    status: "borrowed",
    renewalCount: 0,
    maxRenewals: 2
  },
  {
    userId: db.users.findOne({email: "jane.smith@university.edu"})._id,
    bookId: db.books.findOne({title: "Sunrise on the Reaping"})._id,
    borrowDate: new Date("2024-01-16T14:30:00.000Z"),
    dueDate: new Date("2024-02-13T23:59:59.000Z"),
    returnDate: null,
    status: "borrowed", 
    renewalCount: 1,
    maxRenewals: 2
  },
  {
    userId: db.users.findOne({email: "john.doe@example.com"})._id,
    bookId: db.books.findOne({title: "Sometimes a Great Notion"})._id,
    borrowDate: new Date("2024-01-05T11:15:00.000Z"),
    dueDate: new Date("2024-02-02T23:59:59.000Z"),
    returnDate: new Date("2024-01-20T16:30:00.000Z"),
    status: "returned",
    renewalCount: 0,
    maxRenewals: 2
  }
]);

// 4. Create Search History Collection
db.search_history.insertMany([
  {
    userId: db.users.findOne({email: "john.doe@example.com"})._id,
    searchQuery: "great gatsby",
    searchType: "title",
    resultsCount: 1,
    searchDate: new Date("2024-01-20T14:15:00.000Z")
  },
  {
    userId: db.users.findOne({email: "john.doe@example.com"})._id,
    searchQuery: "science fiction",
    searchType: "keyword", 
    resultsCount: 3,
    searchDate: new Date("2024-01-19T16:22:00.000Z")
  },
  {
    userId: db.users.findOne({email: "jane.smith@university.edu"})._id,
    searchQuery: "sally rooney",
    searchType: "author",
    resultsCount: 1,
    searchDate: new Date("2024-01-18T13:45:00.000Z")
  },
  {
    userId: db.users.findOne({email: "student@jdlcitech.ph"})._id,
    searchQuery: "business finance",
    searchType: "keyword",
    resultsCount: 2,
    searchDate: new Date("2024-01-17T09:30:00.000Z")
  }
]);

// 5. Create Book Reservations Collection
db.reservations.insertMany([
  {
    userId: db.users.findOne({email: "student@jdlcitech.ph"})._id,
    bookId: db.books.findOne({title: "The Great Gatsby"})._id,
    reservationDate: new Date("2024-01-19T12:00:00.000Z"),
    expiryDate: new Date("2024-01-26T23:59:59.000Z"),
    status: "active",
    position: 1
  },
  {
    userId: db.users.findOne({email: "mary.johnson@library.org"})._id,
    bookId: db.books.findOne({title: "Sunrise on the Reaping"})._id,
    reservationDate: new Date("2024-01-20T08:30:00.000Z"),
    expiryDate: new Date("2024-01-27T23:59:59.000Z"),
    status: "active",
    position: 1
  }
]);

// 6. Create Categories Collection
db.categories.insertMany([
  {
    name: "Fiction",
    description: "Imaginative literature including novels and short stories",
    bookCount: 7,
    createdDate: new Date("2024-01-01T00:00:00.000Z")
  },
  {
    name: "Business",
    description: "Books on business strategy, finance, and entrepreneurship", 
    bookCount: 1,
    createdDate: new Date("2024-01-01T00:00:00.000Z")
  },
  {
    name: "Young Adult",
    description: "Literature targeted at teenage and young adult readers",
    bookCount: 1,
    createdDate: new Date("2024-01-01T00:00:00.000Z")
  },
  {
    name: "Classic Literature",
    description: "Timeless works of literature from renowned authors",
    bookCount: 3,
    createdDate: new Date("2024-01-01T00:00:00.000Z")
  },
  {
    name: "Horror",
    description: "Suspenseful stories designed to frighten and create tension",
    bookCount: 1,
    createdDate: new Date("2024-01-01T00:00:00.000Z")
  },
  {
    name: "Poetry",
    description: "Literary works expressing feelings and ideas in verse",
    bookCount: 1,
    createdDate: new Date("2024-01-01T00:00:00.000Z")
  }
]);

// 7. Create Library Settings Collection
db.library_settings.insertMany([
  {
    settingKey: "maxBorrowPeriod",
    settingValue: 28,
    description: "Maximum number of days a book can be borrowed",
    dataType: "number"
  },
  {
    settingKey: "maxRenewals",
    settingValue: 2,
    description: "Maximum number of times a book can be renewed",
    dataType: "number"
  },
  {
    settingKey: "maxBooksPerUser",
    settingValue: 5,
    description: "Maximum number of books a user can borrow simultaneously",
    dataType: "number"
  },
  {
    settingKey: "reservationExpiryDays",
    settingValue: 7,
    description: "Number of days a reservation remains active",
    dataType: "number"
  },
  {
    settingKey: "libraryName",
    settingValue: "CIT Digital Library",
    description: "Name of the library institution",
    dataType: "string"
  },
  {
    settingKey: "enableEmailNotifications",
    settingValue: true,
    description: "Whether to send email notifications to users",
    dataType: "boolean"
  }
]);

// 8. Create User Activity Logs Collection
db.user_activity.insertMany([
  {
    userId: db.users.findOne({email: "john.doe@example.com"})._id,
    action: "login",
    timestamp: new Date("2024-01-20T14:22:00.000Z"),
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  {
    userId: db.users.findOne({email: "john.doe@example.com"})._id,
    action: "book_search",
    details: {searchQuery: "great gatsby", searchType: "title"},
    timestamp: new Date("2024-01-20T14:15:00.000Z"),
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  {
    userId: db.users.findOne({email: "jane.smith@university.edu"})._id,
    action: "profile_update",
    details: {field: "preferences"},
    timestamp: new Date("2024-01-19T16:45:00.000Z"),
    ipAddress: "10.0.0.25",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  }
]);

// 9. Create Book Reviews Collection (optional feature)
db.book_reviews.insertMany([
  {
    bookId: db.books.findOne({title: "The Great Gatsby"})._id,
    userId: db.users.findOne({email: "john.doe@example.com"})._id,
    rating: 5,
    review: "A timeless classic that beautifully captures the American Dream and its disillusionment. Fitzgerald's prose is elegant and the characters are unforgettable.",
    reviewDate: new Date("2024-01-19T20:30:00.000Z"),
    helpful: 3,
    reported: false
  },
  {
    bookId: db.books.findOne({title: "Intermezzo"})._id,
    userId: db.users.findOne({email: "jane.smith@university.edu"})._id,
    rating: 4,
    review: "Sally Rooney's latest work is a masterful exploration of human relationships. Her writing style is distinctive and the character development is excellent.",
    reviewDate: new Date("2024-01-18T15:20:00.000Z"),
    helpful: 2,
    reported: false
  },
  {
    bookId: db.books.findOne({title: "Main Street Millionaire"})._id,
    userId: db.users.findOne({email: "student@jdlcitech.ph"})._id,
    rating: 4,
    review: "Practical advice for small business investment. The strategies are actionable and the examples are relevant. Highly recommend for anyone interested in business.",
    reviewDate: new Date("2024-01-17T11:45:00.000Z"),
    helpful: 5,
    reported: false
  }
]);

// 10. Create Indexes for Better Performance
db.users.createIndex({email: 1}, {unique: true});
db.books.createIndex({title: 1});
db.books.createIndex({author: 1});
db.books.createIndex({isbn: 1}, {unique: true});
db.books.createIndex({categories: 1});
db.borrowed_books.createIndex({userId: 1});
db.borrowed_books.createIndex({bookId: 1});
db.borrowed_books.createIndex({status: 1});
db.search_history.createIndex({userId: 1});
db.search_history.createIndex({searchDate: -1});
db.reservations.createIndex({userId: 1});
db.reservations.createIndex({bookId: 1});
db.user_activity.createIndex({userId: 1});
db.user_activity.createIndex({timestamp: -1});
db.book_reviews.createIndex({bookId: 1});
db.book_reviews.createIndex({userId: 1});

print("Additional collections created successfully!");
print("Collection Summary:");
print("  - borrowed_books: " + db.borrowed_books.countDocuments() + " documents");
print("  - search_history: " + db.search_history.countDocuments() + " documents");
print("  - reservations: " + db.reservations.countDocuments() + " documents");
print("  - categories: " + db.categories.countDocuments() + " documents");
print("  - library_settings: " + db.library_settings.countDocuments() + " documents");
print("  - user_activity: " + db.user_activity.countDocuments() + " documents");
print("  - book_reviews: " + db.book_reviews.countDocuments() + " documents");
print("");
print("Complete library database is ready!");
print("Indexes created for optimal performance"); 