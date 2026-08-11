import { NextResponse } from 'next/server';
import { getCurrentUserId } from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';
import {
  deleteDocument,
  getDocumentForUser,
  listSharesForDocument,
  updateDocument,
} from '../../../../lib/documents';

export async function GET(req, { params }) {
  const userId = getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const db = getDb()
  const doc = getDocumentForUser(db, params.id, userId);
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const shares = doc.owner_id === userId ? listSharesForDocument(db, doc.id) : [];
  return NextResponse.json({ document: doc, shares });
}

export async function PATCH(req, { params }) {
  const userId = getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));

  if (body.title !== undefined && typeof body.title !== 'string') {
    return NextResponse.json({ error: 'title must be a string' }, { status: 400 });
  }
  if (body.content !== undefined && typeof body.content !== 'string') {
    return NextResponse.json({ error: 'content must be a string' }, { status: 400 });
  }
  const db = getDb()
  try {
    const doc = updateDocument(db, params.id, userId, {
      title: body.title,
      content: body.content,
    });
    return NextResponse.json({ document: doc });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const userId = getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const db = getDb()
  try {
    deleteDocument(db, params.id, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}
