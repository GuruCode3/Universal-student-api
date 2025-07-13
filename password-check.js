// password-check.js - Simple password verification
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

console.log('🔐 SIMPLE PASSWORD CHECK\n');

try {
  const db = new Database('./database/universal-api.db');
  
  // Get all users
  const users = db.prepare("SELECT username, password_hash FROM users").all();
  
  console.log('👥 Found users:', users.map(u => u.username).join(', '));
  
  // Test more passwords
  const passwords = [
    'demo123', 'demo', 'password', 'student123', 'teacher123', 'test123',
    'admin', '123456', 'password123', 'test', 'user', 'student', 'teacher',
    'demo123456', 'demopassword', 'studentpassword', 'teacherpassword',
    '1234', '12345', 'abc123', 'qwerty', 'demo1', 'demo12'
  ];
  
  for (const user of users) {
    console.log(`\n🔍 Testing ${user.username}:`);
    
    for (const pwd of passwords) {
      try {
        const isMatch = bcrypt.compareSync(pwd, user.password_hash);
        if (isMatch) {
          console.log(`✅ SUCCESS: ${user.username} / ${pwd}`);
        }
      } catch (e) {
        // Skip errors
      }
    }
  }
  
  db.close();
  console.log('\n🎯 Check complete!');
  
} catch (error) {
  console.log('❌ Error:', error.message);
}