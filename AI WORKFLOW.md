# AI usage note

## Tools used

Claude (Sonnet, via Claude.ai's agentic coding environment) for the entire
build — planning the schema, writing every file, running the app in a
sandbox to test it. No other AI coding tools (Copilot, Cursor, etc.) were
used.

## Where it materially sped things up

- **Boilerplate elimination**: Next.js route handlers, TipTap editor
  wiring, and the CRUD/sharing API surface are mechanical once the schema
  is decided. AI writing all of this in one pass, correctly wired together
  on the first try, is where most of the time savings came from — this is
  the kind of code where the risk is typos and wiring mismatches, not
  design decisions.
- **Running its own sandbox to self-check**: rather than writing code and
  hoping, the assistant ran `npm install`, `npm run build`, `npm test`,
  and started the actual server to hit the API with `curl` (login, create,
  share, permission checks, valid/invalid file upload) *before* handing
  anything over. That caught issues (e.g. an early route path mismatch)
  before I ever saw them, rather than in review.

## What I changed or rejected

- **Rejected: deploying with SQLite on Vercel.** The initial build was
  ready to "deploy," but I pushed back on treating that as done — SQLite's
  file storage doesn't survive Vercel's ephemeral filesystem. I asked for
  this to be stated as an explicit, honest limitation in the README rather
  than silently shipping something that would lose data in production, or
  scope-creeping into a Postgres migration that wasn't asked for.
- **Rejected: real-time collaborative editing** as a "quick win." It was
  raised as a natural extension, but I kept the debounced-autosave /
  last-write-wins model since it satisfies the actual requirement
  ("shared access behavior can be demonstrated") without opening up a
  multi-day scope (Yjs, websockets, conflict resolution) inside a 4–6 hour
  assignment.
- **Kept, unchanged: the mock-auth approach and the `.txt`/`.md`-only file
  import.** Both were AI proposals I agreed with as reasonable scope cuts,
  since the brief explicitly allows simulated users and doesn't require
  every file format — I didn't need to change these, just confirm the
  tradeoff was stated clearly rather than hidden.

## How correctness, UX, and reliability were verified

- **Automated tests** (19, Jest) exercise the sharing/permission logic
  directly against an in-memory SQLite DB: owner-only actions, view-vs-edit
  enforcement, revoke behavior, and the file-import HTML conversion
  (including an HTML-injection check on untrusted upload content).
- **Manual end-to-end verification** via a running server and `curl`:
  login as each seeded user, create/share/revoke, confirm a view-only
  collaborator gets a 403 on write attempts, confirm a non-collaborator
  gets a 404 (not a document-exists-revealing 403), and confirm unsupported
  file types are rejected with a 415.
- **Build verification**: a clean `npm run build` was run to confirm no
  compile errors before delivery, not just `npm run dev` working locally.