import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { listUsers } from '../../../lib/documents';

export async function GET() {
  const db = getDb()
  const users = listUsers(db);
  return NextResponse.json({ users });
}
