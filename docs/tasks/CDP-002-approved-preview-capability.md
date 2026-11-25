# CDP-002: Close the creator-approved preview capability

Execution lane: architecture-impact
Task kind: implementation
Evidence posture: demonstrated — every acceptance item must be shown, not asserted
Task ID: CDP-002
Priority: P0
Target: close before the next architecture review
Project: Creator Distribution Platform (RainSpace pilot)
Repository: `Resonant-Jones/RainSpace`
Base commit: `39d9c5a` ("Persist approved public previews on creator drafts")

---

## Context

CDP-001 delivered the platform foundation: a creator-scoped catalog API over
PostgreSQL + pgvector, a storefront SPA, a creator console demonstration, and
ADR-0001.

Since then, work has landed on `main` in two commits:

- `7cb93dd` — "Present Rainspace Editions with a playable public film teaser"
- `39d9c5a` — "Persist approved public previews on creator drafts"

That work added a real capability: a creator can attach an approved public
derivative (an 18-second teaser) to a draft release; once the release is
published, the storefront resolves and plays that derivative. It added a
capability-gated studio write path, a migration (`0002_draft_preview`), a
`content_items.approved_preview_id` column, a public
`GET /api/creators/{slug}/catalog/{content_slug}/preview` endpoint, a
`DraftPreviews` console panel, a Vite dev-proxy that injects an operator bearer
token server-side, and the approved media files under `web/public/editions/`.

The capability works. It was verified end-to-end against the current `main`:
attachment persists to PostgreSQL; drafts stay out of public reads; a published
release resolves the approved preview; the teaser bytes are served with
`200 video/mp4`; and the capability gate returns `404` for a missing
capability header, a cross-origin request, and any non-studio path.

This task closes what that work left open. It is **not** a rewrite of it, and it
is not a request for new product features.

---

## Current Situation

The current tree passes the full validation chain:

| Suite | Result |
| --- | --- |
| `pytest -q` (in container, real PostgreSQL, real migrations) | 16 passed |
| `npm run lint --prefix web` | no findings |
| `npm run test --prefix web -- --run` | 24 passed (4 files) |
| `npm run build --prefix web` | succeeds |
| `npm run test:e2e --prefix web` | 5 passed |

Not every change in those two commits was an improvement. They are grouped
below by what they actually are, because the instruction differs: **keep**,
**restore**, or **untangle**. A reviewer should read this list as an
assessment, not a compliment.

### 1. Genuine gains — keep these

- The capability itself: a creator attaches an approved public derivative to a
  draft; once published, the storefront resolves and plays it.
- The capability model. The operator token never reaches the browser; the dev
  proxy injects it under loopback, same-origin, explicit opt-in header, method
  and path allowlists. This is a stronger boundary than anything in CDP-001,
  and it was verified: missing capability `404`, cross-origin `404`, non-studio
  path not proxied.
- `is_protected` is now enforced in the public projection. CDP-001's
  `_public_media` exposed any preview, teaser or cover regardless of that
  flag; this closes a real hole.
- Drafts provably stay out of public reads, with tests.
- Optimistic concurrency on the write path: a stale edit returns `409`.
- Migration discipline: versioned, additive, reversible.
- Media provenance: ffmpeg-generated, original synthesized soundtrack, generated
  stills, disclosed as a fictional studio.
- The whole validation chain is green with these commits in place.

### 2. Regressions against guarantees CDP-001 already made — restore these

These are not missing features. They are guarantees the foundation made that
the new work quietly withdrew.

- **The demonstration indicator is now quieter.** CDP-001 required "a persistent
  visible demo indicator". The banner is a collapsed `<details>`, so the
  statement that sign-in, checkout, messages and creator operations are
  simulated is one click away. The label still reads "Demo mode", but the
  requirement was about visibility, not about the presence of a disclosure.
- **The README's status framing got softer.** CDP-001 opened with "Status:
  foundation scaffold (CDP-001) … not a production marketplace. Nothing here
  is production ready". The new opening reads "Local demonstration." Both are
  true; the first was more useful to a reader who had not read the rest.
