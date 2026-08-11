import { NextResponse } from 'next/server';
import { getCurrentUserId } from '../../../lib/auth';
import { getDb } from '../../../lib/db';
import { createDocument } from '../../../lib/documents';
import { isExtensionSupported, textToHtml } from '../../../lib/importFile';

const MAX_BYTES = 2 * 1024 * 1024; // 2MB, generous for plain text/markdown

export async function POST(req) {
  const userId = getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with a "file" field' },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!isExtensionSupported(file.name)) {
    return NextResponse.json(
      { error: 'Only .txt and .md files are supported for import' },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File is too large (2MB max)' },
      { status: 413 }
    );
  }

  const raw = await file.text();
  const html = textToHtml(raw, file.name);
  const title = file.name.replace(/\.(txt|md)$/i, '') || 'Imported document';
  const db = getDb()

  try {
    const doc = createDocument(db, { title, content: html, ownerId: userId });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}
