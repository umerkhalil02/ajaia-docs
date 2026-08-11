const { createDb } = require('../lib/db');
const {
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  revokeShare,
  listDocumentsForUser,
  getDocumentForUser,
} = require('../lib/documents');

function makeDb() {
  const db = createDb(':memory:');
  const insertUser = db.prepare(
    'INSERT INTO users (id, name, email) VALUES (?, ?, ?)'
  );
  insertUser.run('u1', 'Alice', 'alice@test.dev');
  insertUser.run('u2', 'Bob', 'bob@test.dev');
  insertUser.run('u3', 'Carol', 'carol@test.dev');
  return db;
}

describe('createDocument', () => {
  test('creates a document owned by the given user', () => {
    const db = makeDb();
    const doc = createDocument(db, {
      title: 'My Doc',
      content: '<p>hi</p>',
      ownerId: 'u1',
    });
    expect(doc.title).toBe('My Doc');
    expect(doc.owner_id).toBe('u1');
    expect(doc.access).toBe('owner');
  });

  test('falls back to a default title when blank', () => {
    const db = makeDb();
    const doc = createDocument(db, { title: '  ', content: '', ownerId: 'u1' });
    expect(doc.title).toBe('Untitled document');
  });

  test('rejects an unknown owner', () => {
    const db = makeDb();
    expect(() =>
      createDocument(db, { title: 'X', content: '', ownerId: 'ghost' })
    ).toThrow();
  });
});

describe('updateDocument', () => {
  test('owner can update title and content', () => {
    const db = makeDb();
    const doc = createDocument(db, { title: 'A', content: '', ownerId: 'u1' });
    const updated = updateDocument(db, doc.id, 'u1', {
      title: 'B',
      content: '<p>new</p>',
    });
    expect(updated.title).toBe('B');
    expect(updated.content).toBe('<p>new</p>');
  });

  test('a user with no access cannot update the document', () => {
    const db = makeDb();
    const doc = createDocument(db, { title: 'A', content: '', ownerId: 'u1' });
    expect(() =>
      updateDocument(db, doc.id, 'u2', { title: 'Hacked' })
    ).toThrow();
  });

  test('a view-only collaborator cannot update the document', () => {
    const db = makeDb();
    const doc = createDocument(db, { title: 'A', content: '', ownerId: 'u1' });
    shareDocument(db, doc.id, 'u1', { targetUserId: 'u2', permission: 'view' });
    expect(() =>
      updateDocument(db, doc.id, 'u2', { title: 'Nope' })
    ).toThrow();
  });

  test('an edit collaborator can update the document', () => {
    const db = makeDb();
    const doc = createDocument(db, { title: 'A', content: '', ownerId: 'u1' });
    shareDocument(db, doc.id, 'u1', { targetUserId: 'u2', permission: 'edit' });
    const updated = updateDocument(db, doc.id, 'u2', { title: 'Team edit' });
    expect(updated.title).toBe('Team edit');
  });
});

describe('sharing', () => {
  test('only the owner can share the document', () => {
    const db = makeDb();
    const doc = createDocument(db, { title: 'A', content: '', ownerId: 'u1' });
    expect(() =>
      shareDocument(db, doc.id, 'u2', { targetUserId: 'u3', permission: 'edit' })
    ).toThrow();
  });

  test('shared document shows up in the target user list, not owned', () => {
    const db = makeDb();
    const doc = createDocument(db, { title: 'A', content: '', ownerId: 'u1' });
    shareDocument(db, doc.id, 'u1', { targetUserId: 'u2', permission: 'edit' });

    const bobDocs = listDocumentsForUser(db, 'u2');
    expect(bobDocs.owned.find((d) => d.id === doc.id)).toBeUndefined();
    expect(bobDocs.shared.find((d) => d.id === doc.id)).toBeTruthy();

    const aliceDocs = listDocumentsForUser(db, 'u1');
    expect(aliceDocs.owned.find((d) => d.id === doc.id)).toBeTruthy();
  });

  test('revoking access removes visibility for that user', () => {
    const db = makeDb();
    const doc = createDocument(db, { title: 'A', content: '', ownerId: 'u1' });
    shareDocument(db, doc.id, 'u1', { targetUserId: 'u2', permission: 'edit' });
    revokeShare(db, doc.id, 'u1', 'u2');

    expect(getDocumentForUser(db, doc.id, 'u2')).toBeNull();
  });

  test('a user cannot open a document that is neither owned nor shared', () => {
    const db = makeDb();
    const doc = createDocument(db, { title: 'A', content: '', ownerId: 'u1' });
    expect(getDocumentForUser(db, doc.id, 'u3')).toBeNull();
  });
});

describe('deleteDocument', () => {
  test('only the owner can delete', () => {
    const db = makeDb();
    const doc = createDocument(db, { title: 'A', content: '', ownerId: 'u1' });
    shareDocument(db, doc.id, 'u1', { targetUserId: 'u2', permission: 'edit' });
    expect(() => deleteDocument(db, doc.id, 'u2')).toThrow();
    expect(() => deleteDocument(db, doc.id, 'u1')).not.toThrow();
    expect(getDocumentForUser(db, doc.id, 'u1')).toBeNull();
  });
});