- **ADR-0001 now contains false statements.** It still says "All endpoints are
  public and read-only. There is no authentication." The platform has a write
  path with a capability model. An architecture record that is known to be
  wrong is worse than one that is absent.
- **Approval no longer binds access.** The approved derivative is a static
  asset at `web/public/editions/`, served unconditionally by the dev server
  and destined for Netlify. The API decides whether to *point* at the file;
  nothing decides whether its bytes are *reachable*. The approval step in the
  UI therefore does not govern the thing a visitor can fetch. Strictly, a
  public teaser is not "original or paid media", so this does not breach the
  media-privacy invariant's letter — but it does mean the approval model is
  decorative at the byte level, which is the opposite of what the console
  tells an operator.

### 3. Coupling the foundation did not have — untangle these

- **Demo-seed identity in request-time code.** `api/app/api/catalog.py`
  special-cases the slugs `{"night-bus-short-film", "field-recording-notes"}`
  to backfill approvals for rows predating the attachment column. The public
  API now knows specific seeded titles. CDP-001's API knew none.
- **The two data modes no longer agree.** The fixtures name the creator
  "Demo Creator"; the seed names it "Rainspace Editions". The README still
  describes the fixtures as mirroring the seeded rows, which is no longer
  true.
- **The capability path has no browser-level coverage.** The API side has
  three tests. The frontend gained no new unit tests and no browser test
  covers proxy → panel → attach → catalogue. The most novel code in the
  repository is the least covered.

### 4. An unfinished local detail

`docker-compose.yml` defaults `CORS_ORIGINS` to `http://localhost:5173` and
`http://localhost:8888` only. Opening the storefront at `127.0.0.1:5173` fails
every catalog read with `Failed to fetch`, because `localhost` and `127.0.0.1`
are different origins to a browser. A local `.env` works around it; a fresh
checkout does not.


---

## Delivery Philosophy

Ugly and functional is preferable to beautiful and incomplete. Extend what
exists; do not redesign it. Every change must be justified by a gap listed
above or by an invariant below — nothing speculative.

---

## Goal

Produce a version of the approved-preview capability that is architecturally
documented, honest about what the approval actually binds, covered end-to-end
by automated tests, and consistent with the rest of the platform.

The finished work must:

- **keep** the capability, the capability model, the `is_protected` enforcement
  and the concurrency rule exactly as they are, unless a test proves one of them
  wrong;
- **restore** the guarantees CDP-001 made that the new work withdrew — the
  visible demonstration indicator, an accurate status statement in the README,
  an ADR that is not contradicted by the code, and an approval step that binds
  something;
- **untangle** the coupling the new work introduced — seeded slugs in the
  request path, and the divergence between the fixtures and the seed.

The finished work must leave the repository with:

- one architecture decision covering the capability and its threat model, and
  ADR-0001 corrected where it is now false;
- approved derivatives whose reachability the approval step actually governs;
- no demo-seed identity in request-time code;
- automated coverage of the capability path, including its refusals;
- a visible, unmissable demonstration indicator;
- a documented, working local origin configuration;
- one deliberate, documented answer to the fixtures/seed divergence.

---

## Files

Authorized paths for this task:

- `api/app/api/draft_previews.py` — the studio router and approval model
- `api/app/api/catalog.py` — the public projection
- `api/app/models/entities.py` — the `approved_preview_id` column
- `api/app/seed_demo.py` — demo data
- `api/alembic/versions/` — migrations
- `api/tests/` — backend tests
- `api/Dockerfile`, `api/pyproject.toml` — backend build and config
- `web/src/` — storefront and console
- `web/e2e/` — browser tests
- `web/public/` — static assets
- `web/vite.config.ts` — dev proxy
- `docker-compose.yml`, `.env.example` — local configuration
- `docs/architecture/adr/` — architecture decisions
- `docs/tasks/` — this task spec
- `README.md` — setup, validation and operational notes

