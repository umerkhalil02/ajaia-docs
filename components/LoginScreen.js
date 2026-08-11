'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';

export default function LoginScreen({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/users')
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message));
  }, []);

  async function handleLogin(userId) {
    setBusy(userId);
    setError('');
    try {
      const d = await api('/api/session', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      onLogin(d.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-black/5 p-8">
        <h1 className="text-xl font-semibold text-ink mb-1">Ajaia Docs</h1>
        <p className="text-sm text-ink/60 mb-6">
          This demo uses seeded accounts instead of real sign-in. Pick a user
          to continue.
        </p>
        <div className="space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => handleLogin(u.id)}
              disabled={busy !== null}
              className="w-full flex items-center gap-3 rounded-lg border border-black/10 px-3 py-2.5 text-left hover:border-accent hover:bg-accent/5 transition-colors disabled:opacity-50"
            >
              <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-semibold">
                {u.name.charAt(0)}
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">
                  {u.name}
                </span>
                <span className="block text-xs text-ink/50">{u.email}</span>
              </span>
              {busy === u.id && (
                <span className="ml-auto text-xs text-ink/40">signing in…</span>
              )}
            </button>
          ))}
          {users.length === 0 && !error && (
            <p className="text-sm text-ink/40">Loading users…</p>
          )}
        </div>
        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
}
