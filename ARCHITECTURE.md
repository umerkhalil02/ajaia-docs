# Architecture note

## What I optimized for

Within the timebox, I prioritized in this order:

1. **A coherent end-to-end flow over breadth of features.** Create → edit →
   format → rename → save → refresh → share → open as a different user →
   permission enforcement — all of that works cleanly, rather than having
   many half-working surfaces.
2. **Server-enforced permissions, not just UI hiding.** View-only sharing is
   checked in the API (`updateDocument` throws 403 for `access === 'view'`),
   not just disabled in the editor. A user who isn't the owner or a
   collaborator gets a 404 (not a 403) when trying to open a document, to
   avoid confirming a document ID exists to someone with no access to it.
3. **A real automated test suite for the logic that matters most** — the
   data layer governing ownership, sharing, and permissions, plus the file
   import parser (including an HTML-injection check). These are the parts
   most likely to have subtle bugs and least likely to be caught by manually
   clicking through the UI.
4. **Honest scope boundaries, stated clearly**, rather than a shakier
   attempt at everything the brief gestures at (e.g. `.docx` import,
   real-time co-editing, granular ACLs).

## Key decisions & tradeoffs

**Next.js App Router, single deployable.** One codebase, one process, API
routes and pages together. For a 4-hour scope this removes an entire class
of "does the frontend correctly call the right backend URL" problems and
keeps setup to `npm install && npm run dev`.

**SQLite via `better-sqlite3`, not Postgres/Supabase.** Zero external
services to provision, synchronous API keeps route handlers simple and
readable, and the schema (3 tables, no ORM) is fully visible in
`lib/db.js`. The real cost of this choice is deployment: SQLite's
file-based storage doesn't survive on serverless platforms with ephemeral
filesystems (Vercel). I chose to keep the simpler local persistence model
and be explicit about that constraint in the README rather than spend part
of the timebox migrating to a hosted Postgres purely to satisfy a
"deployed on Vercel" checkbox. The data layer (`lib/documents.js`) doesn't
know or care what database is underneath, so that migration is
mechanical if it were needed next.

**Mock auth via seeded users + a plain cookie, not real accounts.** The
brief explicitly allows this ("You may simulate users with seeded accounts
... if that keeps the scope reasonable"). Building password auth, sessions,
and account creation would have consumed a large fraction of the timebox
for something orthogonal to what's actually being evaluated: document
editing, sharing logic, and file handling. The tradeoff is explicit and
documented — this is not how I'd ship a real product.

**Content stored as sanitized-on-output HTML string, not a structured
CRDT/OT document.** TipTap's `getHTML()`/`setContent()` round-trips cleanly
through a single `content` column, which is enough to satisfy "formatting
is preserved reasonably" and "shared access can be demonstrated." It is
explicitly **not** real-time collaborative editing — two people editing the
same document concurrently will overwrite each other's un-synced changes
(last write wins on save, ~800ms debounce). A production version of this
product would need OT/CRDT (e.g. Yjs) and a WebSocket layer; that's a
multi-day project on its own and out of scope here.

**File import limited to `.txt` and `.md`.** `.docx` parsing (via mammoth
or similar) was the next thing I'd add — it's a bounded, well-supported
library task — but `.txt`/`.md` already demonstrates the full loop (upload
→ parse → structure → new document) and let me spend the remaining time on
sharing/permission correctness instead. The limitation is stated in both
the UI (next to the import button) and the README, and the API rejects
unsupported types with a clear 415 rather than failing silently.

**No real-time presence / live collaboration UI.** Out of scope per above;
the assignment asks for "a way to grant another user access" and "shared
access behavior can be demonstrated," which is satisfied by the
share/permission model without needing live cursors or sockets.

## What I'd build next with more time

1. Real-time co-editing via Yjs + a WebSocket provider, replacing the
   debounced-save model.
2. `.docx` import support.
3. Real authentication (email/password or OAuth) behind the same
   `lib/documents.js` interface — the permission logic wouldn't need to
   change.
4. Document version history / activity log (who changed what, when) — the
   `updated_at` column and owner/share model are already in place to build
   on.
5. Deploy target with persistent Postgres for a public, always-on demo.
