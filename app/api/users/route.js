import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { listUsers } from '../../../lib/documents';

export async function GET() {
  const users = listUsers(db);
  return NextResponse.json({ users });
}