Supporting files under these directories may be created as necessary.

---

## Required Pre-Read

Before changing anything:

1. **Your original thread and context for `7cb93dd` and `39d9c5a`.** This task
   was written by someone who read your diff but did not have your reasoning.
   Your thread is the authority on *why* the capability is shaped the way it is.
   Reconcile every requirement below against it.
2. `docs/architecture/adr/0001-platform-foundation.md` — the current
   architectural contract, including the sections this task amends.
3. `README.md` — especially "Attach a public preview to a draft", which
   documents the operator capability setup.
4. `api/app/api/draft_previews.py`, `api/app/api/catalog.py`,
   `api/alembic/versions/0002_draft_preview.py`, `web/vite.config.ts`,
   `web/src/pages/admin/DraftPreviews.tsx`.
5. The CDP-001 task spec, for the invariants and the evidence expectations.
6. The current validation state: run the validation chain in *Validation* below
   before you change anything, so you know what is green before you start.

If you believe a requirement below is wrong, or does not apply to your design,
do not silently ignore it. Satisfy it, or state the disagreement with evidence
and propose the alternative in the closeout.

---

## ADR Impact

**Requires a new ADR and an amendment to ADR-0001.**

ADR-0001 is now materially incomplete: it states that every endpoint is public
and read-only and that there is no authentication. The platform has a write
path guarded by an operator capability.

Create `docs/architecture/adr/0002-approved-preview-capability.md` covering:

- the capability model: why the operator token never reaches the browser, what
  the dev proxy guarantees (loopback, same-origin, explicit opt-in header,
  method and path allowlists), and what a browser on the same machine can and
  cannot do;
- the threat model, stated honestly: a person with control of the operator's
  machine and its loopback interface is trusted; the capability is a
  convenience boundary, not a security boundary against a local attacker;
- the approval model: what "approved" means, where the allowlist lives, who
  may change it, and what happens when an approval is withdrawn;
- the attachment lifecycle and its concurrency rule;
- the public projection rule, including how an approved derivative becomes
  reachable by the public;
- tenancy: the capability is bound to one creator and to drafts only;
- what remains deferred (real authentication, creator roles, object storage,
  signed URLs, a scheduler);
- the known limitations carried forward from ADR-0001.

Amend ADR-0001 so that its "Demo-mode versus real-operation boundaries" and
"All endpoints are public and read-only" statements are no longer false. Do not
silently rewrite its history — mark what changed and why.

---

## Current-Truth Anchors

### What is known

- The capability works today: attach, persist, publish, resolve, serve.
- The capability gate refuses correctly: missing header `404`, cross-origin
  `404`, non-studio path not proxied.
- The approved derivative is ffmpeg-generated with an original synthesized
  soundtrack, and the cover stills are generated for the demo.
- "Rainspace Editions" is disclosed as a fictional studio in the demo banner.
- The tenant rule holds: drafts never appear in public catalog reads, and the
  capability is scoped to one creator.

### What is not established

- Whether the approved derivative should be served by the API, by signed URLs,
  or by a storage host. This is a design decision, and the ADR must record
  whichever is chosen.
- Whether a withdrawn approval must take effect without a redeploy.
- Whether the fixtures/seed divergence is intended.

### Safe assumptions

- The pilot creator remains fictional and the content remains placeholder.
- The studio remains a local, development-only capability.
- No production service, payment provider, or third-party dependency is
  introduced.

---

## Invariants

These carry forward from CDP-001 and are not negotiable.

1. **Creator isolation.** Every persisted content item belongs to a creator.
   Every query applies creator scope at the backend.
2. **Brand independence.** No platform component depends on a particular
   creator's name, identity or visual assets.
3. **Explicit demo mode.** Simulated authentication, purchases and messages
   must never appear to be real operations, and the demonstration indicator
   must be visible without interaction.
4. **Media privacy.** Original and paid media must not be exposed through
   public frontend assets or unprotected static URLs.
