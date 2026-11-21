# ADR-0001: Creator Distribution Platform foundation

- **Status:** Accepted (implementation complete for CDP-001; architecture review required before it is treated as a production contract)
- **Date:** 2026-11-20
- **Task:** CDP-001 — scaffold a deployable creator distribution platform foundation
- **Scope:** the repository, the public catalog API, the storefront demonstration, the creator console demonstration, and the boundaries that later tasks will build on

## Context

The product goal is a Shopify-like infrastructure layer for independent
content creators: one shared backend, many creator-specific storefronts that
each creator controls on their own domain.

CDP-001 is the first slice. It has to produce a demonstrable full-stack
foundation without building the whole product, and it has to leave the
architecture honest about what is real. No production repository, deployed
backend, or verified pipeline existed before this task.

Three external constraints shaped the decisions below and are recorded here
because they change what the platform may do, not just how it is built.

1. **Payment eligibility.** Stripe's prohibited and restricted business list
   classifies platforms that host or distribute third-party content and let
   creators take payments ("content creation platforms") as a **restricted**
   business requiring additional due diligence, and classifies adult content
   and adult services as **prohibited** outright. Payment provider eligibility
   therefore cannot be assumed, and no processor may be wired in as a default.
2. **Hosting boundaries.** The Netlify Acceptable Use Policy forbids using
   Netlify services for general-purpose file storage or media distribution
   unrelated to a site, and forbids collecting, storing or processing payment
   card data on Netlify Forms, Functions, Blobs, the database or logs. Card
   data must be collected by a PCI DSS-compliant provider through a hosted
   page, iframe, redirect or client-side tokenisation.
3. **Media privacy.** Original and paid media must never be reachable through
   public frontend assets or unprotected static URLs.

## Decision

### 1. Repository ownership

The platform lives in its own repository, `Resonant-Jones/RainSpace`
("Creator Media Distribution System"), with its own dependencies, its own CI
surface and its own deployment. It has no runtime or build-time dependency on
any other repository, and no import, schema or credential is shared with one.

*Rationale:* the platform must be independently runnable and independently
deployable. Sharing code with a different product would couple their release
cadences and make the platform's isolation untestable.

### 2. Technology choices

| Concern | Choice | Rationale |
| --- | --- | --- |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (sync), psycopg 3 | Small, well understood surface; typed request/response models; synchronous SQLAlchemy keeps the tenant-scoping rules readable for reviewers. |
| Database | PostgreSQL 16 with pgvector (`pgvector/pgvector:pg16`) | Relational integrity for creator-owned content, plus vector storage in the same database so creator scoping and embeddings share one transaction boundary. |
| Migrations | Alembic, versioned, reviewed by hand | The initial schema is the tenancy contract; it must be reviewable and reversible without dropping user data. |
| Frontend | React 19, TypeScript, Vite, React Router | Fast static build, first-class TypeScript, trivial SPA hosting on Netlify. |
| Frontend tests | Vitest + Testing Library, Playwright for browser verification | Unit and route tests run in the repo; Playwright proves the built bundle, not just the dev server. |
| Hosting | Netlify for the frontend SPA | Matches the stated target host. The API is *not* deployed to Netlify in CDP-001. |

**Rejected:** ChromaDB or Neo4j alongside Postgres (a second datastore to
secure, back up and tenant-scope for no demonstrated benefit); a workflow
engine (the editorial flow has one known path and one approval gate);
an ORM-agnostic repository layer (one consumer, one query shape).

### 3. Frontend and backend responsibilities

The boundary is the `DataSource` interface in `web/src/data/types.ts`. It
exposes exactly three reads: `getCreator`, `getCatalog`, `getContent`.

- The **backend** owns creator identity, content records, publication state,
  media metadata and the rules for who may see what. It is the only place
  that decides visibility.
- The **frontend** owns presentation, theme application, the simulated fan
  session and the demonstration of the intended editorial flow. It never
  decides what is published and never receives a storage object key.

Two interchangeable implementations satisfy the interface: a fixtures source
(the default, used by the Netlify deployment) and an API source. The active
mode is chosen at build time by `VITE_DATA_MODE` and is displayed in the
interface, so a viewer always knows whether they are looking at bundled
sample data or live API data.

