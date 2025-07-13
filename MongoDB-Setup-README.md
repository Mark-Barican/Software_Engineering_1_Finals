# MongoDB Database Setup for Library Application

This guide will help you set up the complete MongoDB database for your library management system with sample data.

## **Database Structure**

Your library application uses the following collections:

### **Core Collections**
- `users` - User accounts and authentication data
- `books` - Book catalog with metadata and availability
- `borrowed_books` - Active and historical book loans
- `reservations` - Book reservations queue
- `search_history` - User search tracking

### **Supporting Collections**
- `categories` - Book categories and genres
- `library_settings` - System configuration
- `user_activity` - User action logs
- `book_reviews` - User reviews and ratings

## **Quick Import Instructions**

### **Method 1: Using MongoDB Compass (Recommended)**

1. **Open MongoDB Compass**
2. **Connect to** `mongodb://localhost:27017`
3. **Create database** named `library` (or it will be created automatically)
4. **Open the MongoDB shell** in Compass (_MongoSH_ tab at bottom)
5. **Copy and paste** the contents of `mongodb-import-script.js`
6. **Press Enter** to execute
7. **Copy and paste** the contents of `mongodb-additional-collections.js`
8. **Press Enter** to execute

### **Method 2: Using Command Line**

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run the import scripts
mongosh --file mongodb-import-script.js
mongosh --file mongodb-additional-collections.js
```

### **Method 3: Using Node.js/MongoDB Shell**

```bash
# Start MongoDB shell
mongosh

# Copy and paste the script contents directly
```

## **Test User Accounts**

After importing, you can log in with these accounts:

| Email | Password | Role | Preferences |
|-------|----------|------|-------------|
| `john.doe@example.com` | `password123` | Regular User | Grid view, Title search |
| `jane.smith@university.edu` | `password123` | University User | List view, Author search |
| `student@jdlcitech.ph` | `password123` | Student | Compact view, Keyword search |
| `mary.johnson@library.org` | `password123` | Library Staff | Grid view, ISBN search |

## **Sample Books Included**

The database includes 10 sample books with complete metadata:

1. **The Great Gatsby** - F. Scott Fitzgerald (Classic)
2. **Sometimes a Great Notion** - Ken Kesey (American Literature)
3. **The Great Divorce** - C.S. Lewis (Christian Literature)
4. **The Great Wall of China** - Franz Kafka (Classic)
5. **The Great Depression and the Great Recession** - Harold James (History)
6. **Sunrise on the Reaping** - Suzanne Collins (Young Adult)
7. **Intermezzo** - Sally Rooney (Contemporary Fiction)
8. **Main Street Millionaire** - Codie Sanchez (Business)
9. **The Emperor of Gladness** - Ocean Vuong (Poetry)
10. **Never Flinch** - Stephen King (Horror)

## **Sample Data Included**

- **4 Users** with different preferences and activity
- **10 Books** with complete metadata and cover images
- **3 Borrowed Books** (2 active, 1 returned)
- **4 Search History** entries
- **2 Active Reservations**
- **6 Book Categories**
- **6 Library Settings**
- **3 User Activity** logs
- **3 Book Reviews**

## **Verification Steps**

After importing, verify your setup:

1. **Check Collections:**
   ```javascript
   use library
   show collections
   ```

2. **Count Documents:**
   ```javascript
   db.users.countDocuments()      // Should return 4
   db.books.countDocuments()      // Should return 10
   db.borrowed_books.countDocuments() // Should return 3
   ```

3. **Test a Query:**
   ```javascript
   db.users.findOne({email: "john.doe@example.com"})
   ```

## **Database Schema Details**

### **Users Collection Schema**
```javascript
{
  name: String,
  email: String (unique),
  passwordHash: String,
  preferences: {
    notifications: Boolean,
    defaultSearch: String,
    displayMode: String
  },
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: Date,
  lastLogin: Date
}
```

### **Books Collection Schema**
```javascript
{
  title: String,
  author: String,
  isbn: String (unique),
  genre: String,
  publishedYear: Number,
  publisher: String,
  description: String,
  coverImage: String (URL),
  totalCopies: Number,
  availableCopies: Number,
  categories: [String],
  language: String,
  pages: Number,
  hasDownload: Boolean,
  hasReadOnline: Boolean,
  addedDate: Date,
  lastUpdated: Date
}
```

## **Database Indexes**

The following indexes are automatically created for optimal performance:

- **users**: `email` (unique)
- **books**: `title`, `author`, `isbn` (unique), `categories`
- **borrowed_books**: `userId`, `bookId`, `status`
- **search_history**: `userId`, `searchDate`
- **reservations**: `userId`, `bookId`
- **user_activity**: `userId`, `timestamp`
- **book_reviews**: `bookId`, `userId`

## **Integration with Your App**

Your application is already configured to work with this database structure:

- **Connection String**: `mongodb://localhost:27017/library`
- **User Schema**: Matches your Mongoose schema in `server/routes/auth.ts`
- **Authentication**: Uses bcrypt hashed passwords
- **User Management**: All features work with this data structure

## **Troubleshooting**

### **Common Issues:**

**Script Error: "Collection not found"**
- Make sure MongoDB is running
- Ensure you're connected to the correct database

**Authentication Error:**
- Verify the password hashes match your bcrypt configuration
- Check that JWT secret is set properly

**Import Fails:**
- Ensure you have write permissions to the database
- Check MongoDB logs for detailed error messages

**Duplicate Key Error:**
- Drop the existing collections and re-run the import
- Use: `db.collection_name.drop()` before importing

### **Reset Database:**
```javascript
// Drop all collections and start fresh
use library
db.dropDatabase()
// Then re-run the import scripts
```

## **You're All Set!**

Your library application now has a complete database with:
- User accounts with authentication
- Book catalog with metadata
- Borrowing and reservation system
- Search functionality with history
- User preferences and settings
- Performance-optimized indexes

Start your application with `npm run dev` and enjoy your fully functional library management system!

---

**Need Help?** Check your application logs for any database connection issues or reach out for support. 