import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { listDocumentsForUser, createDocument } from '../../../lib/documents';
import { getCurrentUserId } from '../../../lib/auth';

export async function GET() {
  const userId = getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const { owned, shared } = listDocumentsForUser(db, userId);
  return NextResponse.json({ owned, shared });
}

export async function POST(req) {
  const userId = getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const title =
    typeof body.title === 'string' ? body.title.slice(0, 200) : '';
  try {
    const doc = createDocument(db, {
      title,
      content: '<p></p>',
      ownerId: userId,
    });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}