A failed read **always** throws. It is never converted into an empty
catalogue. A transport failure or a 500 must not be able to present itself as
"this creator has published nothing".

### 4. Database ownership and creator scoping

Every persisted content item belongs to exactly one creator, through a
non-nullable `creator_id` foreign key with `ON DELETE CASCADE`. Uniqueness is
scoped per creator (`uq_content_items_creator_slug`), so two creators may
independently use the same content slug.

Public reads resolve the requested creator slug to a creator id first, and
then constrain every subsequent query by `creator_id`. The caller's slug never
selects rows directly. This is the rule that makes a content slug belonging
to another creator unreachable rather than merely inconvenient.

Publication state is a value of the `publication_status` enum (`draft`,
`scheduled`, `published`, `archived`). Public endpoints return **only**
`published` content. An unpublished item returns `404`, identical to the
response for content that does not exist, so the existence of a draft is not
disclosed.

### 5. Public payload exposure

The public schemas are the single definition of what leaves the backend.
They exclude, by construction:

- media storage object keys — they address private objects;
- the `full` media asset role and the `is_protected` flag — originals are
  described by nothing at all;
- transcript raw text, summaries and embeddings.

Cover art and preview assets are described by role, MIME type and duration
only. The storefront renders locally generated placeholder artwork derived
from a slug hash, so no creator media is ever fetched by the public site.

### 6. Demo mode versus real operation

`DEMO MODE` is a first-class state in the interface, not a footnote. A
persistent banner on every route states that accounts, purchases, messages
and creator-console processing states are simulated, and names the active
data mode.

- The simulated sign-in asks for a display name only. There is no password
  field, no token, no session server. The name is kept in `localStorage`.
- The simulated purchase contacts no provider, asks for no card details, and
  produces no entitlement. The library is a local list of slugs.
- Messaging is sample data plus local component state. Nothing is delivered.
- The creator console reads bundled sample rows. Edits, uploads, status
  changes and calendar moves change local state and are labelled as
  demonstrations at the point of use.

Invariant: a simulated feature must never be able to be mistaken for a real
one, and no demonstration artefact may be presented as a business outcome.

### 7. Creator storefront independence

Branding is data. A creator record carries a theme document, and the
frontend applies it as CSS custom properties. No component contains a
creator's name, stage identity, imagery or colour choice. The storefront is
addressed by creator slug (`VITE_CREATOR_SLUG`), so the same build renders a
different creator's storefront without a code change.

The operational path for many creators is one storefront deployment per
creator on that creator's own domain, all reading the same API with
creator-scoped queries. That deployment topology is **not** built in CDP-001:
this repository ships one storefront build, and the per-creator deployment
process is a later operational decision.

### 8. Future media-processing integration seam

The intended pipeline is a product objective, not an implemented capability:

```
Batch Import → FFmpeg Processing → Transcription → Metadata Drafts
             → Human Review → Publishing Queue → Creator Storefront
```

The seam is fixed now so that later work does not have to redesign the data
model:

- `media_assets` already stores the asset role, the storage object key, the
  MIME type, the duration and a checksum, which is what a processing job
  produces and consumes.
- `transcripts` already stores raw text and a summary, and its nullable
  `embedding` column fixes the retrieval contract before a transcription or
  embedding pipeline exists.
- `content_items.status` already carries `draft` and `scheduled`, which are
  the states the processing and publishing stages hand over between.

Two seams are deliberately left open. **Where** processing runs (a worker
process, a queue, a managed job runner) and **which** transcription and
embedding models are used are both undetermined. No queue, worker, FFmpeg
integration or model integration is introduced in CDP-001.

The `embedding` dimension is fixed at **512**, and that value is an initial
implementation choice, not a platform-wide model contract. It was chosen to
keep the column cheap to store and index while no embedding pipeline exists.
Changing it later is a schema migration that alters the column type and
rebuilds any vector index.

### 9. Future object-storage integration seam

`media_assets.storage_object_key` is an opaque key, not a URL. The platform
does not know or care which object store backs it; the key resolves through
whatever storage adapter a later task installs. Originals are marked
`is_protected = true` and are only ever served through an authorised, signed,
short-lived path that this foundation does not implement. CDN or public
bucket exposure of originals is forbidden by the media-privacy invariant.

### 10. Future payment-provider integration seam

