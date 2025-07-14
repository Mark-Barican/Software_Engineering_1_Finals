# Pull Request: User ID System Implementation

## What Changed
Added a user ID system where each user gets a unique ID with role-specific prefixes.

## User ID Format
- **Students**: `STD-25CS0714009` (STD + year + course + sequential number)
- **Librarians**: `LIB-2024001` (LIB + year + sequential number)  
- **Admins**: `ADM-2024001` (ADM + year + sequential number)

## What Was Added

### Backend Changes
- Added `userId` field to user database schema
- Created function to generate unique user IDs automatically
- Updated registration to assign user IDs to new users
- Updated profile endpoints to return user ID
- Added validation to ensure user IDs are unique

### Frontend Changes  
- Updated user profile pages to show user ID
- Added user ID display in admin, librarian, and student dashboards
- Updated account management page to show user ID
- Modified authentication hook to include user ID

### Database Scripts
- Created script to add dummy user IDs to existing users for testing

## Why This Matters
- Makes it easier to identify users across the system
- Provides a consistent way to reference users
- Helps with reporting and user management
- Each role has a clear prefix so you can tell what type of user they are

## Testing
- New users automatically get user IDs when they register
- Existing users can be updated with the provided database script
- User IDs appear in all relevant UI components
- No breaking changes to existing functionality 