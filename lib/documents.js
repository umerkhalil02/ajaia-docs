// lib/documents.js
//
// Pure(ish) data-access functions on top of the sqlite handle. Kept separate
// from the Next.js route handlers so they can be unit tested directly
// against an in-memory database without going through HTTP.

const crypto = require('crypto');

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function nowIso() {
  return new Date().toISOString();
}

function getUser(db, userId) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

function listUsers(db) {
  return db.prepare('SELECT id, name, email FROM users ORDER BY name').all();
}

// Returns { owned: [...], shared: [...] } for a given user, each document
// annotated with a computed `access` field so the UI can badge it clearly.
function listDocumentsForUser(db, userId) {
  const owned = db
    .prepare(
      `SELECT * FROM documents WHERE owner_id = ? ORDER BY updated_at DESC`
    )
    .all(userId)
    .map((d) => ({ ...d, access: 'owner' }));

  const shared = db
    .prepare(
      `SELECT d.*, s.permission AS shared_permission
       FROM documents d
       JOIN shares s ON s.document_id = d.id
       WHERE s.user_id = ?
       ORDER BY d.updated_at DESC`
    )
    .all(userId)
    .map((d) => ({ ...d, access: d.shared_permission || 'edit' }));

  return { owned, shared };
}

// A user may open a document if they own it or it's been shared with them.
// Returns the document row (with `access`) or null if not permitted/found.
function getDocumentForUser(db, docId, userId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  if (!doc) return null;
  if (doc.owner_id === userId) return { ...doc, access: 'owner' };

  const share = db
    .prepare(
      'SELECT * FROM shares WHERE document_id = ? AND user_id = ?'
    )
    .get(docId, userId);
  if (!share) return null;
  return { ...doc, access: share.permission };
}

function createDocument(db, { title, content, ownerId }) {
  const owner = getUser(db, ownerId);
  if (!owner) {
    const err = new Error('Unknown owner');
    err.status = 400;
    throw err;
  }
  const id = newId('d');
  const ts = nowIso();
  const finalTitle = (title || '').trim() || 'Untitled document';
  db.prepare(
    `INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, finalTitle, content || '', ownerId, ts, ts);
  return getDocumentForUser(db, id, ownerId);
}

function updateDocument(db, docId, userId, { title, content }) {
  const doc = getDocumentForUser(db, docId, userId);
  if (!doc) {
    const err = new Error('Not found or not permitted');
    err.status = 404;
    throw err;
  }
  if (doc.access === 'view') {
    const err = new Error('View-only access');
    err.status = 403;
    throw err;
  }

  const nextTitle =
    title !== undefined ? (title.trim() || 'Untitled document') : doc.title;
  const nextContent = content !== undefined ? content : doc.content;

  db.prepare(
    `UPDATE documents SET title = ?, content = ?, updated_at = ? WHERE id = ?`
  ).run(nextTitle, nextContent, nowIso(), docId);

  return getDocumentForUser(db, docId, userId);
}

function deleteDocument(db, docId, userId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  if (!doc || doc.owner_id !== userId) {
    const err = new Error('Not found or not permitted');
    err.status = 404;
    throw err;
  }
  db.prepare('DELETE FROM documents WHERE id = ?').run(docId);
  return { ok: true };
}

// Only the owner may share. Sharing with self or a nonexistent user is
// rejected. Re-sharing updates the permission (idempotent upsert).
function shareDocument(db, docId, ownerId, { targetUserId, permission }) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }
  if (doc.owner_id !== ownerId) {
    const err = new Error('Only the owner can share this document');
    err.status = 403;
    throw err;
  }
  if (targetUserId === ownerId) {
    const err = new Error('Document is already owned by this user');
    err.status = 400;
    throw err;
  }
  const target = getUser(db, targetUserId);
  if (!target) {
    const err = new Error('Target user not found');
    err.status = 404;
    throw err;
  }
  const perm = permission === 'view' ? 'view' : 'edit';

  db.prepare(
    `INSERT INTO shares (document_id, user_id, permission, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(document_id, user_id) DO UPDATE SET permission = excluded.permission`
  ).run(docId, targetUserId, perm, nowIso());

  return listSharesForDocument(db, docId);
}

function revokeShare(db, docId, ownerId, targetUserId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  if (!doc || doc.owner_id !== ownerId) {
    const err = new Error('Not found or not permitted');
    err.status = 404;
    throw err;
  }
  db.prepare(
    'DELETE FROM shares WHERE document_id = ? AND user_id = ?'
  ).run(docId, targetUserId);
  return listSharesForDocument(db, docId);
}

function listSharesForDocument(db, docId) {
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, s.permission
       FROM shares s JOIN users u ON u.id = s.user_id
       WHERE s.document_id = ?
       ORDER BY u.name`
    )
    .all(docId);
}

module.exports = {
  newId,
  getUser,
  listUsers,
  listDocumentsForUser,
  getDocumentForUser,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  revokeShare,
  listSharesForDocument,
};