5. **Payment eligibility.** No payment provider is activated. Adult-oriented
   content is not configured for any processor.
6. **Human publishing authority.** A creator or authorised operator approves
   content before publication. Attaching a preview to a draft is not
   publication.
7. **AI boundaries.** Generated captions and metadata remain drafts. No AI
   persona or impersonation.
8. **No hidden production services.** No unrequested paid infrastructure or
   external dependency.
9. **Independent ownership.** The platform does not require any other
   repository or runtime.
10. **Reviewable changes.** One bounded task, one validated change set, one
    commit.

---

## Requirements

Each requirement is tagged with what kind of work it is: **restore** (put back
a guarantee CDP-001 made), **extend** (finish something the new work started),
or **untangle** (remove coupling the new work introduced).

### 1. [extend] Document the capability

Write ADR-0002 and amend ADR-0001 as described under **ADR Impact**. The ADR
must state the threat model, not only the mechanism.

### 2. [restore] Make the approval step bind something

The console tells an operator that attaching a preview approves it for
publication. Today that approval governs whether the API *points* at a static
file; it does not govern whether the file's bytes can be fetched. Make the
approval bind the access, and choose and implement one approach, recorded in
ADR-0002:

- serve the derivative bytes through the API, or
- issue a short-lived signed path for an approved derivative, or
- move approved derivatives out of `web/public/` into a location the API
  controls.

Requirements for whichever approach is chosen:

- withdrawing an approval must stop the derivative being served, without
  requiring a redeploy;
- the public storefront must still resolve and play the teaser for a published
  release;
- no original, protected or unapproved asset becomes reachable;
- the local development experience must remain usable without additional
  infrastructure.

If you conclude that a static path is acceptable *for the pilot only*, say so
explicitly in ADR-0002, state the condition under which it stops being
acceptable, and make the withdrawal limitation visible in the README. That is
an acceptable outcome **only if the operator is told**.

### 3. [untangle] Remove demo-seed identity from request-time code

The public API must not contain slug-specific logic. The backfill for rows that
predate the attachment column belongs in the seed or a migration, not in a
catalog request. `api/app/api/catalog.py` must contain no seeded slug literals.

### 4. [extend] Cover the capability path with automated tests

Add coverage at both layers.

**Backend** (`api/tests/`), extending the existing suite rather than replacing
it:

- a browser-shaped request through the studio path succeeds only with the
  capability, the correct creator and a draft target;
- refusals: missing capability, wrong creator, non-draft status, unknown
  preview id, a path-shaped or URL-shaped preview id, and a conflicting
  concurrent write;
- a draft with an attachment stays out of the public catalogue and out of the
  public preview endpoint;
- a release that is published after the attachment resolves the approved
  derivative in the public projection;
- the public projection exposes no protected asset, storage object key, or
  transcript content.

**Frontend** (`web/src/test/` and `web/e2e/`):

- unit tests for the console panel's states: loading, attaching, attached,
  conflict, and refusal;
- a browser test that exercises the whole path against the real stack —
  attach through the proxy, confirm persistence, confirm the draft is not
  publicly visible, publish, confirm the preview resolves and the bytes are
  served, detach, confirm it is gone.

The browser test must run against the production build, as the existing suite
does.

### 5. [restore] Keep the demonstration indicator visible

The statement that sign-in, checkout, messages and creator operations are
simulated must be readable without clicking. CDP-001 required a *persistent
visible* indicator; a collapsed disclosure as the only carrier of that
statement withdraws it. The one-line statement must be on the surface of every
route, and the data-source mode must remain visible. A collapsed disclosure may
remain as an additional detail.

### 6. [extend] Fix the local origin configuration

`docker-compose.yml` and `.env.example` must list every origin the local
storefront can be opened at — `http://localhost:5173`, `http://127.0.0.1:5173`,
and the equivalent `8888` entries — so a fresh checkout works whether the
browser is pointed at `localhost` or `127.0.0.1`. Document the reason: the two
are different origins to a browser, and a mismatch fails as `Failed to fetch`
rather than as a clear CORS message.

