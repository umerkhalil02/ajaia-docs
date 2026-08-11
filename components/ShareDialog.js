'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient';

export default function ShareDialog({ docId, currentUserId, onClose }) {
  const [users, setUsers] = useState([]);
  const [shares, setShares] = useState([]);
  const [targetId, setTargetId] = useState('');
  const [permission, setPermission] = useState('edit');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [{ users: allUsers }, { shares: docShares }] = await Promise.all([
      api('/api/users'),
      api(`/api/documents/${docId}`).then((d) => ({ shares: d.shares })),
    ]);
    const eligible = allUsers.filter((u) => u.id !== currentUserId);
    setUsers(eligible);
    setShares(docShares);
    if (!targetId && eligible.length > 0) setTargetId(eligible[0].id);
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  async function handleShare(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/api/documents/${docId}/share`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: targetId, permission }),
      });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(userId) {
    setBusy(true);
    setError('');
    try {
      await api(`/api/documents/${docId}/share?userId=${userId}`, {
        method: 'DELETE',
      });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-black/5 p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Share document</h2>
          <button
            onClick={onClose}
            className="text-ink/40 hover:text-ink text-sm"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleShare} className="flex gap-2 mb-4">
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="flex-1 border border-black/10 rounded-lg px-2 py-1.5 text-sm"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            className="border border-black/10 rounded-lg px-2 py-1.5 text-sm"
          >
            <option value="edit">Can edit</option>
            <option value="view">Can view</option>
          </select>
          <button
            type="submit"
            disabled={busy || !targetId}
            className="bg-accent text-white text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            Share
          </button>
        </form>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div>
          <h3 className="text-xs uppercase tracking-wide text-ink/40 mb-2">
            People with access
          </h3>
          {shares.length === 0 && (
            <p className="text-sm text-ink/40">
              Not shared with anyone yet.
            </p>
          )}
          <ul className="space-y-1.5">
            {shares.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {s.name}{' '}
                  <span className="text-ink/40">
                    · {s.permission === 'view' ? 'can view' : 'can edit'}
                  </span>
                </span>
                <button
                  onClick={() => handleRevoke(s.id)}
                  disabled={busy}
                  className="text-xs text-red-500 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
