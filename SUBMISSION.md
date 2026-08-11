# Submission

## What's included

**Application code** — full stack app in this repository (Next.js + SQLite):
- `app/` — pages (dashboard, editor) and API routes (documents, sharing, upload, session/auth)
- `components/` — Editor (rich text + toolbar), LoginScreen, ShareDialog
- `lib/` — database layer, document/sharing logic, file-import conversion, mock-auth helper, API client
- `scripts/seed.js` — resets the local database to seed state

**Tests**
- `__tests__/documents.test.js` — document creation, ownership, sharing, permission enforcement (owner/edit/view), revoke behavior
- `__tests__/importFile.test.js` — `.txt`/`.md` → editor HTML conversion, including an HTML-injection check on untrusted content
- 19 tests total, run with `npm test`

**Documentation**
- `README.md` — setup, run, and test instructions; feature list; supported file types; deployment notes
- `ARCHITECTURE.md` — what was prioritized and why, key tradeoffs, what was deprioritized, what's next
- `AI_USAGE.md` — which AI tools were used, where they sped up the work, what was changed/rejected, how correctness was verified
- `SUBMISSION.md` — this file

**Video**
- 3–5 minute walkthrough covering: main user flow, what works end to end, what was deprioritized, key implementation decisions, and how AI supported the workflow
- Link: **https://drive.google.com/file/d/1sKNmFsldxYDhJ-9ipipwC48bWQhpb1O9/view?usp=sharing**

**Hosted Link**
- Link: **https://ajaia-docs-production-79ea.up.railway.app/**


**Not included**
- `.docx` file import — only `.txt` and `.md` are supported, stated in the UI and README
- Real-time collaborative editing — autosave with last-write-wins instead; reasoning documented in `ARCHITECTURE.md`
- Real authentication — seeded mock users instead, as explicitly permitted by the assignment brief

## How to run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, pick a seeded user (Alice / Bob / Carol) at the login screen. See `README.md` for full details, including how to reset the database (`npm run seed`) and how to run tests (`npm test`).