### 7. [untangle] Resolve the fixtures/seed divergence deliberately

Either align the fixtures with the seeded creator and copy, or keep them
different and state in the README exactly how the two modes differ and why.
The README must not claim the modes are identical if they are not.

### 8. [restore] Keep the README's status statement accurate

The README must still tell a reader who has read nothing else what this
repository is. Restore or replace the CDP-001 status statement with one that is
equally explicit about what exists, what is simulated, and what is not
implemented. "Local demonstration" alone does not carry that weight; if you
prefer the newer wording, it must still name the absence of authentication,
payments, ingestion and publishing.

---

## Acceptance Criteria

The task is complete when:

- ADR-0002 exists and ADR-0001 no longer contains statements contradicted by
  the code.
- The approval step governs the reachability of the approved derivative, and
  withdrawing an approval stops it being served without a redeploy — or, if
  the static path is kept deliberately, the operator is told in ADR-0002 and
  the README exactly what the limitation is.
- `api/app/api/catalog.py` contains no seeded slug literals.
- The backend suite covers the capability and its refusals, and passes.
- The frontend has unit coverage for the console panel, and a browser test
  covers the attach → publish → resolve → detach path against the production
  build.
- The demonstration statement is visible on every route without interaction.
- The README states what this repository is, with the same explicitness about
  what is absent as CDP-001 had.
- A fresh checkout runs the API and the storefront with no origin error,
  whether opened at `localhost` or `127.0.0.1`.
- The README describes what the fixtures and the seed each contain.
- The CDP-001 validation chain still passes end to end.
- The final diff contains no credentials and no unrelated files.

A claim is not accepted without the command that demonstrates it. Equally, a
requirement this task marks **restore** is not satisfied by adding a new
mechanism alongside the withdrawn guarantee — the guarantee comes back.

---

## Non-Goals

Do not implement:

- production authentication, accounts or creator roles;
- payment providers, checkout or entitlements;
- object storage, signed-URL infrastructure or CDN work beyond what the
  approved-derivative requirement needs;
- video upload, transcoding, FFmpeg pipelines or the scheduled publisher;
- transcription, caption generation or embedding generation;
- a generic workflow engine or a general task queue;
- a second creator, tenant onboarding or multi-creator routing;
- changes to the catalog's tenancy model, publication states or theme system.

---

## Proof Surface

### Backend

- Capability refusal matrix, with status codes.
- Attachment persisted in PostgreSQL and read back.
- Draft excluded from public catalogue and preview reads.
- Published release resolves the approved derivative.
- Public payload scan: no protected asset, storage object key or transcript
  content.
- Migration applies on top of `0002_draft_preview` and downgrades cleanly.

### Frontend

- Production build succeeds.
- New and existing unit tests pass.
- Browser test drives the full capability path and passes against the
  production build.
- Demonstration statement visible on every route without interaction.

### Deployment

- Verified Netlify build output with the approved-derivative change applied.
- If the deployed site is reachable, the published release plays the teaser
  and the bytes are served from the approved path, not from a static file.

### Compatibility and Migration Impact

- The schema change is additive and reversible. No user data is dropped.
- Any new migration must be versioned, reviewed and reversible.
- No automatic destructive migration behaviour may be introduced.
- Moving approved derivatives out of `web/public/` changes what the deployed
  site ships; the README and the deployment notes must state the new
  requirement.

---

## Documentation Follow-Through

Update:

- `README.md`
- `.env.example`
- `docs/architecture/adr/0001-platform-foundation.md` (amendment)
- `docs/architecture/adr/0002-approved-preview-capability.md` (new)

Document what works, what is simulated, and what is not implemented. Do not
claim the platform is ready to accept paying customers, and do not claim
operational privacy, payment compliance or tenant isolation beyond the
surfaces actually tested.

---

## Validation

Run from the repository root.

