# ADR-0002 · Creator-approved previews

Accepted for the local pilot on 2026-11-25. Amends ADR-0001 §§4–7 and its limitations. CDP-002 builds on `7cb93dd` and `39d9c5a`.

## Decision and reason

FastAPI serves one reviewed promotional MP4 from its image. PostgreSQL decides, on each request, whether that creator may offer the derivative and whether that release may show it. The storefront receives an opaque release-relative playback route. It never receives a storage key. A client can copy the route, but the next request still passes through both decisions.

The earlier client demo needed a self-contained, playable film and listening study. Its generated stills and synthesized score were edited into an 18-second teaser with FFmpeg. Vite served the MP4 directly after Docker Desktop refused the host media bind mount. That design met the original requirement for a public promotional sample, but anyone who knew its path could retrieve it after removal. Putting that same file inside the existing API image keeps local startup simple and gives the operator immediate withdrawal. Signed URLs would introduce expiry and key management. A storage host would add a service to a pilot with one small file.

## Authority and trust

| Actor | Authority |
| --- | --- |
| Visitor or simulated fan | Read the creator profile, published catalogue and a selected, currently approved sample. The fan session conveys no authority. |
| Browser on the operator's machine | Ask the loopback Vite server to list drafts, read an attached sample or save a selection. The browser sends `X-Studio-Request: draft-preview`. |
| Vite server | Read the capability from the ignored root environment. Forward GET/PUT only on the studio path or its single slug child. Require a loopback peer, exact localhost or IPv4 loopback Host and actual port, and a matching HTTP Origin. A GET without Origin needs same-origin Fetch Metadata. Add the bearer header on the upstream hop only. Normal hosted and preview builds have no studio proxy. |
| API | Require development mode, the configured creator slug and a constant-time match against a configured bearer of at least 32 characters. Select drafts by owner and publication state in PostgreSQL. No endpoint grants asset approval or publishes a release. |
| Trusted maintainer / database operator | Review provenance, install reviewed bytes and their digest, designate an eligible source for its owning creator, change its protection flag, and control publication out of band. |

An unrelated website cannot enlist the proxy by opening a link or submitting a form. An operator, a process controlling the machine, or script executing in the trusted studio origin can perform studio actions. Loopback and browser headers provide a convenience boundary for this single-operator pilot. They provide no identity proof against a local process that can reproduce those headers. Keep the studio off tunnels. Rotate the operator capability in the ignored environment and restart the API and Vite together. There are no individual identities, role assignments or per-action audit records.

## Approval, attachment and delivery

1. The shipped registry maps an opaque ID to reviewed bytes, MIME type, title, length and SHA-256. A fresh API process verifies the packaged file against that digest before serving it. A creator has a live grant only while it owns an unprotected MP4 preview source with that digest. Full, cover, protected, wrong-owner and unregistered media cannot grant access. The seed installs one such source. Filenames, URLs and storage keys supplied by the browser have no selection semantics.
2. The operator sends a desired ID (or null) and the previously observed ID. The API locks the owned draft row, validates live approval, and commits the association. A repeated request for the current valid selection succeeds. A different desired state with a stale expectation returns `409`. Reload reads PostgreSQL. A failed connection leaves the outcome uncertain until readback.
3. Saving does not advance the release state. Catalogue, detail, preview metadata and bytes exclude a draft. The authenticated studio can audition its selection via a private GET and a browser-scoped object URL that is released when the player unmounts.
4. After an authorised out-of-band publication, public metadata returns the release's `/preview/bytes` route. Both metadata and byte reads check the published release, owning creator, selection and current source grant. Full and Range requests use the same gate. Responses instruct caches to avoid storage. The generic public catalogue still filters protected media and excludes original keys and transcript content.
5. Detaching affects one draft. Withdrawing the creator's grant affects **every release referencing that derivative**. Mark all of that creator's matching preview sources protected in a committed transaction. Subsequent studio auditions, public lookups and byte requests fail, including a saved range URL. Stored selections remain visible to the operator and can be removed. A reseed preserves protection and existing selections. In-flight transfers, downloaded copies and earlier static demo packages cannot be recalled. The pilot repository is public. An unauthenticated range request to the historical Git blob also returned MP4 bytes. Withdrawal controls the running platform, while Git remains an independent distributor of this already-public sample. A future derivative requiring exclusive delivery must be provisioned outside public source history.

PostgreSQL is authoritative for scope, publication, selection and live approval. The API fails closed when these checks cannot run. The local fixture storefront still works offline with promotional artwork and sample records. It has no MP4, editor or independent source of approval. Cross-device sync and offline write reconciliation have no role in this workflow.

## Compatibility and operations

Apply `0003_reviewed_derivatives` on top of `0002_draft_preview` before starting the updated app. It indexes eligible source digests and adopts only the old pilot's exact unprotected source. Materialize only previously implicit selections on its two published releases. Fresh seeds set initial selections on insertion. The migration leaves other creators, explicit selections and draft states intact. Downgrade to 0002 removes the index and keeps the existing checksum and selection fields, including operator edits. Re-upgrade recognizes the recorded digest. Returning to old application binaries also returns to their static delivery semantics. A mixed deployment with an old static origin cannot promise withdrawal.

Update the storefront and API together for the demo. The former static playback path and the studio inventory's static `path` field have been retired. Older consoles need a refresh to load the updated player. The draft PUT contract and persisted ID are unchanged.

The separate production-mode browser integration build enables the local proxy only under the explicit `studio-e2e` mode and uses a disposable schema, capability, API container and loopback server. No test publication route exists in the application. The ordinary Netlify build uses fixtures. API-backed playback requires an independently reachable API and the correct storefront origin.

ADR-0001's deferred work still includes fan and creator authentication, roles, original-media access, object storage, signed URLs, ingestion, transcoding, scheduling, payments and AI-assisted editorial drafts. The local demo has no rate limits, quotas, abuse monitoring, durable audit, secret rotation service, backup procedure or production availability guarantees. Scope tests cover the named routes and queries. The tests do not establish operational tenant isolation.

The [operator instructions](../../../README.md#attach-a-public-preview-to-a-draft) include the withdrawal command. The [CDP-002 evidence](../../tasks/CDP-002/closeout.md) records baseline and revised behavior.
