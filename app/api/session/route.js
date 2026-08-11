import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '../../../lib/auth';
import { getDb } from '../../../lib/db';
import { getUser } from '../../../lib/documents';

export async function GET() {
  const store = cookies();
  const id = store.get(COOKIE_NAME)?.value || null;
  const db = getDb()
  const user = id ? getUser(db, id) : null;
  return NextResponse.json({ user: user || null });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const db = getDb()
  const { userId } = body;
  const user = userId ? getUser(db, userId) : null;
  if (!user) {
    return NextResponse.json({ error: 'Unknown user' }, { status: 400 });
  }
  const res = NextResponse.json({ user });
  res.cookies.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return res;
}
