// scripts/seed.js — wipes and recreates the local SQLite file with seed data.
// Run with: npm run seed
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'app.db');
for (const suffix of ['', '-wal', '-shm']) {
  const p = dbPath + suffix;
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
console.log('Removed existing database file(s).');

// Re-requiring lib/db triggers table creation + seeding.
require('../lib/db');
console.log('Seeded fresh database at', dbPath);