```bash
# Inspect the working tree first
git status --short --branch --untracked-files=all

# Frontend
npm ci --prefix web
npm run lint --prefix web
npm run test --prefix web -- --run
npm run build --prefix web

# Backend infrastructure
docker compose up -d --build db api
docker compose exec -T api alembic upgrade head
docker compose exec -T api python -m app.seed_demo

# Backend tests
docker compose exec -T api pytest -q

# HTTP responses
curl -fsS http://localhost:8000/health
curl -fsS http://localhost:8000/api/creators/demo/catalog

# Browser verification
npm run test:e2e --prefix web

# Diff hygiene
git diff --check
```

Where the task changes the local origin configuration, the validation must
also include a run started from a clean checkout with no pre-existing `.env`,
opened at `127.0.0.1`, and confirm the catalogue loads.

If browser dependencies are unavailable in the environment, report the exact
blocker. A successful build is not a substitute for browser verification.

---

## Git Commands

Inspect the worktree before modification and again before committing. Preserve
unrelated and concurrent changes — another agent may be working in this
repository.

Stage only the paths you changed:

```bash
git add <your paths>
git diff --cached --check
git diff --cached --stat
```

Commit only after validation succeeds:

```bash
git commit -m "Close the creator-approved preview capability"
```

Do not use `git add .`. Do not push, merge, open a pull request or modify an
issue without separate authorization.

---

## Required Evidence Format

This is the part that matters most. The reviewer holds your original thread
and will compare your claims against what you actually ran.

For **every** acceptance item, the closeout must contain:

1. the exact command you ran;
2. its relevant output, unedited and untrimmed, including the failing case if
   a case is expected to fail;
3. a one-line statement of what the output proves.

Rules:

- Do not describe behaviour you did not run. If something is asserted from
  reading code, label it as such.
- Do not report a green suite without the summary line.
- If a test is skipped, flaky or environment-blocked, say so and give the
  reason. A skipped test is not a pass.
- If you disagree with a finding in this spec, say so, show the evidence for
  your reading, and state what you did instead. Do not quietly implement a
  different thing and report it as this one.
- If you changed a behaviour that was previously correct, show the before and
  after.
- For every requirement marked **restore**, show the guarantee that was
  withdrawn and the command that demonstrates it is back. "The banner still has
  a 'Demo mode' label" is not evidence that a persistent *visible* indicator
  was restored; a screenshot of the route, with the statement readable without
  interaction, is.
- For every requirement marked **keep**, do not restate the behaviour as
  though it were new. Say that it was already correct and left alone, and
  point at the test that covers it.

---

## Expected Closeout

Report:

1. What you changed, file by file, tagged **restore** / **extend** /
   **untangle**.
2. The architecture you chose for requirement 2, and why, with the ADR
   reference.
3. What you changed in ADR-0001, and the exact statements you corrected.
4. Which of the gains in the Current Situation you left alone, and which test
   covers each.
5. Validation commands and actual results, in the evidence format above.
6. Warnings separately from failures.
7. Anything you believe is still missing, including anything in this spec you
   judged not to apply, and why.
8. Anything you found that this spec did not know about — particularly if the
   spec's assessment of one of your own commits turned out to be wrong.
9. The commit hash, if committed.

Do not claim functionality is complete unless the relevant proof surface has
passed.

---

## Source Evidence

- CDP-001 task spec — the foundation, its invariants and its proof surface.
- ADR-0001 — the platform's architectural contract, as amended by this task.
- Original thread and context for `7cb93dd` and `39d9c5a` — the authority on
  the intent behind the capability.
- Verification performed at base commit `39d9c5a`: 16 backend tests, 24
  frontend unit tests, 5 browser tests, plus a manual end-to-end round trip of
  the capability path (attach → persist → draft hidden → publish → resolve →
  bytes served → detach) and the refusal matrix (missing capability `404`,
  cross-origin `404`, non-studio path not proxied).
- Netlify Acceptable Use Policy — no media distribution and no payment card
  data on Netlify services.
