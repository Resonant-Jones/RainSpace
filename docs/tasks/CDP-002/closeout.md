# CDP-002 · Approved preview closeout

The local studio persists a selection on a draft. A published release can now play that selection only while its creator has a current grant for the reviewed bytes. Withdrawing the grant stops new reads at an already-known URL. The hosted client-tour build contains the catalogue and artwork. Playback requires the API.

[Architecture decision](../../architecture/adr/0002-approved-preview-capability.md) · [Foundation amendment](../../architecture/adr/0001-platform-foundation.md) · [Operator instructions](../../../README.md#attach-a-public-preview-to-a-draft) · [Raw commands and untrimmed output](evidence/validation.zip)

## Review trail

The code baseline was `39d9c5a`. The checkout already included `3e6fcbe`, which adds only MiniMax's task spec. Implementation proceeded on top of that commit. The baseline command chain passed before source edits. The CDP-001 foundation record, original demo brief, prior implementation rationale and ADR informed the design. The original CDP-001 task message was also recovered from MiniMax's “Scaffold creator distribution platform foundation” chat during the review.

The November 23 work deliberately shipped a playable, self-contained public promo. The attachment editor selected an already reviewed sample and left publication to a human. Its UI did not confer source rights. The independently packaged static client tour had browser-local state. The repository's API-backed editor persisted attachments in PostgreSQL. Neither the old package nor media already obtained from it can be remotely revoked. The public repository is also a current independent source. An anonymous ranged read of the historical Git blob returned `206` with an MP4 signature. Withdrawal stops this platform's serving paths. It cannot remove the already public Git copy. The exact request is in `public-source.sh` and its output is in `public-source.txt`.

Two findings in the brief had the right consequence but the wrong source attribution:

- “All endpoints are public and read-only. There is no authentication.” appeared verbatim in the **foundation README**, and its wording had already been corrected in the base README. The actual ADR limitation was “**No authentication or authorisation.** Every endpoint is public.” The amendment corrects that statement and identifies the trusted local capability.
- The fixture mirroring claim was in `web/src/data/fixtures.ts`. The base README omitted the differences. The fixture keeps its generic creator for a portable offline tour. The seed owns the fictional studio, grants and durable draft. Both locations now state the distinction.

The ADR also said “The creator console reads bundled sample rows,” “Media is not served at all,” that “the enforcement layer that honours [`is_protected`] does not exist yet,” and that “no creator media is ever fetched by the public site.” The amended sections distinguish the sample controls, real attachment write, protected metadata filtering and gated byte path. The seed already contained fictional transcript text. The limitation now accurately identifies generated transcripts and embeddings as deferred. The original wording and the corresponding source reads are in `historical.txt` and `focused.txt` in the archive.

## Executed results

The original validation chain produced these summary lines.

```text
 Test Files  4 passed (4)
      Tests  24 passed (24)
16 passed, 1 warning in 0.99s
  5 passed (7.4s)
```

The final validation chain produced these summary lines. Each command and its full output is in the archive.

```text
 Test Files  5 passed (5)
      Tests  29 passed (29)
22 passed, 1 warning in 36.10s
  7 passed (1.1m)
```

The production-build browser test printed the following responses. The browser also asserted that the saved selection survived a new context, the draft was absent from the list and the published player time advanced.

```text
PostgreSQL after refresh draft|night-bus-teaser
Draft /api/creators/demo/catalog/untitled-workshop-draft 404
Draft /api/creators/demo/catalog/untitled-workshop-draft/preview 404
Draft /api/creators/demo/catalog/untitled-workshop-draft/preview/bytes 404
API without bearer 404
Non-studio JSON path through studio proxy 404
No opt-in header 404
Other origin 404
Non-allowlisted studio path 404
Unexpected method 404
Rejected selection unknown 422
Rejected selection /private/original.mp4 422
Rejected selection https://example.invalid/media 422
Stale removal 409
Wrong creator 404
Published target write 404
Published preview metadata 200
Playable media range 206
Withdrawn /api/creators/demo/catalog/untitled-workshop-draft/preview 404
Withdrawn /api/creators/demo/catalog/untitled-workshop-draft/preview/bytes 404
Detached /api/creators/demo/catalog/untitled-workshop-draft/preview 404
Detached /api/creators/demo/catalog/untitled-workshop-draft/preview/bytes 404
```

Chromium loaded the following release links from the live API in a fresh environment with no root or frontend environment file.

```text
http://localhost:5173/videos ['/videos/field-recording-notes', '/videos/keyboard-mechanics', '/videos/night-bus-short-film']
http://127.0.0.1:5173/videos ['/videos/field-recording-notes', '/videos/keyboard-mechanics', '/videos/night-bus-short-film']
http://localhost:8888/videos ['/videos/field-recording-notes', '/videos/keyboard-mechanics', '/videos/night-bus-short-film']
http://127.0.0.1:8888/videos ['/videos/field-recording-notes', '/videos/keyboard-mechanics', '/videos/night-bus-short-film']
```

## Change inventory

Paths in each row are relative to the repository root.

| Kind | Files | Reason |
| --- | --- | --- |
| Extend | `api/app/api/derivatives/__init__.py`, `api/Dockerfile`; moved `web/public/editions/night-bus-teaser.mp4` to `api/app/api/derivatives/night-bus-teaser.mp4` | Register and verify the reviewed file. Serve it through the API image. The MP4 is byte-identical. |
| Extend | `api/app/api/draft_previews.py`, `web/src/pages/admin/DraftPreviews.tsx` | Check live creator grants for inventory, writes and studio audition. A credentialed fetch feeds the draft player and releases its object URL on unmount. |
| Untangle / extend | `api/app/api/catalog.py`, `api/app/seed_demo.py`, `api/alembic/versions/0003_reviewed_derivatives.py` | Move legacy seed adoption out of request handling. Select by creator, publication, attachment and source approval for metadata and bytes. Preserve operator selections and withdrawals on reseed and downgrade to 0002. |
| Restore | `web/src/components/DemoBanner.tsx`, `web/src/components/Layout.tsx`, `web/src/styles.css` | Give the simulation statement and the data source a visible row on every route. Keep provenance available in the disclosure. |
| Untangle | `web/src/components/Artwork.tsx`, `web/src/data/editionArt.ts`, `web/src/data/fixtures.ts`, `web/src/pages/ContentDetail.tsx` | Drive pilot artwork and listening presentation from data. Resolve the live release's byte path. Explain offline sample availability. |
| Extend | `web/src/pages/admin/ContentAdmin.tsx`, `web/vite.config.ts` | Allow the isolated integration build to exercise the same local proxy. The default hosted build has no studio proxy. |
| Restore | `.env.example`, `docker-compose.yml` | Allow both loopback browser names on both local storefront ports. Bind the local API host port to loopback. |
| Extend | `api/tests/test_draft_previews.py`, `api/tests/test_derivative_access.py`, `api/tests/browser_fixture.py` | Exercise database-backed grants, overlapping edits, protected roles, withdrawal, range reads and migration round trips. Model publication only inside a disposable test schema. |
| Extend | `web/src/test/draftPreviews.test.tsx`, `web/e2e/draftPreview.spec.ts`, `web/e2e/localStack.ts`, `web/e2e/smoke.spec.ts` | Exercise panel feedback, the production-mode studio build, anonymous projection, actual playback and unassisted disclosure at two viewport sizes. |
| Restore / extend | `README.md`, `docs/architecture/adr/0001-platform-foundation.md`, `docs/architecture/adr/0002-approved-preview-capability.md` | Record the decision, its trust boundary, the migration, withdrawal procedure, status and the delivery tradeoff for the client demo. |
| Extend | `docs/tasks/CDP-002/check_origins.py`, `verify-origins.sh` in the same directory, this closeout and its `evidence/` files | Reproduce a clean API-mode browser visit on the exact origins and retain the acceptance evidence. |

## Acceptance evidence

Each transcript in the linked ZIP includes the complete relevant output. The baseline and final chains include exact commands and exit statuses. The host already ran another service on 8000, so the main checkout's HTTP checks used its configured API port 8010. The clean-checkout probe used 8000 in its isolated network. Node 22, PostgreSQL with pgvector and real Chromium were used.

| Acceptance item | Exact invocation or recording | What it demonstrates |
| --- | --- | --- |
| Dated ADR amendment, threat model and explicit README status | `bash historical.sh` and `bash focused.sh` → `historical.txt`, `focused.txt` | Git shows the withdrawn wording. The new ADR records authority, lifecycle, revocation, compatibility and deferrals. Documentation evidence is a source read. |
| Approval governs bytes | `npm run test:e2e --prefix web` → `final.txt`; `docker compose exec -T api pytest -v tests/test_catalog.py tests/test_draft_previews.py tests/test_derivative_access.py` → `focused.txt` | A second browser reads the saved selection. The player advances, a native range read succeeds, and the same path is denied after withdrawal and after detached republication. |
| No seed slugs in the catalogue router | `bash focused.sh` → `focused.txt` | The router search has zero matches. The migration and seed own adoption. A full-digest comparison and ffprobe read show the original film and audio streams survived the move. Provenance is recorded author history, separate from the file inspection. |
| Scope, protected payloads, migration, concurrency | Same verbose pytest command → `focused.txt` | Tests use disposable migrated PostgreSQL schemas. They check serialized rows, bare and protected promotional roles, cross-creator ownership, full-role exclusion, actual row-lock contention and preservation of operator edits across a 0003 → 0002 → head round trip. |
| Panel states and real studio lifecycle | `npm run test --prefix web -- --run` and `npm run test:e2e --prefix web` → `final.txt` | Tests cover loading, saving, confirmation, failed audition, conflict, denial and recovery. Publication and withdrawal in the browser test are direct, test-only database operations. |
| Visible demo statement on every route | Same browser command with `CDP_PROOF_DIR` set → `final.txt` | Browser asserts the statement and mode are in the viewport on all eleven route cases at 1280 and 390 pixels before any click. Screenshots below show the original, restored and mobile views. |
| Both local browser names and both ports with no environment file | `bash docs/tasks/CDP-002/verify-origins.sh` → `fresh-origins.txt` | A fresh checkout of the staged tree runs its own migrated/seeded Compose project and built SPA. Real Chromium uses the exact URLs inside the API's isolated network namespace, so existing host ports and services cannot supply a result. |
| Fixture versus seed | `bash focused.sh` → `focused.txt`; `netlify build --offline --context deploy-preview` → `netlify.txt` | Source and live database reads show the two names and actual database rows. The configured Netlify build emits the fixture storefront, cover and client assets. |
| Complete original validation chain | `bash chain` → `baseline.txt`, `final.txt` | Includes npm clean install, lint, Vitest, TypeScript and Vite build, Compose build and startup, migration, seed, pytest, HTTP responses, Playwright and whitespace checks. |
| Deployment status | `node hosted.cjs` → `hosted.txt` | The earlier Netlify project URL returned “Site not found” for the root and release. The live local storefront played the API bytes. Hosted playback remains unverified. |
| Scoped diff and credential hygiene | `python3 audit.py <netlify-publish-directory>` → `audit.txt`; staged Git check and stat before commit | The check reads staged files and compressed evidence, scans for the active local capability and common credential formats, and confirms the Netlify output contains no video. It is a bounded scan, not a general security assessment. |

### Before and after

[Original live storefront](evidence/before-home.png) · [Restored live storefront](evidence/after-home.png) · [Mobile console](evidence/mobile-console.png)

In the original live browser, both “Disclosure visible without click” and “Source visible without click” were `false`; the direct static teaser returned `200`. On the restarted local storefront both values were `true`. The retired static URL received an HTML SPA fallback with no MP4 signature. The player advanced on `/api/creators/demo/catalog/night-bus-short-film/preview/bytes`. A `200` status alone would have given the wrong answer about the old path.

### Checks retained from CDP-001 and the preview commits

| Existing guarantee | Executed check |
| --- | --- |
| Constant-time API bearer check, configured creator, local development and browser proxy boundaries | `test_studio_capability_and_draft_scope` and the browser refusal matrix. The comparator and environment check were preserved by source inspection. |
| Desired-state retries and stale-edit refusal | `test_save_refresh_retry_remove_and_visibility` and `test_overlapping_edit_waits_and_returns_conflict`. The latter observes a genuinely blocked PostgreSQL transaction before committing the competing edit. |
| Drafts stay hidden and creator data stays scoped | Existing catalogue tests, `test_approved_preview_follows_release_if_later_published` and browser requests for the unpublished detail, metadata and bytes. |
| Public payload excludes protected material, storage keys and transcript content | `test_public_payload_excludes_private_fields`, `test_protected_promotional_roles_never_enter_either_projection` and `test_other_creator_and_full_role_cannot_grant_access`. |
| PostgreSQL-backed attachment durability and human publication authority | Two browser contexts, a reload and a direct database read. The test cannot publish through the draft PUT. No application publisher was added. |
| Versioned reversible database work, same teaser and original score | Disposable migration round trip, independent checksum of both Git locations, ffprobe output and native playback. |

### Warnings, failures and limits

The initial new browser test failed TypeScript compilation because its Node-targeted test context lacked DOM media types. Adding a DOM type reference fixed the build. An already-running local Vite process retained the old disclosure after a refresh. Restarting only this repository's API-mode Vite listener with file polling restored the live page. During an additional concurrent verification run, the isolated API readiness check and containerized Chromium startup timed out. Chromium was still writing its profile during temporary-directory cleanup. The disposable container now owns that profile for its lifetime, and the browser-test API limits numerical-library threads. The complete chain and clean-origin verification were subsequently run in sequence. The failed runs are retained alongside the successful ones. The fixture production build and ephemeral browser-test build use different data modes by design.

npm reported a transitive deprecation, pytest reported the Starlette TestClient/httpx deprecation, and the browser tooling reported terminal color and external temporary output-directory notices. Docker's dependency installation runs as root during image construction; the API process runs as its non-root image user. These are warnings. No suite was skipped.

CDP-002 adds no hosting, payment processor or customer identity. A static-only client can browse the tour. Showcasing live playback and persistent attachment editing requires the local API-backed demo. Turning a previously distributed static URL into a revocable URL on another host would require changing that deployment with its owner's authorization. No public deployment was made.
