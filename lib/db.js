// lib/db.js
//
// Single-file SQLite persistence layer. Kept deliberately simple (no ORM) so
// the schema and every query are visible in one place. better-sqlite3 is
// synchronous, which is fine for this scope and keeps route handlers simple.
//
// DB_PATH can be overridden (e.g. ':memory:' in tests).

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH =
  process.env.DB_PATH || path.join(process.cwd(), 'data', 'app.db');

function createDb(dbPath) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shares (
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission TEXT NOT NULL DEFAULT 'edit',
      created_at TEXT NOT NULL,
      PRIMARY KEY (document_id, user_id)
    );
  `);

  return db;
}

const db = createDb(DB_PATH);

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (id, name, email) VALUES (?, ?, ?)'
  );
  const seedUsers = [
    ['u_alice', 'Alice Chen', 'alice@ajaia.dev'],
    ['u_bob', 'Bob Rivera', 'bob@ajaia.dev'],
    ['u_carol', 'Carol Nwosu', 'carol@ajaia.dev'],
  ];
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insertUser.run(...row);
  });
  insertMany(seedUsers);

  const now = new Date().toISOString();
  const insertDoc = db.prepare(
    `INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  insertDoc.run(
    'd_welcome',
    'Welcome to Ajaia Docs',
    '<h1>Welcome to Ajaia Docs</h1><p>This is a <strong>lightweight</strong> collaborative document editor. Try <em>bold</em>, <u>underline</u>, headings, and lists from the toolbar above.</p><ul><li>Create a new document from the dashboard</li><li>Rename it with the title field</li><li>Share it with another seeded user</li></ul>',
    'u_alice',
    now,
    now
  );
  db.prepare(
    `INSERT INTO shares (document_id, user_id, permission, created_at) VALUES (?, ?, ?, ?)`
  ).run('d_welcome', 'u_bob', 'edit', now);
}

seedIfEmpty();

module.exports = { db, createDb, DB_PATH };