No payment provider is integrated, and none is configured as a default.
Payments are outside the scope of this foundation for three independent
reasons:

1. Stripe's policy classifies content-hosting platforms that enable creator
   payments as restricted, and adult content as prohibited. Eligibility must
   be verified before any real transaction is enabled, and the answer may be
   "this provider cannot serve this creator".
2. The Netlify Acceptable Use Policy forbids handling card data on Netlify
   services. Any provider integration must collect card data through a
   PCI DSS-compliant hosted page, redirect or iframe, and must not persist it.
3. Purchases need an authenticated buyer identity and a server-side
   entitlement record. Neither exists yet.

The seam is the creator-scoped content record plus a currency and a price in
minor units, which is what an order needs. The future integration must be
provider-agnostic, must leave the API the authority on entitlement, and must
keep the simulated purchase path in the interface until it is replaced by a
real one.

### 11. Future authentication and authorisation requirements

The demonstration session is not an authentication system and must not be
mistaken for one. The future requirements are:

- Real user authentication with a managed or self-hosted identity provider,
  with sessions that the API validates on every request.
- Two distinct authorisation domains: **fans** (read published content,
  manage their own library and messages) and **creators** (manage their own
  content, approve publication, view their own earnings). Creator
  authorisation is always scoped to a creator id.
- Role checks enforced server-side on every mutating endpoint.
- No password, card or personal data handling on the frontend beyond what a
  compliant provider's hosted flow requires.

### 12. Deferred publishing and scheduler architecture

Publication is currently a status value plus a timestamp. The target
architecture is a publishing queue with a scheduler that promotes scheduled
content at its publication time, and a **human publishing authority**: the
creator or an authorised operator approves each item before it becomes
public. The editorial flow the console demonstrates — Import → Process →
Review → Schedule → Publish — ends in an approval gate that a machine does
not cross on its own.

None of that machinery exists in CDP-001. The console demonstrates the flow
and its states; it does not schedule or publish anything, and the
demonstration says so at the point of use.

### 13. AI boundaries

Future caption and metadata generation produces **drafts** that a human
reviews and approves. No AI-generated text reaches the public catalogue
without review, and no AI companion, persona or impersonation of a creator
is authorised anywhere in this platform.

## Known security and operational limitations

These are real limitations of the shipped foundation, not hypotheticals.

1. **No authentication or authorisation.** Every endpoint is public. The
   creator-scoping tests prove that one creator's content cannot be read
   through another creator's URL. They do **not** prove that a creator
   cannot read another creator's data by other means, because there is no
   identity layer yet.
2. **No rate limiting, no abuse controls, no abuse monitoring.** The API
   should not be exposed to the public internet in this state.
3. **Rate limits and quotas are absent** for ingestion, embedding and
   playback paths.
4. **Media is not served at all.** There is no upload path, no transcoding,
   no signed URL issuance and no CDN. The storefront shows generated
   placeholders.
5. **No signed access path for originals** — `is_protected` is a flag, and
   the enforcement layer that honours it does not exist yet.
6. **No secret management.** The API reads a database URL from the
   environment. There is no credential rotation, no per-environment secret
   store and no secret scanning in the deployment path.
7. **No observability beyond a health endpoint.** No structured logging, no
   metrics, no tracing, no alerting. The health endpoint reports service
   liveness and database reachability and nothing more.
8. **No backup, restore or disaster recovery procedure.** The local stack
   uses an unencrypted volume with no backup policy.
9. **The demo session is client-side only.** It is trivially editable and
   proves nothing about authorisation.
10. **Embeddings and transcripts are not yet populated.** The columns exist
    so the storage contract is fixed; the retrieval quality of the eventual
    embedding model is unproven and unmeasured.
11. **The sample data in the creator console is fictional.** Earnings,
    views and processing states are illustrative only and must never be
    presented as business outcomes.

## Consequences

- The demo can be run and demonstrated with no backend, and separately
  against a real PostgreSQL database, from one codebase.
- The tenancy rules are enforced in one place — the catalog router — and are
  covered by tests that run against a real database with real migrations.
- Later tasks can add media processing, storage, payments, authentication
  and scheduling without changing the creator-scoping model or the public
  payload contract.
- The platform is not production ready, and no part of this document should
  be read as a claim that it is. Architecture review is required before
  these decisions become a production contract.
