'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import LoginScreen from '../components/LoginScreen';
import { api } from '../lib/apiClient';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DocCard({ doc, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="text-left w-full bg-white border border-black/5 rounded-xl p-4 hover:border-accent/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-ink truncate">{doc.title}</h3>
        <span
          className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${
            doc.access === 'owner'
              ? 'bg-accent/10 text-accent'
              : doc.access === 'view'
              ? 'bg-black/5 text-ink/50'
              : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {doc.access === 'owner'
            ? 'Owned by you'
            : doc.access === 'view'
            ? 'Shared · view'
            : 'Shared · edit'}
        </span>
      </div>
      <p className="text-xs text-ink/40 mt-2">
        Updated {formatDate(doc.updated_at)}
      </p>
    </button>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(undefined); // undefined = loading
  const [docs, setDocs] = useState({ owned: [], shared: [] });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api('/api/session')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user) loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadDocs() {
    try {
      const d = await api('/api/documents');
      setDocs(d);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleCreate() {
    setCreating(true);
    setError('');
    try {
      const d = await api('/api/documents', {
        method: 'POST',
        body: JSON.stringify({ title: 'Untitled document' }),
      });
      router.push(`/doc/${d.document.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      router.push(`/doc/${data.document.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() {
    await api('/api/session', { method: 'DELETE' });
    setUser(null);
    setDocs({ owned: [], shared: [] });
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink/40 text-sm">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/5 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Ajaia Docs</h1>
            <p className="text-xs text-ink/40">
              Signed in as <span className="font-medium">{user.name}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-ink/50 hover:text-ink"
          >
            Switch user
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {creating ? 'Creating…' : '+ New document'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-white border border-black/10 text-ink text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {uploading ? 'Importing…' : 'Import file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={handleUpload}
          />
          <span className="text-xs text-ink/40">
            Supports .txt and .md files only
          </span>
        </div>

        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-ink/60 mb-3">
            Your documents
          </h2>
          {docs.owned.length === 0 ? (
            <p className="text-sm text-ink/40">
              No documents yet — create one above.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {docs.owned.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onOpen={() => router.push(`/doc/${doc.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink/60 mb-3">
            Shared with you
          </h2>
          {docs.shared.length === 0 ? (
            <p className="text-sm text-ink/40">
              Nothing has been shared with you yet.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {docs.shared.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onOpen={() => router.push(`/doc/${doc.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
