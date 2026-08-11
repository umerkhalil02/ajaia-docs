# Ajaia Docs

A lightweight collaborative document editor, built for the AI-Native Full
Stack Developer assignment. Next.js (App Router) front end and API routes,
SQLite for persistence, TipTap for rich-text editing.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for what was prioritized, what was
cut, and why.

## Features

- **Create / rename / edit documents** with a rich-text editor (bold,
  italic, underline, H1/H2/paragraph, bulleted & numbered lists, undo/redo).
  Content autosaves ~800ms after you stop typing.
- **File import**: upload a `.txt` or `.md` file to create a new document
  from it. Markdown headings, bold/italic, and lists are converted into the
  editor's formatting; `.txt` files import as plain paragraphs. Other file
  types are rejected with a clear error (client and API both enforce this).
- **Sharing**: the owner can share a document with another seeded user as
  "can edit" or "can view". Shared documents are clearly badged as
  `Shared · edit` / `Shared · view` and separated from "Your documents" on
  the dashboard. View-only access is enforced server-side, not just hidden
  in the UI.
- **Persistence**: everything is stored in a SQLite file
  (`data/app.db`) — documents, ownership, and shares all survive a refresh
  or server restart.
- **Mock auth**: no passwords. Pick one of three seeded users
  (Alice / Bob / Carol) from a login screen; a cookie remembers who you are.
  This is explicitly not production auth — see ARCHITECTURE.md.

## Requirements

- Node.js 18.18+ (works on 20/22 too). This project has been made with version 22 so to avoid any issues kindly use node.js version 22.

## Setup & run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. A SQLite database is created automatically
at `data/app.db` on first run, seeded with three users (Alice, Bob, Carol)
and one example document already shared from Alice to Bob.

To reset the database back to that seed state at any time:

```bash
npm run seed
```

### Production build

```bash
npm run build
npm run start
```

## Tests

```bash
npm test
```

Runs Jest against the data-access layer (`lib/documents.js`,
`lib/importFile.js`) using an in-memory SQLite database — no server needed.
Covers document creation, ownership checks, share/revoke behavior,
view-vs-edit permission enforcement, and the markdown-to-HTML import
conversion (including HTML-escaping untrusted input).

## Trying it out

1. Open the app, pick **Alice** at the login screen.
2. You'll see "Welcome to Ajaia Docs", already shared with Bob (view access
   won't apply here — she owns it).
3. Click **+ New document**, give it a title, try the formatting toolbar.
4. Click **Share**, grant Bob "can edit" or Carol "can view".
5. Click **Switch user** (top right) → sign in as Bob or Carol → the
   document now appears under "Shared with you", correctly badged and, for
   view-only, non-editable.
6. From the dashboard, click **Import file** and upload a `.md` or `.txt`
   file to see it converted into a new document.

## Supported file import types

Only `.txt` and `.md` are accepted, stated in the UI next to the import
button and enforced by the API (415 response for anything else, 2MB size
cap). This was a deliberate scope cut — see ARCHITECTURE.md.

## Deployment

This repo is ready to deploy as-is to any Node host with persistent disk
(Render, Railway, Fly.io, a VM, etc.) — run `npm run build && npm run start`
and mount a volume at `data/`.

It is **not** deployed to Vercel: Vercel's serverless functions have a
read-only, ephemeral filesystem, which is incompatible with the file-based
SQLite store used here (writes would silently vanish between requests, and
data wouldn't persist across function instances). Swapping in a hosted
Postgres (e.g. Supabase/Neon) would make it Vercel-compatible with minimal
changes, since all database access is already isolated behind
`lib/db.js` / `lib/documents.js` — but that was out of scope for this
timebox. See ARCHITECTURE.md for the reasoning.

## Project structure

```
app/
  page.js              Dashboard (login gate, document list, create/import)
  doc/[id]/page.js      Editor page (rename, edit, share)
  api/                  Route handlers (documents, sharing, upload, session)
components/
  Editor.js             TipTap rich-text editor + toolbar
  LoginScreen.js         Seeded-user login screen
  ShareDialog.js          Share/revoke modal
lib/
  db.js                  SQLite connection, schema, seed data
  documents.js            Data-access functions (unit tested)
  importFile.js            .txt/.md → editor HTML conversion (unit tested)
  auth.js                   Mock-auth cookie helper
  apiClient.js               Client-side fetch wrapper
__tests__/                Jest tests
scripts/seed.js            Reset/reseed the local database
```
