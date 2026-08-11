import { NextResponse } from 'next/server';
import { getCurrentUserId } from '../../../../../lib/auth';
import { getDb } from '../../../../../lib/db';
import { revokeShare, shareDocument } from '../../../../../lib/documents';

export async function POST(req, { params }) {
  const userId = getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (!body.targetUserId) {
    return NextResponse.json(
      { error: 'targetUserId is required' },
      { status: 400 }
    );
  }
  const db = getDb()
  try {
    const shares = shareDocument(db, params.id, userId, {
      targetUserId: body.targetUserId,
      permission: body.permission,
    });
    return NextResponse.json({ shares });
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
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  if (!targetUserId) {
    return NextResponse.json({ error: 'userId query param required' }, { status: 400 });
  }
  const db = getDb()
  try {
    const shares = revokeShare(db, params.id, userId, targetUserId);
    return NextResponse.json({ shares });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}
