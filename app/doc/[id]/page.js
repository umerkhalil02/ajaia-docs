'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import ShareDialog from '../../../components/ShareDialog';
import { api } from '../../../lib/apiClient';

const Editor = dynamic(() => import('../../../components/Editor'), {
  ssr: false,
});

const SAVE_DEBOUNCE_MS = 800;

export default function DocPage({ params }) {
  const router = useRouter();
  const { id } = params;

  const [user, setUser] = useState(undefined);
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  const saveTimer = useRef(null);
  const latestContent = useRef(null);

  useEffect(() => {
    api('/api/session').then((d) => setUser(d.user));
  }, []);

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/documents/${id}`);
      setDoc(d.document);
      setTitle(d.document.title);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  function scheduleSave(patch) {
    setStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const d = await api(`/api/documents/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        });
        setDoc(d.document);
        setStatus('saved');
      } catch (e) {
        setStatus('error');
        setError(e.message);
      }
    }, SAVE_DEBOUNCE_MS);
  }

  function handleTitleChange(e) {
    const value = e.target.value;
    setTitle(value);
    scheduleSave({ title: value, content: latestContent.current ?? undefined });
  }

  function handleContentChange(html) {
    latestContent.current = html;
    scheduleSave({ content: html });
  }

  if (user === undefined || (user && !doc && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink/40 text-sm">
        Loading…
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  if (error && !doc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-accent hover:underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const isOwner = doc.access === 'owner';
  const canEdit = doc.access !== 'view';

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/5 bg-white sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-ink/40 hover:text-ink text-sm shrink-0"
          >
            ← Docs
          </button>
          <input
            value={title}
            onChange={handleTitleChange}
            disabled={!canEdit}
            className="flex-1 min-w-0 text-lg font-medium text-ink bg-transparent focus:outline-none focus:bg-black/5 rounded px-2 py-1 disabled:opacity-70"
            placeholder="Untitled document"
          />
          <span className="text-xs text-ink/40 shrink-0">
            {status === 'saving' && 'Saving…'}
            {status === 'saved' && 'Saved'}
            {status === 'error' && 'Save failed'}
          </span>
          {!canEdit && (
            <span className="text-xs bg-black/5 text-ink/50 px-2 py-0.5 rounded-full shrink-0">
              View only
            </span>
          )}
          {isOwner && (
            <button
              onClick={() => setShareOpen(true)}
              className="bg-accent text-white text-sm font-medium px-3 py-1.5 rounded-lg shrink-0"
            >
              Share
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-black/5 shadow-sm px-6 py-4">
          <Editor
            initialContent={doc.content}
            editable={canEdit}
            onChange={handleContentChange}
          />
        </div>
      </main>

      {shareOpen && (
        <ShareDialog
          docId={id}
          currentUserId={user.id}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
