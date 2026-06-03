-- Run this SQL query in your PostgreSQL database to make a user admin

-- Option 1: Update existing user to admin
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';

-- Option 2: Create a new admin user (run this if no user exists)
INSERT INTO users (id, email, name, "passwordHash", role, "isActive", "isVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@hosthaven.com',
  'Admin',
  '$2a$10$YourHashHere', -- You'll need to use a real bcrypt hash
  'ADMIN',
  true,
  true,
  NOW(),
  NOW()
);

-- To get a bcrypt hash, you can use an online bcrypt generator or run in Node.js:
-- const bcrypt = require('bcrypt');
-- console.log(bcrypt.hashSync('YourPassword', 10));
