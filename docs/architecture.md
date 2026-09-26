# Anonymous Campus — Production Architecture & Implementation Blueprint

> Built for: Ali Talha, Moeed Amir, Rayan Ali
> Source of truth: `plan.md`. Response structure: `CLAUDE_PLAN_PROMPT.md`.
> Status: PLANNING ONLY. No code, packages, migrations or app scaffolding yet.
> Decision already made: **JavaScript + JSDoc type-checking + Zod** (you picked this over full TypeScript).

---

## 0. Context: why this document exists

The repository has three files: an empty `README.md`, `plan.md` (the product spec) and `CLAUDE_PLAN_PROMPT.md` (instructions for this plan). `plan.md` actually contains **two stacked documents**:

1. Lines 1–1620: an earlier **web-first** spec (Next.js + Tailwind, with mobile later).
2. Lines 1622–6508: a later **mobile-first** spec (React Native + Expo, with an admin dashboard on the web).

The second document replaces the first where they conflict, and you confirmed React Native. Everything below follows the second document and keeps every feature from both.

The goal is a blueprint detailed enough that each phase can go to Claude Code as a self-contained task, so no big architecture decisions have to be made again during implementation.

### Where this plan differs from `plan.md`

Nothing is changed silently. Each change is listed here, and the relevant section explains it.

| # | `plan.md` says | This plan recommends | Why | Needed for MVP? |
|---|---|---|---|---|
| D1 | JavaScript only (§113) | JS, with `// @ts-check` / `checkJs` + JSDoc typedefs generated from shared Zod schemas; TypeScript is a **dev-only type checker** in CI | Catches drift between mobile, API and admin without writing TS | Yes (Phase 0) |
| D2 | Notifications come in Phase 11, after communities | Push for new message and new comment moves **into MVP** (Phase 9) | Both MVP lists in plan.md (§37, §93) include notifications. Chat without push loses users. | Yes |
| D3 | Admin dashboard comes in Phase 13 | A **minimal admin (moderation queue, sanctions, audit)** goes into MVP (Phase 10). The full admin comes later. | You cannot put real students on an anonymous platform without a way to act on reports | Yes |
| D4 | Moderation comes in Phase 6, after feed and chat | **Safety primitives** (blocks, reports, account states, rules engine) move to Phase 5, **before** feed and chat | Feed and chat queries must filter blocks and call moderation hooks from day one. Adding that later means rewriting every query. | Yes |
| D5 | Queue "later" (§87) | BullMQ worker introduced in MVP (Phase 6) | OTP email, push, image processing and AI moderation must not block HTTP requests. Redis is already there. | Yes |
| D6 | Tables `message_attachments`, per-feature attachments | One **`media_objects`** table plus link tables | One upload pipeline, one set of security rules, one cleanup job | Yes |
| D7 | `matches`, `match_requests` tables | `match_preferences` plus **conversation requests** (a match just opens a chat request) | Avoids a second request system that does the same thing as chat requests | V1.5 |
| D8 | Store `real_name`, `phone`, `student ID` (§36 implies) | **Do not collect them at all.** Store only an encrypted email plus an HMAC hash of the email. | Data you never collect cannot leak. Verification only needs the email. | Yes |
| D9 | Identity reveal exposes "identity information" | Reveal shows a **user-written reveal card** (name, handle, contact the user chooses), never the verified email | The system doesn't store real names (D8). Exposing the university email is a doxxing risk. | V1.5 |
| D10 | Chat starts immediately | **Message requests**: the first contact is a request. Images and unlimited messages unlock only after the recipient accepts. | The biggest harassment-prevention lever in anonymous DMs | Yes |
| D11 | Socket `conversation:join/leave` | Server emits to per-user rooms (`user:{id}`). Clients never join rooms by ID. | Removes a whole class of authorization bugs where a client joins a room it shouldn't | Yes |
| D12 | Feed sorts: Trending/Recent/Popular/Random | Recent, Trending and Top (24h/7d) in MVP. **Random is deferred.** | Random has no clear product value and is hard to paginate correctly | Yes |
| D13 | Redis for sessions and unread counters | Sessions and unread state stay in **PostgreSQL**. Redis is used only for rate limits, presence, queues, the socket adapter and small caches. | Sessions and unread state must survive a Redis restart | Yes |
| D14 | `main` + `develop` + feature branches | **Trunk-based**: `main` plus short-lived branches, release tags for production | A 3-person team gains nothing from a develop branch except merge pain | Yes |
| D15 | Routes under `/api/...` | `/api/v1/...` | Old mobile builds stay in the wild for months, so the API needs versioning from day one | Yes |
| D16 | MVP chat: text, images, reply, reactions, files, delete | MVP: text, emoji, images, delete, block, report, mute. **Replies, reactions and PDFs move to V1.** | §37 lists only text, images, block and report for MVP. This keeps the scope launchable. | — |
| D17 | Campus discussions may cover "teachers" | Launch with a policy against naming individuals in allegations, plus post **flairs** (Opinion / Question / Experience / Official) | Defamation and legal risk (see Risks). Addresses plan §22's "don't present allegations as facts". | Yes (policy + flair) |
| D18 | Online/last seen in MVP chat | Typing indicators and read receipts in MVP. Online presence is V1 and **opt-in**. Last seen is off by default. | Presence leaks activity patterns, which can de-anonymize people on a small campus | — |

---

## 1. Executive Summary

- **Is it buildable?** Yes. The MVP (verification, anonymous identity, feed, 1-to-1 chat with images, block/report, moderation, push, minimal admin) is realistic for a 3-person student team in roughly **4–6 months** of part-time work, following the phases below.
- **What's hard isn't the code.** The hard parts are **moderation operations** (anonymous platforms attract abuse), **privacy engineering** (never leaking identity through APIs, image EXIF data, logs or activity patterns), **email deliverability** to university mail servers, and **legal exposure** (defamation, local cybercrime law).
- **Architecture:** a single modular **Node/Express monolith** (API + Socket.IO) plus a **worker process** from the same codebase, backed by **PostgreSQL** (source of truth), **Redis** (rate limits, presence, queues), **Cloudflare R2** (media), **Expo** mobile app, **Next.js** admin, and a **shared contract package** of Zod schemas used by all three apps. No microservices, no Kubernetes, no ML.
- **Build order is dependency-driven:** foundation → auth → identity → **safety primitives** → feed → media → chat → notifications → moderation automation + admin → compliance → hardening → closed beta. Post-MVP features (matching, communities, study/FYP, lost & found, reveal, events/societies/career, multi-university) come after real students validate the core loop.
- **First step:** Phase 0 creates the monorepo skeleton, tooling, local Docker infrastructure, CI and the shared contract package (§34).

---

## 2. Feasibility Assessment

### 2.1 Buildability by area

| Area | Difficulty | Risk | Cost driver | Can 3 students build it? | Notes |
|---|---|---|---|---|---|
| Email OTP verification | Low | **Medium** | Email volume | Yes | Risk is deliverability: university Microsoft 365/Google tenants may spam-filter. Test with a real university inbox in Phase 3. |
| Anonymous identity + profile | Low | **High (privacy)** | — | Yes | Code is simple. Discipline is hard: DTOs, leak tests, EXIF stripping. |
| Feed (posts/comments/likes) | Low–Med | Low | DB | Yes | Keyset pagination + a denormalized hot score is enough for years. |
| Real-time 1-to-1 chat | **Med–High** | Medium | Realtime instances | Yes, with care | Ordering, idempotency, reconnects, receipts. Well-understood patterns are specified below. |
| Media uploads | Medium | **High (abuse/privacy)** | Storage, processing | Yes | Presigned uploads, worker processing, EXIF strip, image moderation. |
| Push notifications | Low–Med | Low | Free (Expo Push) | Yes | Needs EAS dev builds (push doesn't work in Expo Go on Android). |
| Moderation (rules + AI) | Medium | **High (ops)** | AI API calls, human time | Yes (tech); **ops is the real cost** | Code is manageable. Staffing a review queue within 24h is the real constraint. |
| Admin dashboard | Medium | High (security) | — | Yes | Separate auth, TOTP 2FA, RBAC, audit, break-glass identity access. |
| Matching (rule-based) | Low–Med | Low | DB | Yes | SQL scoring. No ML. |
| Communities | Medium | Medium | DB | Yes | Reuses posts with a `community_id`. |
| Study/FYP finder | Low–Med | Low | — | Yes | Structured listings + matching + chat requests. |
| Lost & Found | Low | Medium (scams) | — | Yes | Structured posts + claim-verification flow. |
| Events/Societies | Medium | Medium (impersonation) | — | Yes | Needs a verified organization accounts model. |
| Search | Medium | Low | DB → search engine later | Yes | Postgres full-text first. |
| Identity reveal | Low–Med | **High (safety)** | — | Yes | Consent state machine + audit. |
| Multi-university | Medium | Medium | Ops | Yes (if `university_id` is designed in from day one) | Tenancy column everywhere now keeps this cheap later. |
| AI campus assistant | High | Medium | LLM costs | Later | Out of scope until adoption. |

### 2.2 What to simplify, and what not to build first
- **Simplify for MVP:** flat comments (no replies), images only (no PDFs), generated avatars only (no uploaded avatars), a fixed category list, a single university, Android first, a Recent/Trending/Top feed.
- **Do not build first:** communities, matching, study/FYP, lost & found, events/societies, career, identity reveal, search, presence, voice/video, AI assistant, recommendations, multi-university admin tooling, web client (full list in §32).

### 2.3 External services

| Need | Recommended | Free/low-cost at start? | When it costs money |
|---|---|---|---|
| Mobile build/distribution | Expo EAS (Build, Update, Submit) | Free tier (limited build minutes) | Faster builds, more updates |
| App stores | Google Play ($25 one-time), Apple Developer ($99/yr) | Play fee only for Android-first | iOS launch |
| API + worker hosting | Railway **or** Render (Docker), region **Singapore** (closest good region to Pakistan) | ~$5–20/mo | Multiple instances |
| PostgreSQL | Neon (branching is useful for staging and PR previews) or the managed PG from the same host | Free tier | Storage/compute growth |
| Redis | Railway/Render Redis, or any non-serverless Redis (BullMQ polls constantly, which makes per-request-priced serverless Redis expensive) | ~$0–10/mo | Memory |
| Object storage | Cloudflare R2 (no egress fees) | 10 GB free | Storage beyond free tier |
| Transactional email | Resend or Postmark (easy); AWS SES (cheapest at volume) | Free tiers cover a pilot | OTP volume at 10k+ users |
| Push | Expo Push Service → FCM/APNs | Free | — |
| Error tracking | Sentry (mobile + server + admin) | Free tier | Event volume |
| Logs/uptime | Host log drain → Better Stack / Axiom; uptime monitor | Free tiers | Retention/volume |
| AI moderation | Provider-agnostic interface. Evaluate a dedicated moderation API vs a small LLM classifier in Phase 10, and **test on Urdu/Roman-Urdu samples** before choosing. | Some are free or cheap | Scales with content volume |
| Link safety | Google Safe Browsing API | Free (non-commercial limits; check terms) | — |
| Admin hosting | Vercel | Free/hobby tier, but check commercial-use terms | Team plan |

### 2.4 What breaks at each scale (and what to decide now)

| Users | What becomes difficult | What handles it |
|---|---|---|
| **100** (closed beta) | Nothing technical. Risk is **empty feed** and **moderation response time**. | Seed content, the team as moderators, a single instance of everything |
| **1,000** (university pilot) | Report volume (expect some daily), email deliverability, push reliability, trending quality, missing indexes becoming visible | Indexes from §8, BullMQ retries, review queue SLAs, volunteer moderators |
| **10,000** | One API instance is no longer enough for sockets. DB connections run out. Trending queries get slower. Image bandwidth grows. Moderation needs a small team. | 2+ instances with **Socket.IO Redis adapter** + sticky sessions, **PgBouncer/Neon pooler**, a precomputed hot score, CDN for media, separate Redis for queue vs cache, on-call rota |
| **100,000** (multi-university) | Messages table is huge. Full-text search load. Realtime fan-out. AI moderation cost. Trust-and-safety staffing. | Partition `messages` by time, read replicas, a dedicated search engine (Meilisearch/Typesense), realtime split into its own service, transactional outbox, per-university moderators |

**Decisions to lock in now** (cheap now, expensive later):
1. `university_id` on every tenant-scoped row, always taken from the session and never from the client.
2. **Stateless API.** No in-memory state that matters. Socket state is recoverable from PG and Redis.
3. **Keyset (cursor) pagination** everywhere.
4. **Time-ordered UUIDv7 primary keys**, so exposed IDs aren't sequential, indexes stay friendly, and time ordering comes for free.
5. Store **storage keys, never URLs**, in the DB.
6. Side effects (push, email, moderation scans, image processing) go through a **queue**.
7. **API versioning** (`/api/v1`) + a minimum-app-version check.
8. **Shared contract package** as the single definition of payloads.
9. Emit socket events to **user rooms** so multi-instance scaling needs only the Redis adapter.

---

## 3. Product Architecture

### 3.1 Core loop the MVP must prove (plan §134, §47)
```
Verify → get pseudonym → see useful feed → post/comment → get a reply notification
→ start a chat request → conversation accepted → come back tomorrow → invite a friend
```
Every MVP feature serves this loop. Anything that doesn't is post-MVP.

### 3.2 Identity model (the most important product concept)
```
AUTH IDENTITY (private)          ACCOUNT (private)             PUBLIC PERSONA
email_encrypted, email_hash  →   users.id, status, univ   →    anonymous_profiles.public_id
(auth module only)               (never serialized)            "Anonymous Fox #2841"
                                                               department?, semester?, interests
```
- A pseudonym is **stable**: all of Fox #2841's posts can be linked to each other, and that's the product (reputation, continuity). Users should know this, so onboarding copy must say it plainly.
- **Future option (not MVP):** a per-post "extra anonymous" mode showing "Anonymous student" with no persona link. The author is still stored internally.

### 3.3 Content labeling (plan §22, §25)
Every post has a **category** (Academic, Campus, Career, General in MVP; Lost & Found etc. later) and an optional **flair**: `QUESTION`, `OPINION`, `EXPERIENCE`, `CLAIM`. `OFFICIAL` is reserved for verified organizations and admins. The UI renders `CLAIM` and `EXPERIENCE` with a visible "unverified / personal experience" label.

---

## 4. Recommended Tech Stack (summary; details in §33)

| Layer | Choice | Rejected alternatives (why) |
|---|---|---|
| Mobile | React Native + **Expo** (latest stable SDK), **Expo Router**, JS + JSDoc checkJs | Bare RN (loses EAS/OTA/managed native modules), Flutter (team + spec are JS) |
| Server state | TanStack Query | Redux Toolkit Query (heavier), SWR (weaker mutations and infinite queries) |
| Client state | Zustand (small, scoped stores) | Redux (boilerplate), Context-only (re-render issues) |
| Lists | FlashList (v2) | FlatList (fine, but slower for long, mixed-height feeds) |
| Images | expo-image | RN Image (no disk cache) |
| Forms | react-hook-form + Zod resolver | Formik (slower, less maintained) |
| HTTP | Axios (plan §55) with a single-flight refresh interceptor | fetch wrapper (works too; Axios keeps plan consistency) |
| Backend | Node LTS + **Express 5**, modular monolith | NestJS (heavy for JS-only team), Fastify (fine, but plan specifies Express), microservices (premature) |
| Validation | **Zod** (shared package) | Joi/Yup (can't share cleanly with the client) |
| ORM | **Prisma** + PostgreSQL 16 | Drizzle/Knex (fine, but plan specifies Prisma; Prisma migrations are team-friendly) |
| Realtime | **Socket.IO** (+ Redis adapter at 2+ instances) | Raw ws (reinvents reconnect/ack), Pusher/Ably (cost, less control over authorization) |
| Queue | **BullMQ** on Redis | Postgres-based queues (pg-boss is a valid alternative; BullMQ matches plan §87) |
| Storage | **Cloudflare R2** (S3 API) + MinIO locally | S3 (egress fees), Firebase Storage (vendor lock-in, weaker S3 tooling) |
| Auth | Email OTP → short-lived JWT access + rotating opaque refresh token (in PG) | Passwords (more attack surface, no benefit), Firebase/Auth0/Clerk (identity data held by a third party, costs, tricky with pseudonymity), magic links (deep-link friction on mobile) |
| Admin | **Next.js** (App Router) on Vercel, calling `/api/v1/admin` | Retool/AdminJS (weaker privacy controls and audit) |
| Tests | Vitest + Supertest (server/shared/admin), Jest (`jest-expo`) + React Native Testing Library (mobile), **Maestro** (mobile E2E), Playwright (admin E2E, V1), k6 (load) | Detox (more setup than Maestro for a small team) |
| Monorepo | **pnpm workspaces** (no Turborepo until builds are slow) | Nx/Turborepo on day one (unnecessary) |
| CI/CD | GitHub Actions | — |
| Monitoring | Sentry + structured pino logs + uptime checks | Datadog (cost) |

---

## 5. System Architecture

```
┌──────────────────────┐        ┌───────────────────────┐
│ Expo mobile app      │        │ Next.js admin (Vercel)│
│ (Android first)      │        │ TOTP 2FA, RBAC        │
└───────┬──────────────┘        └──────────┬────────────┘
        │ HTTPS REST /api/v1   WSS Socket.IO│ HTTPS /api/v1/admin (httpOnly cookie + CSRF)
        ▼                                   ▼
┌───────────────────────────────────────────────────────────────┐
│ API process (Node/Express 5 + Socket.IO)  ×1 → ×N             │
│  middleware → controller → service → repository → presenter   │
│  modules: auth, profiles, posts, comments, media, chat,       │
│  safety(blocks/reports), moderation, sanctions, notifications,│
│  admin, meta, health                                          │
└───────┬───────────────┬──────────────────┬────────────────────┘
        │               │ enqueue jobs     │ presigned URLs
        ▼               ▼                  ▼
┌────────────┐   ┌─────────────┐    ┌────────────────┐
│ PostgreSQL │   │ Redis       │    │ Cloudflare R2  │
│ source of  │   │ rate limits │    │ incoming/      │
│ truth      │   │ presence    │    │ media/ (private│
└─────▲──────┘   │ BullMQ      │    │ signed GETs)   │
      │          │ socket adpt │    └──────▲─────────┘
      │          └──────┬──────┘           │
      │                 ▼                  │
      │   ┌─────────────────────────────┐  │
      └───┤ Worker process (same repo)  ├──┘
          │ email.send, push.send,      │──► Email provider (OTP)
          │ media.process (sharp),      │──► Expo Push → FCM/APNs
          │ moderation.scan, feed.hot,  │──► AI moderation provider
          │ cleanup.*, account.purge    │──► Safe Browsing
          └─────────────────────────────┘
```

**Why a modular monolith + worker:** a single deployable unit keeps debugging, transactions and deploys simple for three people. Module boundaries (folders with their own service/repository/presenter, talking to each other only through service functions) keep the code splittable later. The worker shares code but runs separately, so slow jobs never block requests and can scale on their own.

---

## 6. React Native Architecture

### 6.1 Key decisions
- **Expo + dev builds from Phase 2.** WHAT: a custom Expo client with our native modules. WHY: push notifications and some modules don't work in Expo Go. Starting on dev builds avoids a painful switch later. WHERE: `apps/mobile/eas.json` profiles `development`, `preview` (internal testers), `production`.
- **Expo Router** with file-based route groups that enforce the auth state machine: `unauthenticated → verifying → needs_onboarding → ready`.
- **JS + JSDoc:** components and hooks are `.js` with `// @ts-check` enabled through `jsconfig.json` (`checkJs: true`). Payload types come from `@campus/shared` via `/** @typedef {import('@campus/shared').PostDTO} PostDTO */`, where `PostDTO` is exported as `z.infer` typedefs from the shared package's generated `.d.ts`. CI runs `tsc --noEmit -p jsconfig.json` as a type check only. No TS source files.
- **State split:** TanStack Query owns everything that comes from the server. Zustand owns session status, socket connection status, UI preferences and ephemeral chat UI state (drafts, pending sends). Never copy server data into Zustand.
- **Secure storage:** refresh token and access token in `expo-secure-store` only. Theme and non-sensitive preferences in AsyncStorage.
- **Environment:** `app.config.js` reads `APP_VARIANT` (development/preview/production) → bundle ID suffix, app name, scheme, and `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_SOCKET_URL`, validated at startup by `src/config/env.js` (Zod). No secrets in the mobile app, ever: everything `EXPO_PUBLIC_*` is public.

### 6.2 Navigation / route tree
```
apps/mobile/app/
├── _layout.js              # Providers: QueryClient, Theme, SafeArea, AuthBootstrap, SocketProvider, NotificationHandler, ErrorBoundary
├── index.js                # Redirects by session state
├── +not-found.js
├── (auth)/                 # Only when unauthenticated
│   ├── _layout.js
│   ├── welcome.js          # Value prop + "Your identity is hidden from other students" (never "no one can identify you")
│   ├── email.js            # University email input
│   └── verify.js           # OTP input, resend timer
├── (onboarding)/           # Authenticated, no profile yet
│   ├── _layout.js
│   ├── guidelines.js       # Community guidelines + 18+ confirmation + privacy explainer (must accept)
│   ├── identity.js         # Choose 1 of 3 generated pseudonyms + avatar color
│   └── interests.js        # Department/semester optional, interests multi-select
└── (app)/                  # Guard: ready
    ├── _layout.js          # Stack
    ├── (tabs)/
    │   ├── _layout.js      # Home | Discover | Create | Chats | Profile
    │   ├── index.js        # Feed (category chips, sort toggle)
    │   ├── discover.js     # MVP: "coming soon" sections + trending; V1+: Find Someone, communities…
    │   ├── create.js       # Tab button opens post/new modal
    │   ├── chats.js        # Conversations + Requests segment
    │   └── profile.js      # Own persona
    ├── post/[postId].js    # Post detail + comments
    ├── post/new.js         # Modal composer
    ├── chat/[conversationId].js
    ├── profile/[publicId].js   # Other persona (public fields only)
    ├── notifications.js
    ├── report.js           # Modal: target type/id via params
    └── settings/
        ├── index.js  privacy.js  notifications.js  blocked.js  account.js (logout, delete account)  legal.js
```

### 6.3 Folder structure (what goes where)
```
apps/mobile/
├── app/            # ROUTES ONLY. Thin screens that read params and compose feature components.
│                   # NOT here: fetching logic, business rules, reusable UI.
├── src/
│   ├── features/<feature>/     # auth, onboarding, profile, feed, comments, chat, media, notifications, safety, settings
│   │   ├── api.js              # Endpoint functions (use lib/api/client). One place per endpoint.
│   │   ├── queries.js          # Query keys + useQuery/useInfiniteQuery/useMutation hooks, optimistic updates
│   │   ├── components/         # Feature-specific UI (PostCard, Composer, MessageBubble…)
│   │   ├── hooks/              # Feature logic hooks (useSendMessage, useTypingIndicator)
│   │   └── store.js            # Only if the feature needs local ephemeral state (chat drafts/pending)
│   │   # NOT here: generic UI primitives, cross-feature infrastructure.
│   ├── components/
│   │   ├── ui/                 # Design system: Button, Input, Text, Avatar, AnonymousAvatar, Sheet, Modal, Chip, Skeleton
│   │   └── common/             # Screen, EmptyState, ErrorState, OfflineBanner, LoadingView, ReportSheet
│   │   # NOT here: anything that calls APIs.
│   ├── lib/                    # Infrastructure singletons
│   │   ├── api/client.js       # Axios instance, auth header, 401 → single-flight refresh → retry, error normalization
│   │   ├── api/errors.js       # Maps shared error codes → user messages
│   │   ├── socket/client.js    # socket.io-client lifecycle, auth, reconnect, event subscription helpers
│   │   ├── query/client.js     # QueryClient defaults (staleTime, retry policy, focus/online managers)
│   │   ├── storage/secure.js   # SecureStore wrapper (tokens only)
│   │   ├── storage/prefs.js    # AsyncStorage wrapper (theme, dismissed hints)
│   │   ├── notifications/      # Permission, token registration, tap → deep link routing
│   │   └── linking/            # URL ↔ route mapping for push/deep links
│   │   # NOT here: feature business logic.
│   ├── stores/                 # Global Zustand: session.js (status, onboarding step), connectivity.js, preferences.js
│   ├── theme/                  # Tokens (spacing, radius, typography, colors light/dark), useTheme
│   ├── config/env.js           # Zod-validated public env
│   ├── constants/              # UI constants (not API limits, which live in shared)
│   └── utils/                  # Pure helpers (formatRelativeTime, compressImage)
├── assets/
├── app.config.js  eas.json  jsconfig.json  jest.config.js
```

### 6.4 Cross-cutting behavior
| Concern | Approach |
|---|---|
| Auth state | `session` store: `status` ∈ {`booting`, `unauthenticated`, `needs_onboarding`, `ready`}. On boot: read refresh token → `POST /auth/refresh` → `GET /me` → set status. Route groups redirect by status. |
| Token refresh | Axios interceptor: on `401 TOKEN_EXPIRED`, one shared refresh promise, queued retries. On refresh failure → clear SecureStore → `unauthenticated`. The socket reconnects with the new token. |
| Caching | `staleTime`: feed 30s, post detail 30s, profile 5m, meta (interests/departments) 24h. Optional query persistence to disk in V1 (not MVP, to avoid stale private data on a shared device). |
| Offline | `@react-native-community/netinfo` → `onlineManager`. OfflineBanner. Queries pause. Mutations fail fast with a retry CTA. Chat keeps unsent messages in the pending store with a "failed – tap to retry" state. A full offline queue is V1+. |
| Loading/empty/error | Every list screen uses a shared `QueryStateView` pattern: skeleton → content / EmptyState (with a CTA) / ErrorState (with retry). Never a blank screen (plan §69). |
| Optimistic updates | Likes (toggle + count), own comment (pending style), own chat message (pending → sent via ack), delete own post (remove, restore on error). **Not** optimistic: post creation (moderation may hold it), reports, blocks (wait for confirmation, then purge caches). |
| Pagination | `useInfiniteQuery` + `{items, nextCursor, hasMore}`; FlashList `onEndReached` with a threshold; pull-to-refresh resets pages. |
| Images | Pick → `expo-image-manipulator` resize (max 2048px) + re-encode JPEG ~0.8 (**strips EXIF/GPS on device**; the server strips again) → presigned upload. Display with expo-image using **`cacheKey = mediaId:variant`**, because signed URLs change on every fetch and would otherwise defeat the cache. |
| Files (V1) | expo-document-picker, PDFs only, opened externally via expo-sharing (never rendered in-app). |
| Push | expo-notifications. Ask permission **after** the first meaningful moment (first post or first chat), not at launch. Token → `POST /devices`. Tap → deep-link handler → route. |
| Deep links | Scheme per variant (e.g., `campusapp://`, `campusapp-dev://`). Routes: `/post/:id`, `/chat/:id`, `/notifications`. Android App Links / iOS Universal Links in V1 (needs a domain). A deep link never bypasses auth guards. |
| Error tracking | Sentry RN SDK with `beforeSend` scrubbing (no message bodies, no tokens). |

---

## 7. Backend Architecture

### 7.1 Technology evaluation (plan §7 list)
| Tech | Use? | Why |
|---|---|---|
| Node.js + Express 5 | **Yes** | Plan-specified, team-familiar. Express 5 handles async errors natively. |
| PostgreSQL | **Yes, source of truth** | Relational integrity (FKs, unique constraints for likes/blocks/idempotency), transactions, full-text search, mature managed hosting. |
| Prisma | **Yes** | Migrations + typed client (JSDoc-friendly). Use raw SQL (`$queryRaw` with tagged templates) for hot-score updates and FTS. |
| Redis | **Yes, narrowly** | Rate limits, presence, BullMQ, Socket.IO adapter, a few TTL caches (§9). |
| Socket.IO | **Yes** | Acks, reconnection, rooms, a Redis adapter for scaling. |
| Object storage | **Yes (R2)** | §10. |
| Push | **Yes (Expo Push)** | Free, a single API for FCM and APNs. |

### 7.2 Server folder structure
```
apps/server/
├── src/
│   ├── app.js              # Builds the Express app: security headers, CORS, body limits, requestId, routes, errors
│   ├── server.js           # HTTP server + Socket.IO bootstrap + graceful shutdown
│   ├── worker.js           # BullMQ workers + repeatable jobs bootstrap
│   ├── config/env.js       # Zod-validated env. App refuses to start on invalid config.
│   ├── lib/                # Infrastructure adapters (no business rules)
│   │   ├── prisma.js  redis.js  logger.js (pino + redaction)  queue.js  storage.js (S3 client, presign)
│   │   ├── mailer.js  push.js  crypto.js (HMAC, AES-GCM, token gen)  ids.js  clock.js
│   ├── middleware/
│   │   ├── requestId.js  authenticate.js  requireAccountState.js  requireOnboarded.js
│   │   ├── validate.js (Zod for body/query/params)  rateLimit.js  errorHandler.js  notFound.js
│   │   └── admin/ adminAuthenticate.js  requireAdminRole.js  csrf.js
│   ├── modules/
│   │   ├── <module>/
│   │   │   ├── routes.js       # Path + middleware chain + controller binding
│   │   │   ├── controller.js   # HTTP ⇄ service translation ONLY (no Prisma, no rules)
│   │   │   ├── service.js      # Business rules, authorization policies, transactions, enqueue side effects
│   │   │   ├── repository.js   # Prisma queries; ALWAYS explicit `select`; ALWAYS scoped by universityId
│   │   │   ├── presenter.js    # Internal row → public DTO (the ONLY way data leaves the module)
│   │   │   ├── policies.js     # canDeletePost(actor, post) etc.
│   │   │   ├── jobs.js         # Job producers/processors for this module
│   │   │   └── *.test.js
│   │   # modules: health, auth, meta, profiles, users(self/account), posts (incl. likes), comments,
│   │   #          media, chat (conversations+messages), safety (blocks+reports), moderation,
│   │   #          sanctions, notifications (incl. devices), admin/*, later: matching, communities,
│   │   #          listings (study/fyp), lostFound, reveal, orgs, events, search
│   ├── realtime/
│   │   ├── io.js               # Socket.IO server, auth middleware, adapter, per-socket rate limiter
│   │   ├── handlers/chat.js    # message:send, conversation:read, typing:*
│   │   ├── handlers/presence.js (V1)
│   │   └── emit.js             # emitToUser(userId, event, payload), used by services (never raw io in services)
│   ├── jobs/registry.js        # Queue names, default retry/backoff, repeatable schedules
│   └── errors/                 # AppError, error codes (from shared), HTTP mapping
├── prisma/ schema.prisma  migrations/  seed.js (university, domains, departments, interests, dev users)
├── tests/ helpers/ (testApp, factories, db reset, auth helper, socket helper)  integration/  security/
├── Dockerfile  jsconfig.json  vitest.config.js
```

Plan.md's `likes`, `conversations`/`messages` and `attachments` modules are merged into `posts`, `chat` and `media`. Separate modules for those would create cross-module chatter without real separation.

### 7.3 Layer responsibilities & request path
```
Mobile → HTTPS → [helmet, CORS, body-size limit, requestId]
  → authenticate (verify JWT → req.auth = {userId, sessionId, universityId})
  → requireAccountState (Redis-cached status; SUSPENDED/BANNED → 403 ACCOUNT_SUSPENDED)
  → rateLimit(scope) → validate(zodSchema) → controller
  → service (policy check, block check, moderation.preCheck, prisma.$transaction)
  → repository (select-only, scoped by universityId) → PostgreSQL
  → presenter (DTO; response schema .strip()) → envelope {success, data} → client
  → after commit: queue.add(moderation.scan / push.send / …)
```
**Example: "Moeed deletes his post."** `DELETE /api/v1/posts/:postId` → authenticate → the service loads the post **scoped to Moeed's university** → a missing post, or one from another university, returns `404 NOT_FOUND` (not 403, so existence isn't revealed) → policy `post.authorUserId === actor.userId` or else `404` → soft delete (`status=DELETED, deleted_at`) → decrement nothing (counts are on the post itself) → `204`. The mobile app had already removed the post optimistically and restores it on error.

### 7.4 Cross-cutting backend concerns
| Concern | Design |
|---|---|
| Validation | Every route declares Zod schemas from `@campus/shared` for params/query/body. Unknown keys are rejected (`.strict()`) on input. Responses pass through the presenter + response schema (`.strip()`), and in dev/test **fail loudly** if a DTO contains unexpected keys. |
| AuthN | JWT access (15 min, HS256 with `kid` for key rotation), claims `{sub, sid, uni, typ:'access'}`. Refresh tokens are opaque random 256-bit strings stored **hashed** in `sessions` and rotated on every use. |
| AuthZ | Three layers: (1) route middleware (authenticated, onboarded, admin role); (2) service **policies** (ownership, membership, block, account state, university scope); (3) repository scoping by `universityId`. Postgres Row-Level Security is a V2 defense-in-depth option. |
| Errors | `AppError(code, httpStatus, safeMessage, details?)`. Error codes live in shared (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `ACCOUNT_RESTRICTED`, `ACCOUNT_SUSPENDED`, `CONTENT_REJECTED`, `CONFLICT`, `UPGRADE_REQUIRED`, `INTERNAL`). There are no stack traces outside dev. Unknown errors → `INTERNAL` + Sentry. |
| Logging | pino JSON with `requestId`, route, status, latency, `userId` hashed. **Redaction paths:** `authorization`, `cookie`, `*.email`, `*.code`, `*.otp`, `*.token`, `*.refreshToken`, `body.body` (message and post text), `*.password`. |
| Config | `config/env.js` validates all env vars with Zod at boot. Separate `.env.example` files committed; real `.env` never committed. |
| Rate limiting | `rate-limiter-flexible` with Redis; limits defined centrally in `shared/limits.js` so the client can show friendly messages (§9, §20). |
| Caching | Minimal. Meta lists (interests, departments, university config) are cached in memory or Redis for 1h. Account status in Redis for 60s. No feed cache in MVP. |
| Background jobs | BullMQ queues: `email`, `push`, `media`, `moderation`, `maintenance`. Each job is idempotent (keyed by entity ID) with exponential backoff and a dead-letter state visible in the admin system page (V1). Jobs are enqueued **after** the DB transaction commits. Known MVP gap: a crash between commit and enqueue loses the job; the fix at scale is a transactional outbox table (V2). |
| File uploads | Never through Node. Presign → client PUT → complete → worker processing (§10). |
| Notifications | `notifications.service.notify(userId, type, entityRef, data)` → insert an in-app row → enqueue `push.send` if the user's preferences allow and they aren't actively viewing that conversation. |
| WebSockets | §13. |
| Moderation | `moderation.preCheck(content)` sync rules → `moderation.scan` async job → `moderation_decisions` + case creation (§18). |
| Audit logs | `admin_audit_logs` is append-only (DB role without UPDATE/DELETE in prod, V1). Every admin mutation and every identity access writes a row in the same transaction. |
| Min app version | Header `X-App-Version`. The server returns `426 UPGRADE_REQUIRED` below the minimum and the app shows a blocking update screen. |

---

## 8. Database Architecture

### 8.1 Why PostgreSQL as the source of truth
Everything here is relational and needs integrity guarantees: one like per user per post (unique constraint), membership checks (FK + index), idempotent message sends (unique `(sender, client_message_id)`), atomic counters and state machines (transactions). PG also covers full-text search and JSONB for flexible settings, so no second database is needed until very large scale. Redis only holds data that can be lost or rebuilt.

### 8.2 Conventions
- PK: `id uuid` (UUIDv7; Prisma `@default(uuid(7))`, or generate in `lib/ids.js` if unsupported by the installed Prisma version, checked in Phase 1).
- Timestamps: `created_at`, `updated_at` on all mutable rows. `deleted_at` for soft delete where users can delete.
- Tenant: `university_id` on every university-scoped table + a composite index leading with it.
- Enums: Postgres enums via Prisma for stable sets (status, reason). Lookup tables for sets admins edit (interests, departments, skills).
- Cascades: `ON DELETE RESTRICT` by default. Users are **never hard-deleted by cascade**; account purge is an explicit job (§11.7). Cascades only for pure join rows (likes, interests) when a parent is purged.
- Naming: snake_case tables/columns via Prisma `@@map`/`@map`; camelCase in JS.

### 8.3 MVP tables

**Tenancy & identity**
| Table | Key columns | Constraints / indexes | Privacy |
|---|---|---|---|
| `universities` | id, slug, name, status(`ACTIVE`,`PILOT`,`DISABLED`), settings jsonb (feature flags, limits) | unique(slug) | public (name only) |
| `university_domains` | id, university_id, domain, is_active | unique(domain) | internal |
| `departments` | id, university_id, name, sort_order | unique(university_id, name) | public |
| `users` | id, university_id, email_hash, status(`ACTIVE`,`RESTRICTED`,`SUSPENDED`,`BANNED`,`PENDING_DELETION`,`DELETED`), role(`USER`), restricted_until, suspended_until, onboarded_at, last_active_at, created_at, updated_at, deleted_at | unique(email_hash); idx(university_id, status) | **never serialized**; `id` never leaves the server except inside the user's own JWT |
| `user_identities` | user_id PK/FK, email_encrypted (AES-256-GCM), email_key_version, email_domain, verified_at | — | **highly restricted**: read only by the auth module + break-glass admin flow |
| `verification_challenges` | id, email_hash, code_hash, purpose(`LOGIN`), attempts, max_attempts, expires_at, consumed_at, ip_hash, created_at | idx(email_hash, created_at desc) | internal; purged after 24h |
| `sessions` | id, user_id, family_id, refresh_token_hash, platform, device_label, app_version, ip_hash, created_at, last_used_at, expires_at, revoked_at, revoke_reason, replaced_by_id | unique(refresh_token_hash); idx(user_id, revoked_at) | internal |
| `banned_email_hashes` | email_hash PK, reason, sanction_id, created_at | — | internal (enforces bans after account deletion) |

**Persona**
| Table | Key columns | Constraints / indexes | Privacy |
|---|---|---|---|
| `anonymous_profiles` | id, user_id (unique FK), university_id, **public_id** (e.g., `p_` + 12-char nanoid), animal, number, display_name, avatar_seed, avatar_color, department_id?, semester?, bio? (V1), show_department, show_semester, show_interests, allow_discovery (V1), dm_policy(`EVERYONE`,`NOBODY`; V1 adds `MATCHES_ONLY`), name_changed_at, created_at, updated_at | unique(public_id); unique(university_id, display_name); idx(university_id) | public fields only via `toPublicProfile()`, which respects the show_* flags |
| `profile_name_history` | id, profile_id, display_name, changed_at | idx(profile_id) | admin only (prevents "change name after harassment" evasion) |
| `interests` | id, slug, name, category, is_active | unique(slug) | public |
| `profile_interests` | profile_id, interest_id | PK(profile_id, interest_id); idx(interest_id) | public if show_interests |

**Feed**
| Table | Key columns | Constraints / indexes |
|---|---|---|
| `posts` | id, university_id, author_user_id, author_profile_id, category(`ACADEMIC`,`CAMPUS`,`CAREER`,`GENERAL`), flair?, body (≤ 2000 chars), status(`PUBLISHED`,`PENDING_REVIEW`,`HIDDEN`,`REMOVED`,`DELETED`), like_count, comment_count, hot_score (double), created_at, updated_at, deleted_at | idx(university_id, status, created_at desc, id desc); idx(university_id, status, category, created_at desc, id desc); idx(university_id, status, hot_score desc, id desc); idx(author_user_id, created_at desc) |
| `post_media` | post_id, media_id, position | PK(post_id, position); unique(media_id) |
| `comments` | id, university_id, post_id, author_user_id, author_profile_id, body (≤ 1000), status, created_at, deleted_at (V1: parent_comment_id, like_count) | idx(post_id, created_at, id); idx(author_user_id, created_at desc) |
| `post_likes` | post_id, user_id, created_at | PK(post_id, user_id); idx(user_id, created_at desc) |

`author_user_id` is stored for authorization, moderation and block filtering, but **only** `author_profile_id` is used by the presenter.

**Media**
| Table | Key columns | Constraints / indexes |
|---|---|---|
| `media_objects` | id, university_id, owner_user_id, purpose(`POST_IMAGE`,`MESSAGE_IMAGE`; V1 `MESSAGE_FILE`), status(`PENDING_UPLOAD`,`PROCESSING`,`READY`,`REJECTED`,`DELETED`), incoming_key, variants jsonb ({thumb:{key,w,h}, full:{key,w,h}}), declared_mime, detected_mime, size_bytes, width, height, sha256, moderation_status, created_at, attached_at, expires_at | idx(status, created_at) (orphan cleanup); idx(owner_user_id, created_at desc); idx(sha256) (known-bad hash matching) |

**Chat**
| Table | Key columns | Constraints / indexes |
|---|---|---|
| `conversations` | id, university_id, kind(`DIRECT`), direct_key (hash of sorted user IDs), status(`REQUESTED`,`ACTIVE`,`DECLINED`,`CLOSED`), initiator_user_id, origin_type?(`POST`,`COMMENT`,`PROFILE`; V1 `MATCH`,`LISTING`), origin_id?, last_message_id, last_message_at, created_at, accepted_at | unique(direct_key); idx(university_id) |
| `conversation_members` | conversation_id, user_id, profile_id, role(`INITIATOR`,`RECIPIENT`), last_read_message_id, last_delivered_message_id, muted_until, hidden_at, joined_at | PK(conversation_id, user_id); idx(user_id, hidden_at) |
| `messages` | id (UUIDv7 = order), conversation_id, sender_user_id, sender_profile_id, client_message_id, kind(`TEXT`,`IMAGE`,`SYSTEM`), body (≤ 4000), media_id?, status(`SENT`,`HIDDEN`,`DELETED`), moderation_status, created_at, deleted_at (V1: reply_to_message_id, edited_at) | **unique(sender_user_id, client_message_id)** (idempotency); idx(conversation_id, id desc) |

Unread count = messages in the conversation with `id > last_read_message_id AND sender ≠ me`, computed with the index and capped at 99. It isn't stored as a counter, so it can't drift.

**Safety & moderation**
| Table | Key columns | Constraints / indexes |
|---|---|---|
| `blocks` | blocker_user_id, blocked_user_id, created_at | PK(blocker, blocked); idx(blocked_user_id) |
| `reports` | id, university_id, reporter_user_id, target_type(`POST`,`COMMENT`,`MESSAGE`,`PROFILE`,`CONVERSATION`), target_id, target_user_id, reason(`HARASSMENT`,`BULLYING`,`SPAM`,`THREAT`,`SEXUAL_CONTENT`,`SCAM`,`IMPERSONATION`,`DOXXING`,`SELF_HARM`,`OTHER`), details (≤ 500), snapshot jsonb, case_id, status, created_at | unique(reporter_user_id, target_type, target_id); idx(case_id); idx(target_user_id, created_at) |
| `moderation_cases` | id, university_id, target_type, target_id, target_user_id, source(`REPORT`,`AUTO`,`ADMIN`), status(`OPEN`,`IN_REVIEW`,`ACTIONED`,`DISMISSED`), priority(`LOW`,`NORMAL`,`HIGH`,`URGENT`), risk_score, report_count, assigned_admin_id, resolution, resolved_at, created_at | unique(target_type, target_id) where status in (OPEN, IN_REVIEW) (partial unique, raw SQL migration); idx(status, priority, created_at) |
| `moderation_decisions` | id, content_type, content_id, stage(`RULES`,`AI_TEXT`,`AI_IMAGE`,`LINK`), provider, labels jsonb, scores jsonb, action(`ALLOW`,`FLAG`,`HOLD`,`REJECT`), created_at | idx(content_type, content_id) |
| `user_sanctions` | id, user_id, type(`WARNING`,`RESTRICTION`,`SUSPENSION`,`BAN`), reason_code, note, case_id, starts_at, ends_at, created_by_admin_id?, created_by_system bool, revoked_at, revoked_by | idx(user_id, starts_at desc) |
| `rule_lists` | id, kind(`BLOCKED_TERM`,`FLAG_TERM`,`BLOCKED_DOMAIN`,`ALLOWED_DOMAIN`), value, locale, is_active | admin-editable (V1 UI; seed file in MVP) |

**Notifications**
| Table | Key columns | Constraints / indexes |
|---|---|---|
| `notifications` | id, user_id, type(`NEW_MESSAGE`,`MESSAGE_REQUEST`,`NEW_COMMENT`,`MODERATION_NOTICE`, …), actor_profile_id?, entity_type, entity_id, data jsonb, read_at, created_at | idx(user_id, created_at desc); idx(user_id, read_at) |
| `device_tokens` | id, user_id, session_id, expo_push_token, platform, created_at, last_used_at, disabled_at | unique(expo_push_token); idx(user_id) |
| `user_settings` | user_id PK, notification_prefs jsonb, push_preview(`NONE`,`SENDER_ONLY`), theme? | — |

**Admin**
| Table | Key columns | Constraints |
|---|---|---|
| `admin_users` | id, email, password_hash (argon2id), totp_secret_encrypted, role(`MODERATOR`,`SENIOR_MODERATOR`,`SUPER_ADMIN`), university_scope (null = all), status, last_login_at, created_at | unique(email) |
| `admin_sessions` | id, admin_id, token_hash, ip_hash, user_agent, created_at, expires_at (8h), revoked_at | unique(token_hash) |
| `admin_audit_logs` | id, admin_id, action, target_type, target_id, reason, metadata jsonb, ip_hash, created_at | idx(admin_id, created_at); idx(target_type, target_id); **append-only** |
| `identity_access_grants` | id, requested_by, target_user_id, case_id, justification, approved_by?, status, expires_at, accessed_at, created_at | break-glass (§19) |

**Analytics (privacy-preserving)**
| `analytics_events` | id, user_id_hash (HMAC, rotated yearly), university_id, name (`EMAIL_VERIFIED`, `POST_CREATED`, …), props jsonb (no content), created_at | idx(name, created_at) |

### 8.4 Post-MVP tables (introduced in their phases)
- **V1:** `post_saves`, `comment_likes`, `comments.parent_comment_id`, `message_reactions(message_id,user_id,emoji; PK)`, `messages.reply_to_message_id`, `skills`, `profile_skills(profile_id, skill_id, kind: HAS|WANTS)`, `anonymous_profiles.looking_for text[]`, `mutes (user-level)`, `appeals`.
- **V1.5:** `match_preferences(profile_id, purposes[], department_ids[], semesters[], interest_ids[], updated_at)`, `match_impressions(viewer, candidate, shown_at, action)`; `communities(id, university_id, slug, name, type ACADEMIC|INTEREST|CAMPUS|CAREER, parent_id, visibility, created_by)`, `community_members(community_id, user_id, role MEMBER|MODERATOR, joined_at)`, `posts.community_id`; `listings(id, university_id, author_user_id, author_profile_id, kind STUDY|FYP, title, description, details jsonb, status OPEN|FILLED|CLOSED, expires_at)` + `listing_skills`; `lost_found_items(post_id PK, type LOST|FOUND, item_category, location_text, occurred_on, resolved_at)`; `identity_reveal_requests(id, conversation_id, requester_id, status PENDING|ACCEPTED|REJECTED|CANCELLED|EXPIRED, expires_at)`, `reveal_cards(user_id, fields jsonb encrypted)`.
- **V2:** `organizations(id, university_id, name, kind SOCIETY|DEPARTMENT|UNIVERSITY, verified_at, verified_by)`, `organization_members(org_id, user_id, role)`, `posts.author_org_id` (official posts), `events(id, university_id, org_id?, created_by, title, description, location, starts_at, ends_at, media_id, registration_url, status)`, `event_rsvps(event_id, user_id, status)`; `outbox_events`.

### 8.5 Review of `plan.md` entities
- **Missing, and added:** `university_domains`, `departments`, `user_identities`, `verification_challenges`, `sessions`, `banned_email_hashes`, `profile_name_history`, `media_objects`, `moderation_cases`, `moderation_decisions`, `user_sanctions`, `rule_lists`, `user_settings`, `admin_sessions`, `identity_access_grants`, `analytics_events`.
- **Changed:** `message_attachments` → `media_objects` + FK (D6). `user_interests` → `profile_interests` (interests are persona data). `matches`/`match_requests` → `match_preferences` + conversation requests (D7). `StudyRequest`/`FypRequest` → one `listings` table with `kind` (same lifecycle, same discovery). `LostFoundPost` → a post + a `lost_found_items` detail row (reuses comments, reports, moderation and the feed). `Society` → `organizations` (also covers departments and official accounts). `AdminAction` → `admin_audit_logs` + `user_sanctions` (separates "what happened to the user" from "who did what").
- **Never returned publicly:** `users.*`, `user_identities.*`, any `*_user_id`, `email_hash`, `ip_hash`, `sessions.*`, `moderation_*`, `reports.reporter_user_id` (a reporter is never revealed to the reported user, including in admin views for low roles), `profile_name_history`, `device_tokens`, `sanctions` of other users.

---

## 9. Redis Architecture

Redis runs with `maxmemory-policy noeviction` because BullMQ requires it, so every cache key **must have a TTL**. At 10k users, split into a queue Redis (noeviction) and a cache Redis (allkeys-lru).

| Use case | Key pattern | Value | TTL | Invalidation | Why Redis |
|---|---|---|---|---|---|
| Rate limits | `rl:{scope}:{id}` e.g. `rl:otp-send:email:{emailHash}`, `rl:otp-send:ip:{ipHash}`, `rl:otp-verify:{emailHash}`, `rl:post:{userId}`, `rl:comment:{userId}`, `rl:msg:{userId}`, `rl:conv-new:{userId}`, `rl:report:{userId}`, `rl:upload:{userId}`, `rl:search:{userId}` | counters (rate-limiter-flexible) | = window | expires | Atomic counters across instances |
| OTP resend cooldown | `otp:cooldown:{emailHash}` | 1 | 60s | expires | Cheap TTL flag |
| Account status cache | `acct:{userId}` | `{status, until}` | 60s | **DEL on any sanction/status change** | Avoids a DB hit on every request |
| Presence (V1) | `presence:{userId}` | socket count / last heartbeat | 70s (heartbeat 30s) | expires on disconnect/timeout | Ephemeral, high-churn |
| Chat "viewing" state | `viewing:{userId}` | conversationId | 70s | on leave/blur | Suppress push when the user is looking at that chat |
| Push collapse | `pushc:{userId}:{conversationId}` | count | 60s | expires | Batch "3 new messages" instead of 3 pushes |
| Socket.IO adapter | adapter channels | pub/sub | — | — | Cross-instance fan-out (at 2+ instances) |
| BullMQ | `bull:{queue}:*` | jobs | managed | managed | Durable-enough queue with retries |
| Meta cache | `meta:interests`, `meta:departments:{uniId}` | JSON | 1h | DEL on admin edit | Hot read, tiny |
| Block set cache (V1, perf) | `blk:{userId}` | set of user IDs blocked either way | 10 min | DEL both users on block/unblock | Speeds up feed and matching filters |
| Match seen (V1.5) | `match:seen:{profileId}` | set | 7d | expires | Avoid showing the same candidate repeatedly |

**Not in Redis:** typing indicators (relayed through the socket, never stored), sessions and refresh tokens (PG), unread counts (PG query), notifications (PG), anything a user would be upset to lose.

**Must remain in PostgreSQL:** users, identities, sessions, profiles, posts, comments, likes, conversations, members + read pointers, messages, media metadata, blocks, reports, cases, sanctions, audit logs, notifications, device tokens.

---

## 10. Media Architecture

**Provider: Cloudflare R2.** It's S3-compatible (same SDK, and MinIO locally), has **zero egress fees** (images are read far more than written), and costs little. S3 is the fallback with identical code.

### 10.1 Upload flow (example: "Rayan attaches a photo to a post")
```
1. App: pick image → resize ≤2048px, re-encode JPEG (EXIF stripped on device)
2. POST /api/v1/media/uploads {purpose:"POST_IMAGE", mimeType:"image/jpeg", sizeBytes:812345}
   → server: auth, account state, rate limit rl:upload, validate purpose/mime/size against shared/limits
   → insert media_objects(status=PENDING_UPLOAD, incoming_key="incoming/{uni}/{uuid}", expires_at=+1h)
   → presigned PUT (5 min, signed Content-Type + Content-Length headers)
   ← {mediaId, uploadUrl, headers, expiresAt}
3. App: PUT bytes directly to R2 (progress bar)
4. POST /api/v1/media/{mediaId}/complete
   → server: owner check, HeadObject (size matches) → status=PROCESSING → enqueue media.process
5. Worker media.process:
   - read first bytes → magic-number sniff (file-type); reject if not jpeg/png/webp/heic
   - sharp: decode (limits: max 40 MP input), auto-rotate, STRIP ALL METADATA, re-encode WebP
     variants: thumb (400px) + full (≤1600px) → "media/{uni}/{mediaId}/{variant}.webp"
   - sha256 → check known-bad hashes
   - enqueue moderation.scan(image) → on ALLOW: status=READY; on HOLD/REJECT: REJECTED + case
   - delete incoming object
6. POST /api/v1/posts {body, mediaIds:[…]} → server checks each media: owner = me, purpose matches,
   status = READY (or PROCESSING → post saved as PENDING_REVIEW until media ready), not already attached
7. Reads: presenter returns signed GET URLs (1h TTL) for thumb/full + mediaId (used as the cache key)
```

### 10.2 Rules
| Rule | Value |
|---|---|
| Image types | JPEG, PNG, WebP, HEIC (converted); **no GIF/SVG** (SVG = XSS vector) |
| Image size | ≤ 10 MB upload; ≤ 4 images per post; 1 per message |
| PDFs (V1) | ≤ 20 MB; magic-number check; served with `Content-Disposition: attachment`; never rendered in-app; ClamAV scanning in V2 |
| Office docs, video, voice | Not supported until V2+ (macro/malware risk, transcoding cost) |
| Buckets | **Private only.** No public bucket in MVP. Read access via signed GETs issued after an authorization check (post visible to viewer's university / viewer is a conversation member / not blocked). |
| Orphans | `maintenance.cleanupMedia` hourly: PENDING_UPLOAD past `expires_at` → delete objects + row. READY and never attached after 24h → delete. R2 lifecycle rule deletes `incoming/*` older than 1 day as a backstop. |
| Deletion | When a post/message is deleted, its media is marked DELETED and purged after 30 days (moderation evidence window). Media in an open case gets a moderation hold. |
| Scale path | Cloudflare CDN in front of R2 with a Worker validating short-lived tokens, so edge caching works while access stays controlled. |

---

## 11. Authentication & Anonymity

### 11.1 Anonymous to other users, not to the platform
The platform **can** link a pseudonym to a verified email, and must be able to, in order to enforce bans (one email = one account, so a ban sticks), handle legal requests, and stop serious harm. Product copy (plan §3): **"Your identity is hidden from other students."** Never "nobody can identify you." The privacy policy must say who can access the link (a small number of audited admin roles) and under what conditions.

### 11.2 Verification & login flow (signup and login are the same flow)
```
POST /auth/otp/request {email}
  normalize: trim, lowercase, strip "+tag" from local part
  domain ∈ university_domains (active)?  no → 422 DOMAIN_NOT_SUPPORTED (this reveals nothing about accounts)
  email_hash = HMAC-SHA256(EMAIL_HASH_PEPPER, normalizedEmail)
  banned_email_hashes has it? → respond with the SAME generic success (no ban oracle), send nothing
  rate limits: 1/60s cooldown, 5/hour per emailHash, 20/hour per IP-hash
  code = 6 random digits (crypto.randomInt); store HMAC(pepper, challengeId + code), expires 10 min, max 5 attempts
  enqueue email.send (the code exists in plaintext only in the job payload, removed on completion, never logged)
  ← 200 {challengeId, resendAvailableAt}

POST /auth/otp/verify {challengeId, code, device:{platform, label, appVersion}}
  constant-time compare; attempts++ ; expired/consumed/over attempts → 400 INVALID_CODE (generic)
  upsert user by email_hash (first time: create users + user_identities with encrypted email, in one transaction)
  create session (family_id new) → access JWT + refresh token
  ← {accessToken, refreshToken, expiresIn, onboarding: "NEEDS_PROFILE" | "COMPLETE"}
```

### 11.3 Sessions
- Access JWT 15 min. Refresh token 30 days, opaque, stored hashed, **rotated on every refresh**.
- **Reuse detection:** if an already-rotated refresh token is used, revoke the whole `family_id` (stolen token) and force re-login.
- `POST /auth/logout` revokes the session and disables that session's device token. "Log out all devices" in settings (V1).
- Mobile keeps both tokens in SecureStore. The socket handshake uses the access token.

### 11.4 Public vs private fields
| Field | Stored where | Visible to other students | Visible to self | Visible to admins |
|---|---|---|---|---|
| Email | `user_identities` (encrypted) | Never | Masked (`a***@uet.edu.pk`) in settings | Only via break-glass grant |
| Real name, phone, student ID | **Not collected** | — | — | — |
| Internal user ID | `users.id` | Never | Never (only opaque inside JWT) | Never shown in UI; admin tools use `public_id` |
| Pseudonym, avatar | `anonymous_profiles` | Yes | Yes | Yes |
| Department, semester, interests | `anonymous_profiles` | If show_* = true | Yes | Yes |
| IP address | hashed in sessions/challenges; raw only in host access logs (short retention) | Never | Never | Security investigations only |
| Moderation history | sanctions/cases | Never | Own warnings/sanctions only | Yes |

### 11.5 How APIs prevent accidental exposure (four locks)
1. **Repository `select` allow-lists.** Prisma queries never return `users` or `user_identities` columns to profile/feed/chat modules. A lint rule (`no-restricted-syntax`) forbids `include: { user: true }` outside the auth/admin modules.
2. **Presenters** are the only way data leaves a module, and they map to shared DTO schemas (`PublicProfileDTO`, `PostDTO`, `MessageDTO`, …).
3. **Response schema enforcement:** `.strip()` in production, and in test/dev it **throws** on unexpected keys.
4. **Leak tests** (Phase 4 onward, run in CI): a helper crawls every GET endpoint as user B and asserts that no response contains user A's email, email_hash, internal UUID, `userId` keys, or anything matching an email regex.

### 11.6 Anonymous identity generation
Server-side only: `animal` from a curated list (~60 animals, no offensive or ambiguous words) + `number` 1000–9999 → "Anonymous Fox #2841", unique per university (retry on unique violation). Onboarding offers **3 generated options** and the user picks one. Name changes: pick a new generated option **once per 30 days**. **No free-text names** (stops impersonation like "Admin" or real names). History is kept in `profile_name_history`. The avatar is a generated animal illustration + chosen color: no uploads in MVP, so no face photos to moderate or leak.

### 11.7 Account recovery & deletion
- **Recovery:** log in again with the university email (OTP). Losing access to the university inbox (for example after graduation) means the account can't be recovered. Say this clearly in the FAQ.
- **Deletion** (required by Google Play and Apple for UGC apps): `DELETE /me` → status `PENDING_DELETION` for 14 days (cancel by logging in) → purge job: revoke sessions, delete device tokens, delete the profile's posts & comments (content wiped, row kept as tombstone "[deleted]" for thread integrity), messages kept for the counterpart but the sender is shown as "Deleted account" and message bodies from the deleted user are wiped after 30 days, **unless** under an active moderation case or legal hold. Delete `user_identities` **unless** the user was banned (then keep `banned_email_hashes` only). Audit/moderation records kept per the retention policy (e.g., 12 months), keyed by internal ID only.

---

## 12. Feed Architecture

### 12.1 MVP
| Aspect | Design |
|---|---|
| Create | `POST /posts {body, category, flair?, mediaIds?}` → rate limit (new accounts <72h: 3 posts/day, otherwise 10/hour) → `moderation.preCheck` (sync rules: blocked terms → 422 CONTENT_REJECTED with guideline link; flag terms or links from new accounts → PENDING_REVIEW) → insert → enqueue `moderation.scan` → 201 with the post (and `status` so the UI can show "under review") |
| Retrieve | `GET /posts?sort=recent|trending|top&window=24h|7d&category=&cursor=&limit=20` |
| Recent | `ORDER BY created_at DESC, id DESC`, cursor = base64(created_at,id) |
| Trending | `hot_score = (like_count + 2*comment_count + 1) / (age_hours + 2)^1.5`, recomputed by the `feed.hot` job every 5 min for posts < 7 days old; cursor = (hot_score, id). A post can move between pages; this is acceptable, and the client dedupes by id. |
| Top | `ORDER BY like_count DESC, id DESC WHERE created_at > now() - window` |
| Filters (always) | `university_id = me.uni AND status = PUBLISHED AND NOT EXISTS(block either direction)` + own PENDING_REVIEW posts visible to the author only |
| Likes | `PUT/DELETE /posts/:id/like` (idempotent). A transaction inserts/deletes the like row + `like_count ± 1`. |
| Comments | `GET /posts/:id/comments?cursor=` (oldest first), `POST` (sync rules + async scan), `DELETE /comments/:id` (own). A transaction updates `comment_count`. Notify the post author (not self, not if blocked). |
| Share | Native share sheet with a deep link. **The link requires login**, so content is never publicly viewable. |
| Delete | Soft delete (DELETED), hidden everywhere, kept 30 days for moderation, then purged. |
| Reports | `POST /reports` (§18). N distinct reporters (default 3, weighted) → auto-hide pending review. |
| Caching | None beyond TanStack Query. The indexes carry the load at pilot scale. |

### 12.2 Evolution
- 10k+: cache the first page of trending per university/category in Redis (30s TTL). Block set cached in Redis.
- 100k: precomputed per-community feeds, a personalized ranking signal (interests/communities) as a **re-ranking** of candidate sets, and later an ML ranker once enough engagement data exists (plan §97).

---

## 13. Chat Architecture

### 13.1 REST vs WebSocket
| REST (request/response, cacheable, testable) | Socket.IO (low-latency push) |
|---|---|
| List conversations, create a request, accept/decline, message history (`before`/`after` cursors), delete message, mute/hide, attach media (presign), report, block; `POST /conversations/:id/messages` **fallback send** (same service as the socket) | `message:send` (with ack), `message:new`, `message:deleted`, `conversation:read`/receipt, `typing`, `conversation:request`/`updated`, `notification:new`, `session:revoked`; V1: `presence:update`, `message:reaction` |

### 13.2 Conversation lifecycle (message requests, D10)
```
Ali taps "Message" on Panda's post
→ POST /conversations {recipientProfileId, originType:"POST", originId, firstMessage}
  checks: same university; recipient dm_policy allows; no block either way; account states;
          rl:conv-new (new accounts: 5/day; otherwise 20/day); moderation.preCheck(firstMessage)
  direct_key exists? → return the existing conversation (no duplicates)
  → conversation REQUESTED + members + first message (TEXT only)
  → notify Panda (MESSAGE_REQUEST) + socket conversation:request
Panda: Requests tab → Accept → ACTIVE (both can send freely, images unlocked)
                    → Decline → DECLINED (Ali sees "request not accepted", can't resend for 30 days)
Until accepted: the initiator can send at most 3 text messages, no images.
```

### 13.3 Send path ("Ali sends a message to Panda")
```
App: pending store adds {clientMessageId: uuidv4, body, status:"sending"} → renders greyed
socket.emit("message:send", {conversationId, clientMessageId, body, mediaId?}, ack)
Server (realtime/handlers/chat.js → chat.service.sendMessage — the same function REST uses):
  1 socket.data.auth (verified at handshake; exp checked again) → userId
  2 per-socket + per-user rate limit (rl:msg: 30/min, burst 10; new accounts 10/min)
  3 validate payload (shared schema)
  4 membership: conversation_members(conversationId, userId) exists, else NOT_FOUND
  5 conversation state: ACTIVE, or REQUESTED with initiator limits
  6 block either direction → FORBIDDEN (generic "can't send")
  7 account state (cached)
  8 moderation.preCheck (rules; links from new accounts → HOLD)
  9 INSERT message ON CONFLICT (sender_user_id, client_message_id) DO NOTHING → return the existing row (idempotent retry)
    + update conversations.last_message_* (same transaction)
 10 ack({ok:true, message: MessageDTO})  → app moves pending → "sent" with server id/createdAt
 11 emitToUser(panda, "message:new", dto) + emitToUser(ali other devices, …)
 12 if Panda is not viewing this conversation and not muted → notifications.notify → push job
    (collapsed via pushc:*; preview per user_settings.push_preview; default "Anonymous Fox sent you a message")
 13 async moderation.scan only if (sender is new/restricted) or the conversation has an open report (DM privacy, §18.4)
Panda's app: on message:new → append to the messages query cache → if the screen is focused, emit conversation:read
```

### 13.4 Details
| Topic | Design |
|---|---|
| Auth | Handshake `auth: {token}` → verify JWT, load account state → `socket.data.auth`. Auto-join `user:{userId}` room. On expiry the server emits `auth:expired` and disconnects, and the client refreshes and reconnects. On ban or session revoke: `io.in('user:'+id).disconnectSockets(true)`. |
| Rooms | Per-user rooms only (D11). Services call `emit.toUser()`, which scales across instances with the Redis adapter. |
| Ordering | Server-assigned UUIDv7 + `created_at`. Clients sort by server id. Pending messages sort after the last server message until acked. |
| Duplicates | `client_message_id` unique per sender. The client retries with the same ID. The server returns the existing row. The client dedupes by ID on `message:new`. |
| Delivery/read | Per-member pointers `last_delivered_message_id` (updated when the recipient's app receives it) and `last_read_message_id` (updated on screen focus, debounced). Emitted as receipts to the other member. States: sending → sent → delivered → read, and failed. Read receipts toggle in V1. |
| Typing | `typing:start/stop` relayed to the other member only if both are ACTIVE and not blocked. Throttled at 1 per 3s. Auto-expire after 5s client-side. Not stored. |
| Presence | V1, opt-in, visible only to ACTIVE conversation partners. No "last seen" by default. |
| Reconnect | socket.io-client auto-reconnect with backoff. On `connect`, for each cached conversation: `GET /conversations/:id/messages?after={lastServerId}` to fill gaps, then resend pending (same clientMessageId). The conversation list is refetched. The UI shows a "Reconnecting…" banner. |
| Pagination | `GET …/messages?before={id}&limit=30` (inverted FlashList). `after=` for gap fill. |
| Deletion | `DELETE /messages/:id` (sender, within 24h: "delete for everyone" → body wiped, status DELETED, `message:deleted` emitted). "Hide conversation" per member sets `hidden_at`, which reappears on a new message. Moderation keeps a snapshot if reported **before** deletion. |
| Attachments | Images only in MVP (ACTIVE conversations only). Media purpose MESSAGE_IMAGE. Signed GETs issued only to members. |
| Blocking | Blocks either direction: sends rejected, typing/receipts suppressed, the conversation shows "You can't reply to this conversation", notifications stop, and the blocked user can't start new requests. History remains for the blocker (for reporting) and is hidden for the blocked user. |
| Reporting | Report a message or the whole conversation. The snapshot includes the reported message + **up to 20 prior messages**. The report screen tells the reporter this context will be shared with moderators. |
| Muting | `muted_until` per member (1h / 8h / 1 week / forever) suppresses push only. |
| Spam | New-account limits, identical-body detection across conversations (hash in Redis, 10 min window, >5 identical first messages → hold + case), and a link policy. |
| Replies, reactions, files | V1 (D16). Schema fields are designed in §8.4. |

---

## 14. Matching Architecture (V1.5; prerequisites: skills + looking-for in V1)

- **Inputs:** viewer's `match_preferences` (purposes: STUDY, PROJECT, NETWORKING, FRIENDS; department filter; semester filter; interest/topic filter) + candidate profiles (department, semester, interests, skills has/wants, looking_for).
- **Hard filters (SQL WHERE):** same university; `allow_discovery = true`; status ACTIVE; onboarded; not self; no block either direction; not already in a conversation with the viewer; not seen in the last 7 days (`match:seen`); dm_policy ≠ NOBODY.
- **Score (configurable weights in `universities.settings.matching`):** department +30, semester (exact +20, ±1 +10), interest Jaccard × 30, purpose overlap +20, **complementary skills** bonus (candidate HAS ∩ viewer WANTS) up to +20, recent activity boost (active in the last 7d) +5. Computed in SQL over a candidate pool bounded by filters and `last_active_at` (LIMIT 500 → score → top 20). No ML.
- **Privacy:** cards show only public-permitted fields plus "3 shared interests". Candidates are never told they were shown. No "who viewed me".
- **Mutual matching:** not a separate swipe system. "Start chat" creates a **conversation request** with `originType=MATCH`. Acceptance is the mutual consent (D7).
- **Study/FYP discovery (V1.5):** `listings` ranked by the same scoring against the listing's requirements. "Contact" → conversation request with `originType=LISTING`.
- **Community suggestions:** interest ↔ community tag overlap.
- **Future ML:** once impressions/acceptance data exist, train an acceptance-probability model to **re-rank** the rule-based candidates.

---

## 15. Communities Architecture (V1.5)

- A `communities` table with `type` (ACADEMIC, INTEREST, CAMPUS, CAREER), an optional `parent_id` for the plan §20 tree (Technology → AI/ML), and `visibility` (PUBLIC in university; RESTRICTED later).
- **Posts are reused:** `posts.community_id` (nullable = main campus feed). Community posts can optionally be cross-listed to the main feed.
- Academic communities (plan §16): one per department, with post **tags** (Courses, Assignments, Exams, Study Material, Questions, Discussion) as a `topic` enum on posts in academic communities.
- Membership: join/leave. Home feed V1.5 adds a "My communities" tab.
- Community moderators: `community_members.role = MODERATOR` can hide posts in their community (logged to `admin_audit_logs` with `actor_type=COMMUNITY_MOD`). Sanctions stay platform-admin only.
- Seeded by the team at launch (no user-created communities until V2) to avoid empty or abusive communities.

## 16. Events / Societies / Lost & Found

- **Lost & Found (V1.5):** a post with `category=LOST_FOUND` + `lost_found_items` detail (LOST/FOUND, item category, approximate location text, date, optional image). Anti-abuse: the FOUND form warns users **not** to photograph ID numbers/cards clearly (plus server-side guidance and auto-blur in V2). "Contact" opens a conversation request with a **claim prompt** ("Describe the item to the finder") to deter false claims. The author marks it resolved. Auto-expires after 30 days. Rate limit 3/day.
- **Societies (V2):** `organizations` verified by admins (the verification process is documented: society letter or faculty advisor email). Members with the org role can post **as the organization** (`author_org_id`), shown with a verified badge and never anonymous (plan §23). Announcements = org posts with flair OFFICIAL.
- **Events (V2):** created by verified orgs (or students with admin approval), with RSVP, an "Upcoming" list on Discover, a reminder push 1 day and 1 hour before (`notifications` scheduled jobs), an anonymous discussion thread = linked post, and calendar export later.
- **Campus discussions:** handled in the MVP feed through categories + flairs + the "no naming individuals in allegations" guideline (D17).

## 17. Career Features (V2)

- A Career community (and sub-communities: Internships, Jobs, Freelancing, CV, Interview Prep) + a `CAREER` feed category (already in MVP).
- Flairs: `EXPERIENCE` (rendered "Personal experience – unverified") vs `OFFICIAL` (verified orgs/companies only, V2+). Plan §25 labeling requirement.
- Optional structured "opportunity" post type (company, role, deadline, link) with Safe Browsing link checks and a scam heuristic (fees requested, WhatsApp-only contact).
- Verified employers: Future.

---

## 18. Moderation & Safety

### 18.1 Pipeline
```
Content (post/comment/message/profile bio/image)
 → [SYNC] validation + account state + rate limits + velocity/new-account limits
 → [SYNC] rules engine: blocked terms (EN + Urdu + Roman Urdu lists), personal-data patterns
         (phone numbers, CNIC format, emails) → warn/hold; link policy (new accounts no links;
         shorteners blocked; domain denylist)
         outcome: ALLOW | HOLD (publish as PENDING_REVIEW) | REJECT (422 with guideline)
 → persist
 → [ASYNC moderation.scan] AI text/image classifier → per-category scores → risk score 0–100
         + Safe Browsing for links
 → action matrix:
     risk < 40          ALLOW (record decision only)
     40–69              keep visible, open/append case (NORMAL)
     70–89              auto-HIDE pending review, case HIGH, notify author "under review"
     ≥ 90 or THREAT/SELF_HARM/sexual-minor indicators → HIDE, case URGENT, alert on-call admins
 → human review in admin → decision → sanction ladder → user notified → appeal (V1)
```

### 18.2 What automation may and may not decide
| Automation MAY | Automation MUST NOT |
|---|---|
| Reject content matching blocked-term lists | Suspend or ban an account |
| Hide content pending review | Permanently delete content |
| Apply rate limits and short cool-downs (≤ 1h posting pause for velocity spam) | Reveal or look up identity |
| Open and prioritize cases, alert admins | Decide appeals |
| Restrict new-account capabilities (links, images, DM volume) | Act on political/religious/legal judgments without a human |

### 18.3 Actions & ladder
| Action | Effect | Who |
|---|---|---|
| Warning | Notice to the user + counts toward the ladder | Moderator |
| Remove content | status REMOVED, author notified with reason code | Moderator |
| Restriction (1–7 days) | No posting links/images, DMs to existing conversations only, lower rate limits (status RESTRICTED) | Moderator |
| Suspension (1–30 days) | Read-only / login blocked with notice (SUSPENDED), sockets disconnected | Senior moderator |
| Permanent ban | BANNED, sessions revoked, email_hash to `banned_email_hashes` | Senior moderator (second approval for non-urgent) |
| Appeal (V1) | One appeal per sanction via in-app form → reviewed by a different moderator | — |

Report handling: reports aggregate into one open **case per target**. Priority = f(reason severity, reporter count, reporter reliability (the share of past reports actioned), risk score). Threshold auto-hide at 3 weighted reports. Report abuse (a pile of false reports) lowers reporter reliability and is rate-limited (10/day).

### 18.4 DM privacy stance
DMs are **not** routinely sent to third-party AI. Sync rules apply to all messages. AI scanning applies only to (a) accounts < 7 days old or RESTRICTED, (b) conversations with an open report, (c) images (all). This is disclosed in the privacy policy. Messages are never read by admins unless attached to a report snapshot (§19).

### 18.5 Threat-specific handling
- **Threats/self-harm:** urgent queue, show self-harm resources to the user in-app, documented escalation.
- **Sexual content involving minors:** immediate removal, evidence preservation per legal advice, and reporting to the appropriate authority. The procedure must be written before launch.
- **Doxxing:** personal-data pattern detection + DOXXING report reason at high priority.
- **Impersonation:** no free-text names. Org accounts verified.
- **Scams:** link checks + scam heuristics + new-account link restriction.
- **Malicious links:** Safe Browsing + denylist + tap-through interstitial ("You're leaving the app") for external links.

---

## 19. Admin Architecture

- **App:** `apps/admin` (Next.js App Router, JS) on Vercel at `admin.<domain>`, calling `api.<domain>/api/v1/admin/*`.
- **Auth:** separate `admin_users` (never a student account), argon2id password + **mandatory TOTP**, session cookie `httpOnly; Secure; SameSite=Strict; Domain=.<domain>`, 8h expiry, CSRF double-submit token on mutations, login rate limit + lockout, optional IP allowlist in prod (V1). The admin API is a separate router with its own middleware stack.
- **Roles (RBAC):**

| Capability | MODERATOR | SENIOR_MODERATOR | SUPER_ADMIN |
|---|---|---|---|
| View case queue, content snapshots, pseudonymous user history | ✓ | ✓ | ✓ |
| Warn, remove/restore content, restrict | ✓ | ✓ | ✓ |
| Suspend, ban, revoke sanctions | — | ✓ | ✓ |
| Request identity access (break-glass) | — | ✓ (needs approval) | ✓ (needs a second admin's approval) |
| Manage admins, universities, domains, rule lists | — | — | ✓ |
| View audit logs | own | all | all |

- **MVP screens:** Login/TOTP → Case queue (filters: status, priority, reason) → Case detail (snapshot, all reports with reporter **reliability, not identity**, AI decision labels, target's pseudonymous record: account age, prior sanctions, recent content count) → Action panel (reason code + note required) → Users (search by pseudonym/public_id) → User detail (sanctions, content list) → Audit log. V1 adds a dashboard (plan §82 metrics), rule-list editor, appeals, universities/domains, and a system page (queue health).
- **What admins must NOT casually see:** emails and identity (break-glass only), full DM histories (only report snapshots), reporter identities (hidden from MODERATOR), device tokens, IPs.
- **Break-glass identity access:** request (case link + justification) → second admin approves → a time-boxed (1h) view of the email only → `admin_audit_logs` + `identity_access_grants.accessed_at` → a weekly review of all grants. Used only for legal requests, credible threats and ban-evasion investigations.

---

## 20. Security Architecture

| Threat | Mitigation |
|---|---|
| Account enumeration | A single OTP flow for signup and login. Generic responses. Banned emails get the same response. Timing roughly equalized (async email job). |
| OTP brute force | 6 digits, 10 min expiry, 5 attempts/challenge, 5 challenges/hour/email, IP-hash limits, constant-time compare, HMAC-hashed codes. |
| Token theft | Short access TTL, rotating refresh with reuse detection → family revoke, SecureStore, TLS only, tokens never logged. |
| IDOR/BOLA | Every lookup goes through service policies + university scoping. **404 for "not yours"**. Automated authorization-matrix tests per endpoint (unauth / other user / other university / suspended / admin-only). |
| Privilege escalation | Student JWTs can't reach `/admin` (different auth mechanism entirely). Admin roles checked per route. `role` never accepted from the client. Mass-assignment prevented by `.strict()` Zod schemas. |
| SQL injection | Prisma parameterization. Raw SQL only through tagged templates (`$queryRaw\`\``), never `$queryRawUnsafe`, enforced by a lint rule. |
| XSS | Mobile renders text as Text nodes (no WebView HTML). Admin (React) escapes by default. `dangerouslySetInnerHTML` banned by lint. Content stored raw, never HTML. CSP on admin. |
| CSRF | Mobile uses bearer tokens (not cookies), so CSRF doesn't apply. Admin cookie uses SameSite=Strict + CSRF tokens. |
| WebSocket abuse | Handshake JWT auth, per-event schema validation, per-socket and per-user limits, max payload size (`maxHttpBufferSize` 64KB), membership check per event, disconnect on revoke. |
| File upload abuse | Presigned size-bound PUTs, magic-number sniffing, sharp re-encode (neutralizes polyglots), decompression-bomb pixel limits, no SVG, private bucket, orphan cleanup, known-bad hash list. |
| Secrets | Host secret managers / GitHub Environments. `.env` git-ignored. gitleaks in CI. Separate secrets per environment. Rotation documented (JWT `kid`, email pepper **cannot** rotate without re-hashing, so it is stored securely and backed up). |
| Logging leaks | pino redaction, no message bodies, Sentry scrubbing, hashed user IDs in logs. |
| Database security | Private networking where the host supports it, TLS connections, least-privilege DB users (app user vs migration user), no public admin tools, encrypted backups (provider). |
| Backups | Provider PITR (point-in-time recovery). A weekly logical dump to a separate R2 bucket (encrypted). A **quarterly restore drill** (plan §105). |
| Cross-university access | `universityId` comes from the JWT/session only. Every tenant query is scoped. Tests for cross-university reads/writes. |
| Admin compromise | TOTP mandatory, short sessions, audit logs, break-glass dual control, alerts on bulk actions. |
| Abuse at scale | New-account limits, velocity rules, identical-content detection, ban stickiness via email_hash, report weighting. |
| Dependency supply chain | Lockfile committed, `pnpm audit` in CI, Renovate/Dependabot weekly, minimal dependencies. |
| API hardening | helmet, strict CORS allow-list (admin origin; the mobile app has no origin), body size 100KB (JSON), HTTPS only, HSTS, request timeouts. |

---

## 21. Performance Architecture

| Layer | MVP (do now) | Later (at scale) |
|---|---|---|
| Mobile rendering | FlashList for the feed/chat/comments, memoized row components (`React.memo`, stable callbacks), `estimatedItemSize`, skeletons | Query persistence, prefetching next pages, Hermes profiling |
| Images | Client resize, WebP variants, expo-image disk cache with a stable `cacheKey`, thumbnails in lists | CDN edge caching with token validation |
| Network | 20 items/page, `staleTime` tuned, no polling (socket for chat), gzip | HTTP/2 via host, ETags for meta endpoints |
| Bundle | Only needed Expo modules, no heavy UI kits, tree-shakable icon set | — |
| DB | Indexes in §8, keyset pagination, explicit selects, transactions short, `EXPLAIN ANALYZE` on feed/chat queries in Phase 12 | Read replica for feed/search, `messages` partitioning, materialized trending |
| Connections | Prisma `connection_limit` sized per instance (e.g., 10) | PgBouncer/Neon pooler (transaction mode) |
| Background | Everything slow goes to the worker | Separate worker instances per queue |
| Realtime | Single instance, per-user rooms | Redis adapter + sticky sessions (host load balancer), dedicated realtime service |
| Load testing | k6 in Phase 12: 500 virtual users on feed + 200 concurrent sockets on staging | Scheduled load tests before each university onboarding |

---

## 22. Testing Strategy

### 22.1 Tooling & layers
| Layer | Tool | Scope |
|---|---|---|
| Shared | Vitest | Schema edge cases, limits |
| Server unit | Vitest | Services with fake repositories: policies, scoring, moderation rules, OTP logic, name generation |
| Server integration | Vitest + Supertest + **real Postgres/Redis** (docker compose locally, GitHub Actions service containers in CI) | Every endpoint: happy path + validation + authz matrix. The DB is reset per file via transactions/truncate. |
| Socket | Vitest + socket.io-client against an in-process server | Auth handshake, membership, idempotency, ordering, receipts, block enforcement, disconnect on ban |
| Worker | Vitest | Job processors with MinIO/Mailpit, including the media pipeline with real sample files (EXIF-laden JPEG, polyglot, oversize) |
| Security | Dedicated `tests/security/*` | Leak crawler, IDOR matrix, token misuse (expired/tampered/wrong `typ`/revoked), rate-limit enforcement, malicious uploads, admin access with a student token |
| Mobile unit/component | Jest (`jest-expo`) + React Native Testing Library + MSW for API mocking | Components (PostCard states), hooks (optimistic like rollback), auth store transitions, API client refresh single-flight |
| Mobile navigation | expo-router testing utilities (`renderRouter`) | Guards: unauthenticated → auth group, onboarding redirects, deep link while logged out |
| Mobile E2E | **Maestro** flows on an Android emulator against local/staging | Critical flows (below) |
| Admin | Vitest + React Testing Library; Playwright in V1 | Login+TOTP, case action |
| Load | k6 | Phase 12 |

### 22.2 Critical E2E flows (Maestro), each added in the phase that builds it
signup/verification (OTP read from Mailpit API in test env) → onboarding identity → create post → feed shows post → like/comment → second test user receives notification row → message request → accept → chat send/receive → image upload → report → block (content disappears) → account deletion.

### 22.3 Per-phase rule
Every phase in §28 lists **WHAT TO BUILD → WHAT TO TEST → HOW → DEFINITION OF DONE**. A phase isn't done until its tests run in CI and pass, the authz matrix covers all its new endpoints, and the leak test covers its new DTOs.

---

## 23. CI/CD & DevOps

### 23.1 Environments
| Env | What | Data | Deploy trigger |
|---|---|---|---|
| Local | `docker compose up` → Postgres, Redis, MinIO, Mailpit. Server + worker via `pnpm dev`. Expo dev build on device/emulator pointing to LAN IP. | Seeded fake data | — |
| Staging (dev + staging merged, for a 3-person team) | Same topology as prod at the smallest size: separate DB, Redis, R2 bucket, email sandbox, Expo `preview` channel | Seed + test users; **never real student data** | Auto on merge to `main` |
| Production | API + worker (Singapore), managed PG with PITR, Redis, R2, Sentry, uptime | Real | Manual: Git tag `vX.Y.Z` + approval in GitHub Environments |

### 23.2 Pipelines
**Every PR (required checks):** pnpm install (cached) → ESLint + Prettier check → `tsc --noEmit` JSDoc type check (all workspaces) → shared tests → server unit + integration + security tests (service containers: postgres, redis, minio) → **Prisma migration drift check** (`prisma migrate diff` vs migrations folder) → mobile Jest + `expo-doctor` → admin build → gitleaks → `pnpm audit --prod` (warn) → PR size/label check.

**Merge to main:** build server Docker image → run `prisma migrate deploy` on staging → deploy API + worker to staging → smoke test (`/health`, `/ready`, OTP request against the sandbox) → `eas update --channel preview` (JS-only changes) → notify.

**Release:** tag → build image → migrate prod (expand-only migrations) → deploy → smoke → EAS build (production) → submit to Play internal/closed track. Native changes require a new EAS build; JS-only fixes can ship through EAS Update to the production channel (with runtime version policy).

**Rollback:** redeploy the previous image (host one-click). Migrations follow **expand → migrate → contract** across two releases so the previous app version still works. `eas update:rollback` for OTA. The DB restores from PITR as a last resort.

**Docker:** a server Dockerfile (multi-stage, node:lts-slim, non-root) used by both API and worker (different start command). Compose for local only. No Kubernetes.

**Monitoring:** Sentry (errors + performance) on all three apps. Uptime checks on `/health` and admin. Alerts: 5xx rate, p95 latency, queue backlog > threshold (worker exports queue counts to logs → alert), failed email rate, DB CPU/connections, Redis memory.

---

## 24. Git / Team Workflow

- **Trunk-based** (D14): `main` is protected and always deployable to staging. Short-lived branches `feat/<issue#>-slug`, `fix/…`, `chore/…`, `docs/…`, merged within 1–3 days.
- **PRs:** at least one approval. Required CI green. **Squash merge**. PR template: what/why, screenshots for UI, "API contract changed?" and "migration included?" checkboxes, security impact.
- **Commits:** Conventional Commits (`feat(chat): add message requests`). The squash title follows the convention.
- **Issue tracking:** GitHub Issues + a Projects board (Backlog → Ready → In progress → Review → Done), one issue per vertical slice, labels by phase and area.
- **CODEOWNERS:** `packages/shared/**` and `apps/server/prisma/**` need review from **both** the backend and mobile owners, because contract and schema changes affect everyone.
- **Suggested lanes** (adjust to actual strengths):
  - **Ali Talha:** backend core + auth + chat/realtime + infrastructure.
  - **Moeed Amir:** mobile app, design system, feed/chat UI, E2E flows.
  - **Rayan Ali:** database schema, safety/moderation, admin app, testing/CI.
  - The architecture lead role (reviewing contract/schema PRs) rotates or sits with one person.
- **Avoiding breaking each other's work:**
  1. **Contract first:** shared schema PR merged before the backend/mobile implementation PRs.
  2. **One migration in flight:** only one open PR may contain a Prisma migration at a time (rebase and regenerate before merge). Announce it in the team channel.
  3. Feature flags (`universities.settings.features`) to merge incomplete features dark.
  4. The mobile app uses MSW mocks built from shared schemas when the backend isn't ready.
  5. A daily 10-minute sync on blockers and contracts.

---

## 25. Multi-Agent Claude Code Strategy

- **Phases 0–4: single agent, sequential.** The foundation, auth and identity define conventions (layering, presenters, error codes, test harness) that every later module copies. Parallel agents here would invent conflicting patterns.
- **From Phase 5 onward, agents become useful** once `docs/conventions.md`, the shared contract package and one reference module (`profiles`) exist.

| Agent | Can run in parallel? | Owns | Coordinates via |
|---|---|---|---|
| Lead/architect (you + main Claude session) | — | `docs/`, `packages/shared/`, `prisma/schema.prisma` | Writes the phase contract first. Reviews every PR. |
| Backend/API | Yes, parallel with mobile after the contract is merged | `apps/server/src/modules/<feature>`, `realtime/` | Implements the shared schemas. No schema edits without the lead. |
| Mobile | Yes, parallel with backend | `apps/mobile/**` | Consumes the shared schemas. MSW mocks until the API is ready. |
| Database/Prisma | **Sequential**: before backend each phase | `prisma/`, migrations, seeds | One migration per phase, reviewed by the lead |
| Testing/QA | After each implementation PR (can parallel next feature) | `tests/security`, Maestro flows | Reads the contract + endpoints list |
| Security review | At the end of each phase (read-only) | none (reports findings) | Uses the `/security-review` checklist from §20 |
| Admin | Parallel lane from Phase 6 | `apps/admin/**`, `modules/admin/**` | Consumes the admin contracts |
| DevOps | Phase 0 and Phase 12 mainly | `.github/`, Dockerfile, compose | — |
| UI/UX, Documentation | Folded into the mobile agent and the lead | — | Separate agents add overhead without benefit here |

**Workflow per phase:** lead writes contract (shared schemas + endpoint list + migration) → merge → backend and mobile agents in separate **git worktrees** → QA agent adds security/E2E tests → security review agent → lead reviews and integrates. Conflicts are avoided because each agent has disjoint file ownership and shared files are lead-only.

---

## 26. API / Data Contracts (contract-first)

```
Mobile / Admin  ⇄  @campus/shared (Zod schemas, enums, error codes, limits, socket events)  ⇄  Server  ⇄  Prisma schema
```
- **`packages/shared/src/`:** `schemas/{auth,profile,post,comment,media,chat,report,block,notification,admin,common}.js` (request + response DTO schemas), `enums.js`, `errors.js`, `limits.js`, `socketEvents.js` (event names + payload schemas), `pagination.js`, `index.js`. JSDoc typedefs generated as a `.d.ts` via `tsc --declaration --allowJs --emitDeclarationOnly` (build step), so mobile/admin get editor types.
- **Envelope** (plan §58): success `{success:true, data, meta?}`, error `{success:false, error:{code, message, details?, requestId}}`. Pagination `data: {items, nextCursor, hasMore}`.
- **Change rules:** additive changes (new optional field, new endpoint) are fine anytime. **Breaking changes** need a new field name or `/v2` route, the old one kept until the minimum app version passes it, and `minAppVersion` bumped. Enum additions: the client must render unknown values gracefully (default branch).
- **Docs:** generate an OpenAPI document from the Zod schemas (`zod-to-openapi`) in V1 for admin/debugging. The shared schemas are the source.

### MVP endpoint list (`/api/v1`)
```
Health:   GET /health · GET /ready
Auth:     POST /auth/otp/request · POST /auth/otp/verify · POST /auth/refresh · POST /auth/logout
Self:     GET /me · DELETE /me · POST /me/cancel-deletion · GET/PATCH /me/settings
Profile:  GET /me/profile/options (3 generated names) · POST /me/profile · PATCH /me/profile
          POST /me/profile/rename · PUT /me/interests · GET /profiles/:publicId
Meta:     GET /meta/interests · GET /meta/departments · GET /meta/app-config (minAppVersion, flags, limits)
Posts:    GET /posts · POST /posts · GET /posts/:id · DELETE /posts/:id · PUT|DELETE /posts/:id/like
Comments: GET /posts/:id/comments · POST /posts/:id/comments · DELETE /comments/:id
Media:    POST /media/uploads · POST /media/:id/complete · GET /media/:id (fresh signed URLs)
Chat:     GET /conversations?box=inbox|requests · POST /conversations · GET /conversations/:id
          POST /conversations/:id/accept · POST /conversations/:id/decline · PATCH /conversations/:id (mute/hide)
          GET /conversations/:id/messages?before|after · POST /conversations/:id/messages · POST /conversations/:id/read
          DELETE /messages/:id
Safety:   POST /reports · GET /blocks · POST /blocks · DELETE /blocks/:publicId
Notif:    GET /notifications · POST /notifications/read · POST /devices · DELETE /devices/:token
Admin:    POST /admin/auth/login · POST /admin/auth/totp · POST /admin/auth/logout · GET /admin/me
          GET /admin/cases · GET /admin/cases/:id · POST /admin/cases/:id/assign · POST /admin/cases/:id/actions
          GET /admin/users?q= · GET /admin/users/:publicId · POST /admin/users/:publicId/sanctions
          POST /admin/sanctions/:id/revoke · POST /admin/content/:type/:id/remove|restore
          GET /admin/audit-logs · POST /admin/identity-access · POST /admin/identity-access/:id/approve · GET /admin/identity-access/:id
```

### Socket events (namespace `/`, all payloads validated by shared schemas)
```
C→S: message:send(ack) · message:delivered · conversation:read · typing:start · typing:stop · conversation:viewing
S→C: message:new · message:deleted · receipt:update · typing · conversation:request · conversation:updated
     notification:new · session:revoked · auth:expired
V1:  presence:update · message:reaction
```

---

## 27. MVP / V1 / V1.5 / V2 / Future Scope

| Stage | Feature | Why here | Depends on | Effort | Value | Scaling note |
|---|---|---|---|---|---|---|
| **MVP** | Email OTP verification, sessions, logout | Gatekeeper for "verified community" | — | M | Critical | Email cost grows with logins; long sessions reduce it |
| MVP | Pseudonym + generated avatar, dept/semester, interests, privacy toggles | Core identity | Auth | S | Critical | — |
| MVP | Feed (Recent/Trending/Top, 4 categories, flairs), posts ≤ 4 images, flat comments, likes, delete own | Core content loop | Identity, safety primitives, media | M | Critical | Indexes + hot score job |
| MVP | 1-to-1 chat with message requests, text/emoji/images, read receipts, typing, delete, mute | Core connection loop | Identity, safety, media, realtime | L | Critical | Socket scaling at 10k |
| MVP | Block, report, account states, sanctions | Safety + store requirement | Identity | M | Critical | Report volume = ops cost |
| MVP | Rules + async AI moderation (text/images) | Abuse control | Queue | M | Critical | AI cost per item |
| MVP | Push (message, request, comment) + in-app notification list + deep links | Retention | Chat, feed | M | High | Free |
| MVP | Minimal admin (cases, sanctions, audit, break-glass) | Operate safely | Safety | M | Critical | Staffing |
| MVP | Account deletion, legal screens, guidelines acceptance | Store/legal requirement | Auth | S | Required | — |
| **V1** | Saves, comment replies + likes, chat replies/reactions, PDF sharing, presence (opt-in), read-receipt toggle, logout all devices, appeals | Engagement polish from beta feedback | MVP | M | Medium | Small |
| V1 | Skills + "looking for" on profile, profile bio (moderated) | Prerequisite for matching/networking | Identity | S | High | — |
| V1 | Search: posts (PG full-text) + profiles by pseudonym (discoverable only) | Discovery as content grows | Feed | M | Medium | Search engine at 100k |
| V1 | iOS release, App Links/Universal Links, admin dashboard metrics | Reach + ops | MVP | M | High | — |
| **V1.5** | Find Someone (rule-based matching) | Plan's discovery pillar | Skills, interests, chat requests | M | High | SQL cost bounded by pool |
| V1.5 | Communities (incl. academic, seeded) + community mods | Organize content once volume exists | Feed | M | High | Per-community feeds |
| V1.5 | Study partner & FYP listings | High-utility, differentiating | Matching, communities optional | M | High | — |
| V1.5 | Lost & Found | Campus utility | Feed, media | S | Medium | — |
| V1.5 | Mutual identity reveal (reveal cards) | Trust bridge; risky, so after moderation is proven | Chat, audit | S–M | Medium | — |
| **V2** | Verified organizations/societies, events + RSVP + reminders, career section + opportunity posts, multi-university onboarding (admin tooling, per-university moderators) | Needs org verification ops + adoption | Communities, notifications | L | High | Tenancy already in schema |
| V2 | Outbox pattern, RLS defense-in-depth, Redis split, CDN token edge | Scale/robustness | — | M | — | Needed ~10k+ |
| **Future** | AI campus assistant (RAG on verified university info), ML recommendations/re-ranking, voice messages, video, polls, web client, verified employers, premium features | Only after adoption + data | Everything | XL | Speculative | LLM/transcoding costs |

---

## 28. Exact Development Phases

Dependency graph:
```
P0 Repo/tooling ─┬─► P1 Backend foundation ─┐
                 └─► P2 Mobile foundation ──┴─► P3 Auth ─► P4 Identity/Profile ─► P5 Safety primitives
                                                                                        │
                        ┌───────────────────────────────────────────────────────────────┘
                        ▼
                  P6 Feed (+worker) ─► P7 Media ─► P8 Chat ─► P9 Notifications ─┐
                        │                                                       ├─► P11 Lifecycle/compliance ─► P12 Hardening ─► CLOSED BETA
                        └──► (parallel lane from P6) P10 Moderation automation + Admin MVP ─┘
Post-MVP: P13 V1 polish ─► P14 Skills+Search+Matching ─► P15 Communities ─► P16 Study/FYP ─► P17 Lost&Found ─► P18 Reveal ─► P19 Orgs/Events/Career ─► P20 Multi-university/scale
```
Why this order: auth gates everything. Identity must exist before any content (every row points to a persona). Safety primitives (block/report/account state/rules) must exist **before** feed and chat, because every feed/chat query filters blocks and every write calls moderation. Media comes before chat so chat ships with images and reuses a pipeline already proven on posts. Notifications need both comment and message events. Admin can run in parallel once reports and cases exist. Compliance and hardening gate real users.

---

### P0 — Repository & tooling foundation
- **Objective:** a working monorepo skeleton everyone can clone and run with one command. No product features.
- **Build:** pnpm workspaces (`apps/mobile`, `apps/server`, `apps/admin` placeholder, `packages/shared`, `packages/config`), `.nvmrc` (Node LTS), `.npmrc` (`node-linker=hoisted` for React Native compatibility; re-check against current Expo monorepo docs), root scripts (`dev`, `lint`, `typecheck`, `test`, `format`), ESLint flat config + Prettier in `packages/config`, base `jsconfig` with `checkJs`, `docker-compose.yml` (postgres:16, redis:7, minio, mailpit), `.env.example` files, `.gitignore`, `.editorconfig`, GitHub Actions `ci.yml` (lint + typecheck + shared tests), PR template, CODEOWNERS, `docs/` (architecture.md from this plan, `adr/0001-…` for major decisions, conventions.md), `packages/shared` skeleton (enums, error codes, limits, envelope/pagination schemas + tests).
- **Test:** `pnpm lint`, `pnpm typecheck`, `pnpm test` pass locally and in CI. `docker compose up` gives healthy services.
- **Security:** gitleaks in CI, no secrets in the repo, `.env` ignored.
- **DoD:** fresh clone → `pnpm i && docker compose up -d && pnpm test` is green. CI is green on a PR.
- **Not yet:** Expo app, Express app, Prisma, any feature.

### P1 — Backend foundation (can run in parallel with P2)
- **Objective:** a production-shaped Express app with all cross-cutting infrastructure and no features.
- **Build:** `app.js`/`server.js`, `config/env.js` (Zod), `lib/` (prisma, redis, logger with redaction, crypto helpers), middleware (requestId, validate, errorHandler, notFound, rateLimit scaffolding, security headers, CORS, body limits), response envelope helpers, `GET /health` + `GET /ready` (DB + Redis ping), Prisma init with the first models (`universities`, `university_domains`, `departments`, `interests`), seed script (target university + domain + departments + interests), test harness (testApp, DB reset, factories), server Dockerfile, graceful shutdown.
- **DB:** first migration (tenancy + meta tables). UUIDv7 approach verified.
- **Endpoints:** `/health`, `/ready`, `GET /meta/interests`, `GET /meta/departments` (public, until auth arrives in P3).
- **Tests:** integration for health/ready/meta, errorHandler (no stack traces in prod mode), validation error shape, env validation failure.
- **Security/perf:** helmet, CORS allow-list, 100KB body limit, log redaction unit test.
- **DoD:** `pnpm --filter server dev` runs. CI runs integration tests against service containers. Docker image builds.
- **Not yet:** auth, users, sockets, worker, storage.

### P2 — Mobile foundation (parallel with P1)
- **Objective:** an Expo app shell with navigation, the design system and infrastructure, running as a **dev build** on Android.
- **Build:** Expo app (latest SDK) with Expo Router, `app.config.js` variants, `eas.json`, route groups `(auth)`, `(onboarding)`, `(app)/(tabs)` with **stub screens** and guards driven by the `session` store (hard-coded to `unauthenticated` for now; no fake auth logic), theme tokens light/dark/system, core UI components (Button, Input, Text, Screen, EmptyState, ErrorState, Skeleton, AnonymousAvatar), `lib/api/client.js` (Axios, envelope parsing, error normalization; refresh logic stubbed behind an interface), `lib/query/client.js`, NetInfo online manager + OfflineBanner, `config/env.js`, Jest + React Native Testing Library setup, a Meta screen calling `GET /meta/interests` as an end-to-end smoke test.
- **Tests:** component tests for the UI kit states, navigation guard tests, API client error normalization tests.
- **DoD:** the dev build installs on an Android device, navigates the stubs, and shows interests fetched from the local server over LAN. Lint, typecheck and Jest run in CI.
- **Not yet:** login, SecureStore tokens, sockets, push.

### P3 — Authentication & university verification
- **Objective:** a real student verifies their university email and gets a persistent session.
- **DB:** `users`, `user_identities`, `verification_challenges`, `sessions`, `banned_email_hashes`, `user_settings`.
- **Backend:** auth module (§11.2–11.3), email normalization/domain check, HMAC hashing, AES-GCM encryption, mailer (Mailpit locally, provider on staging), **BullMQ introduced here for `email.send`** plus `worker.js`, authenticate middleware, requireAccountState (Redis cached), rate limits for OTP, `GET /me` (private self DTO with masked email), logout, refresh rotation + reuse detection, minAppVersion middleware + `GET /meta/app-config`.
- **Mobile:** welcome/email/verify screens with loading/error states (invalid domain, rate limited with countdown, wrong code, expired), SecureStore token storage, real refresh single-flight interceptor, session bootstrap on launch, guards now live, logout in a temporary profile tab.
- **Endpoints:** `/auth/otp/request`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout`, `/me`, `/meta/app-config`.
- **Tests:** OTP expiry/attempts/cooldown, generic responses (no enumeration), refresh rotation + reuse detection revokes the family, a tampered/expired/wrong-typ JWT → 401, suspended user → 403, email never in logs (log capture test), mobile auth store transitions + interceptor tests, Maestro: signup flow (reads OTP from the Mailpit API).
- **Security:** code never logged, constant-time compare, per-IP and per-email limits.
- **Critical check:** send real OTP emails from staging to **real university inboxes** and confirm they arrive in the inbox rather than spam (SPF/DKIM/DMARC on your sending domain).
- **DoD:** fresh install → verify with a real university email → kill app → reopen still logged in → logout works. All tests green.
- **Not yet:** profile, posts.

### P4 — Anonymous identity, profile & privacy settings
- **DB:** `anonymous_profiles`, `profile_name_history`, `profile_interests`. `users.onboarded_at`.
- **Backend:** profiles module: name generator (3 options, uniqueness retry), create/patch profile, rename (30-day rule), interests, public profile endpoint, **presenter + response-schema enforcement + lint rule** (§11.5), settings endpoints, `requireOnboarded` middleware.
- **Mobile:** onboarding guidelines (18+ confirmation, "hidden from other students" explainer, stable-pseudonym disclosure) → identity picker → department/semester/interests → Profile tab (own persona, edit, privacy toggles), `profile/[publicId]` screen.
- **Tests:** **leak test harness introduced** (user B fetches A's profile, asserting no email/user ID/hash), show_* flags respected, rename cooldown, uniqueness collision, onboarding guard, authz matrix for profile endpoints.
- **DoD:** "Ali → Anonymous Fox #2841" end to end, with the public API returning only anonymous fields.
- **Not yet:** skills, bio, looking-for (V1), discovery.

### P5 — Safety primitives (before any user-generated content)
- **DB:** `blocks`, `reports`, `moderation_cases`, `moderation_decisions`, `user_sanctions`, `rule_lists` (seeded).
- **Backend:** safety module (block/unblock/list; reports with snapshots via a pluggable `snapshotProvider` per target type, and case upsert + priority), `moderation.preCheck` rules engine (terms EN/Urdu/Roman Urdu, personal-data patterns, link policy) as a pure, heavily unit-tested function, sanctions service (apply/revoke → status update → Redis `acct:` invalidation → socket disconnect hook stub), a shared `blockFilter` SQL helper for repositories, new-account capability helper.
- **Mobile:** ReportSheet component (reasons, details, context disclosure), block confirmation, Settings → Blocked users.
- **Tests:** rules engine table tests, block symmetry, report dedupe per reporter, case aggregation, suspended users rejected everywhere (middleware test), sanction expiry.
- **DoD:** you can block/report a profile, a case appears in the DB, and the rules engine is ready for feed/chat to call.
- **Not yet:** AI moderation, admin UI (inspect via DB/Prisma Studio in dev).

### P6 — Feed: posts, comments, likes (+ worker jobs)
- **DB:** `posts`, `comments`, `post_likes` with the §8 indexes.
- **Backend:** posts + comments modules (§12), keyset cursors, hot-score repeatable job, block filtering, preCheck hook, `moderation.scan` job **stub** (records a decision as ALLOW; real provider in P10), report snapshot providers for post/comment, auto-hide at the report threshold, the `analytics_events` writer.
- **Mobile:** Home feed (category chips, sort toggle, FlashList, pull-to-refresh, infinite scroll, skeleton/empty/error), PostCard (flair label, "under review" state), composer modal (category + flair + char counter), post detail with comments, optimistic like/comment, delete own, report/block from the post menu.
- **Tests:** CRUD + ownership, cross-university invisibility, blocked author invisibility (both directions), pagination stability (no duplicates or gaps with concurrent inserts), like idempotency + counts under concurrency, rate limits/new-account limits, rules rejection surfaced, Maestro: create post → appears → like → comment.
- **Perf:** `EXPLAIN` the feed queries against 50k seeded posts (a seed script generates them).
- **DoD:** a real anonymous campus feed works end to end on device, with the authz matrix and leak tests extended.
- **Not yet:** images on posts (P7), notifications (P9), communities.

### P7 — Media pipeline (post images first)
- **DB:** `media_objects`, `post_media`.
- **Backend:** media module (presign/complete/get), `lib/storage.js` (MinIO locally, R2 on staging), `media.process` worker with sharp (sniff, strip metadata, variants, hashes), image moderation hook (stub → real in P10), orphan cleanup job, signed GET issuance in presenters with access checks.
- **Mobile:** image picker (permission flow), client resize/re-encode, upload progress, multi-image composer (≤ 4), image grid in PostCard, full-screen viewer, expo-image with `cacheKey`.
- **Tests:** EXIF/GPS removed (a fixture with GPS → output has none), polyglot/oversize/SVG/wrong-magic rejected, cannot attach another user's media, cannot reuse media across posts, signed URL denied for another university, orphan cleanup removes pending objects.
- **DoD:** Rayan posts a photo from the phone, and teammates see it with no metadata leaked.
- **Not yet:** PDFs, chat images (P8 reuses this).

### P8 — Anonymous 1-to-1 chat
- **DB:** `conversations`, `conversation_members`, `messages`.
- **Backend:** chat module (§13) + `realtime/` (io.js auth middleware, user rooms, chat handlers, `emit.js`), REST endpoints incl. the fallback send, message requests + initiator limits, receipts, typing relay, delete-for-everyone, mute/hide, block enforcement, identical-message spam detector, sanction → `disconnectSockets` wiring, report snapshot with prior-context messages.
- **Mobile:** Chats tab (Inbox / Requests), chat screen (inverted FlashList, bubbles for text/image/system, pending/failed states, receipts ticks, typing indicator, image send once active), socket client lifecycle (connect on ready, refresh-and-reconnect on `auth:expired`, gap fill on reconnect, Reconnecting banner), "Message" entry points from post/comment/profile, accept/decline UI, mute/report/block menu.
- **Tests:** socket auth (no/expired/revoked token), non-member cannot send/read (REST + socket), block either direction blocks send/typing, idempotent resend returns the same message, ordering under concurrent sends, request limits enforced, images rejected before acceptance, ban disconnects sockets, gap-fill correctness, Maestro: two emulators/users exchange messages (or one device + an API-driven second user).
- **DoD:** fully functional anonymous messaging between two phones, with reconnect and images.
- **Not yet:** replies, reactions, PDFs, presence (V1).

### P9 — Notifications
- **DB:** `notifications`, `device_tokens` (+ `user_settings.notification_prefs`, `push_preview`).
- **Backend:** notifications service (`notify()`), `push.send` worker using expo-server-sdk (chunking, receipts polling job, disable invalid tokens), collapse via Redis, suppression when `viewing:` or muted, preferences, in-app list + mark-read, `notification:new` socket event.
- **Mobile:** permission prompt at the right moment, token registration/refresh, notification center screen, unread badge, tap → deep link routing (cold start + warm), settings toggles, push preview preference.
- **Tests:** notify on comment (not self, not blocked), message push suppressed while viewing, invalid token disabled, deep-link routing unit tests, privacy (no message body when preview = NONE).
- **DoD:** a phone in the pocket gets "Anonymous Panda sent you a message" and a tap opens the chat.
- **Not yet:** match/community/event notification types.

### P10 — Moderation automation + Admin MVP (parallel lane starting after P6)
- **Backend:** real `moderation.scan` provider adapter (text + image) behind a `ModerationProvider` interface, evaluated on a labeled sample set incl. Urdu/Roman Urdu before choosing. Safe Browsing link checks. The risk → action matrix. Admin module: admin auth (argon2id + TOTP + cookie + CSRF), RBAC middleware, cases/users/sanctions/content/audit endpoints, break-glass flow, audit writes in the same transaction. A script to create the first SUPER_ADMIN (no signup endpoint).
- **Admin app:** Next.js (App Router, JS). Login/TOTP, case queue, case detail, action panel, user search/detail, audit log.
- **Mobile:** "Under review" / "Removed" notices, moderation notifications, sanction screens (restricted banner, suspended blocking screen with end date).
- **Tests:** a student token can't reach admin, MODERATOR can't ban, every action writes audit, break-glass needs approval + expiry, action matrix unit tests, AI failure → fail-open to rules + case (never silently drop content), CSRF rejection.
- **DoD:** a report filed on the phone → appears in admin → moderator removes content + restricts user → user sees the notice → audit entry exists.
- **Not yet:** analytics dashboard, rule editor UI, appeals (V1).

### P11 — Account lifecycle, compliance & store readiness
- **Build:** account deletion (request/cancel/purge job per §11.7), data retention jobs (challenges 24h, deleted content 30d, sessions expired, analytics hash rotation), legal screens (Privacy Policy, Terms, Community Guidelines, Report & Appeal process, Data Retention), in-app support contact, Google Play account-deletion web URL page, Data Safety form answers, app icon/splash, onboarding copy review, external-link interstitial.
- **Tests:** purge job correctness (identity removed, ban hash kept when banned, messages anonymized), retention jobs, deletion cancel.
- **DoD:** meets Google Play UGC + account deletion policies (and Apple Guideline 1.2 for later iOS). Legal docs reviewed.

### P12 — Hardening & beta readiness
- **Build/check:** full security review against §20 (IDOR matrix complete, leak crawler over all endpoints, socket abuse tests, upload abuse), k6 load tests on staging, `EXPLAIN ANALYZE` review, Sentry + uptime + alerts live, backup restore drill completed, runbooks (incident response, moderation escalation, legal request handling, CSAM procedure), production environment provisioned, first production release, Play **closed testing** track.
- **DoD:** the launch readiness checklist in §30 is fully checked.

### Post-MVP phases (each gets its own detailed contract when it starts)
- **P13 V1 polish:** saves, comment replies/likes, chat replies/reactions, PDFs (+ file pipeline), opt-in presence, receipts toggle, logout-all, appeals, admin dashboard metrics + rule editor, iOS build, App/Universal Links.
- **P14 Skills + search + matching:** skills/looking-for/bio, PG full-text search (posts, communities later) + pseudonym search respecting `allow_discovery` and blocks, Find Someone (§14).
- **P15 Communities:** §15.
- **P16 Study/FYP listings:** `listings` + discovery + contact via requests.
- **P17 Lost & Found:** §16.
- **P18 Identity reveal:** request/accept/reject/cancel/expire state machine, reveal cards (encrypted, user-authored), blocked/deleted-user edge cases, audit (plan §128 tests).
- **P19 Organizations, events, career:** §16–17.
- **P20 Multi-university & scale:** university onboarding tooling, per-university moderator scoping, Redis split, socket adapter + multi-instance, outbox, RLS, search engine if needed.

---

## 29. End-to-End Feature Matrix (MVP)

| Feature | Screens | Key components | State | API | Server modules | Tables | Redis | Storage | Socket | Push | Key tests | Security |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Verification | welcome, email, verify | OtpInput, ResendTimer | session store, SecureStore | /auth/* | auth | users, user_identities, verification_challenges, sessions | rl:otp-*, otp:cooldown | — | — | — | expiry, attempts, enumeration, rotation | hashing, rate limits, no logs |
| Identity/profile | onboarding/*, profile tab, profile/[publicId], settings/privacy | IdentityPicker, InterestChips, AnonymousAvatar | Query: me, profile | /me/profile*, /profiles/:id, /meta/* | profiles, meta | anonymous_profiles, profile_interests, profile_name_history | meta cache | — | — | — | leak test, show_* flags | presenters, no free-text names |
| Feed/posts | home, post/new, post/[id] | PostCard, Composer, CategoryChips | infinite query per sort/category | /posts* | posts, moderation | posts, post_media, post_likes | rl:post | signed GETs | — | — | pagination, ownership, cross-uni, blocks | univ scoping, preCheck |
| Comments | post/[id] | CommentCard, CommentInput | infinite query | /posts/:id/comments, /comments/:id | comments | comments | rl:comment | — | — | NEW_COMMENT | not-self, blocked | preCheck |
| Likes | feed/detail | LikeButton | optimistic | PUT/DELETE like | posts | post_likes | — | — | — | — (V1 digest) | idempotency, concurrency | — |
| Media | composer, chat | ImagePickerButton, UploadProgress, ImageGrid | local upload state | /media/* | media (+worker) | media_objects | rl:upload | R2 incoming/media | — | — | EXIF, magic, ownership | private bucket, sniffing |
| Chat | chats, chat/[id] | ConversationRow, MessageBubble, Composer, RequestCard | Query + pending store + socket | /conversations*, /messages/:id | chat, realtime | conversations, conversation_members, messages | rl:msg, rl:conv-new, viewing:, pushc: | message images | message:*, typing, receipt:update, conversation:* | NEW_MESSAGE, MESSAGE_REQUEST | membership, idempotency, blocks, ban disconnect | server-derived sender, user rooms |
| Block | menus, settings/blocked | BlockConfirm | invalidate feed/chat queries | /blocks* | safety | blocks | (V1 blk:) | — | conversation:updated | stops | symmetry, feed/chat filters | server-side only |
| Report | report modal | ReportSheet | mutation | /reports | safety, moderation | reports, moderation_cases | rl:report | snapshot refs | — | MODERATION_NOTICE (outcome) | dedupe, threshold hide | reporter anonymity |
| Moderation | notices | ReviewBanner, SanctionScreen | me.status | — | moderation, sanctions (+worker) | moderation_decisions, user_sanctions, rule_lists | acct: | image scan | session:revoked | MODERATION_NOTICE | matrix, fail-open, AI never bans | — |
| Notifications | notifications, settings/notifications | NotificationRow, Badge | Query + socket | /notifications*, /devices* | notifications (+worker) | notifications, device_tokens, user_settings | pushc:, viewing: | — | notification:new | Expo Push | suppression, invalid tokens | preview privacy |
| Admin | admin web | CaseQueue, CaseDetail, ActionPanel | Next.js server components/fetch | /admin/* | admin/* | admin_*, identity_access_grants, all moderation tables | — | signed GETs (admin) | — | — | RBAC, audit, CSRF, break-glass | TOTP, SameSite, audit |
| Account deletion | settings/account | DeleteAccountFlow | session | DELETE /me | users (+worker purge) | users, all owned rows | acct: | media purge | session:revoked | — | purge correctness | retention/legal hold |

Post-MVP rows follow the same pattern and should be filled in each phase contract. The dependencies are listed in §27 and §28.

---

## 30. Real User Launch Readiness

**Progression:** local → internal (3 founders, staging) → team testing (≈10 trusted friends, Play internal track) → **closed beta (30 → 100 students, Play closed track, invite-only via a per-university feature flag + invite codes)** → university pilot (300 → 1000, open to the domain) → wider.

**Must be ready before any real student:** everything in P0–P12. Guidelines + privacy policy published. At least 2 people on the moderation rota with a **24h response target** (4h for URGENT). The CSAM/threat escalation procedure written. Backups verified by a restore drill. Sentry and alerts live. Support contact visible in-app. A decision on whether and how to approach the university administration (see Risks).

**Monitor:** API 5xx/latency, socket connection counts/errors, queue backlogs + failed jobs, email delivery/bounce rate, push receipt errors, DB CPU/connections/storage, R2 storage, moderation queue size + time-to-resolution.

**Product metrics (plan §46, §133), computed from our own DB/analytics_events:** verification completion rate, DAU/WAU/MAU, D1/D7/D30 retention, % of users who start ≥ 1 accepted conversation, posts and comments per active user, request acceptance rate, reports per 1000 users, time-to-action on reports.

**Logs needed:** request logs (redacted), security events (login failures, rate-limit hits, token reuse, admin actions, identity access), job outcomes.

**When reports increase:** tune priority weights, add volunteer student moderators as MODERATOR role (scoped, trained, audited), tighten new-account limits via settings, add terms to rule lists, enable stricter AI thresholds.

**When traffic increases:** scale the API vertically → 2 instances + Redis adapter + sticky sessions → a separate worker instance → pooler → read replica. Each step is a config/infra change, not a rewrite, because of the §2.4 decisions.

**Cost growth drivers:** DB storage (messages dominate: ~1 KB/message × volume), R2 storage (images ~300 KB for both variants), AI moderation calls (per post/comment/image + scoped DMs), email OTPs (one per login; long sessions keep this low), compute for sockets.

---

## 31. Risks

| Category | Risk | Impact | Likelihood | Mitigation | When |
|---|---|---|---|---|---|
| Moderation | Harassment, bullying or defamation of named students/teachers | Severe (harm, legal, shutdown) | **High** | D17 policy, flairs, message requests, rules + AI, fast human review, bans that stick | MVP |
| Legal | Local cybercrime/defamation law exposure (e.g., Pakistan's PECA as amended in 2025 and content-related laws); government/legal data requests | Severe | Medium | **Get legal advice before the pilot**, written takedown + legal-request procedure, data minimization (D8), retention policy | Before beta |
| Operational | University administration objects, or users think the app is officially affiliated | High | Medium | Don't use university logos/trademarks. "Independent student platform" disclaimer. Consider early outreach. | Before pilot |
| Privacy | De-anonymization through EXIF, writing style, activity timing, small departments (e.g., "5th semester Physics" = 3 people) | High | Medium | EXIF strip (twice), optional dept/semester, presence opt-in, k-anonymity warning when a department is small (V1), no public "last active" | MVP |
| Privacy | API leaking internal IDs/email | Severe | Medium without guards | Four locks (§11.5) + CI leak tests | P4+ |
| Security | Admin account compromise | Severe | Low–Med | TOTP, RBAC, break-glass dual control, audit, short sessions | P10 |
| Technical | Email OTP lands in spam or is blocked by university mail | Blocks signups | **Medium–High** | Early real-inbox testing (P3), authenticated sending domain, a reputable provider, a fallback provider | P3 |
| Technical | Chat bugs (lost/duplicate/out-of-order messages) | High (trust) | Medium | Idempotency keys, gap-fill, socket tests, single send service | P8 |
| Technical | Expo/React Native monorepo tooling friction (Metro + pnpm) | Medium (time) | Medium | Verify the hoisted linker in P0; follow Expo monorepo guide | P0 |
| Scalability | Single instance saturates during a viral campus moment | Medium | Low early | Stateless design, adapter-ready rooms, host autoscale | P12 / V2 |
| UX | Cold start: an empty feed kills retention | High | **High** | Seed prompts/questions, launch with an event, founders post daily, a Discover "coming soon" teaser | Beta |
| UX | Onboarding friction (email check, OTP) | Medium | Medium | Clear copy, resend, 6-digit auto-fill, remember the email | P3 |
| Team/process | Scope creep, building V2 features before the MVP works | High | **High** | This phase plan + "what not to build" list + phase DoD gates | Always |
| Team/process | Three people breaking each other's work (contracts/migrations) | Medium | Medium | Contract-first, CODEOWNERS, one migration in flight | P0+ |
| Team/process | Bus factor / exams | Medium | High | Docs/ADRs, small PRs, pairing on auth/chat | Always |
| Cost | AI moderation/email costs spike with abuse or bots | Medium | Low–Med | Rate limits, verification wall, DM scan scoping, budget alerts | P10 |
| Moderation ops | Nobody available to review reports during exams/holidays | High | **High** | Rota, volunteer moderators, stricter auto-hide thresholds when the queue is backed up | Beta |

---

## 32. What Not To Build Yet

| Don't build | Why | Instead |
|---|---|---|
| Microservices, separate chat service | Operational overhead with no benefit below ~50k users | Modular monolith + worker |
| Kubernetes, Terraform-heavy infrastructure | Three students can't operate it | PaaS (Railway/Render) + Docker |
| ML recommendations / matching models | No data, and hard to debug | Rule-based scoring |
| AI campus assistant | Needs a verified knowledge base + LLM costs | Future |
| Event-driven architecture / Kafka / event sourcing | Overkill | BullMQ jobs, outbox later |
| Dedicated search engine | PG full-text is enough to tens of thousands of posts | PG FTS in V1 |
| Heavy caching layers (feed caches, CDN tokens) | Premature. Adds invalidation bugs. | Indexes + TanStack Query |
| Offline message queue / local DB (WatermelonDB, SQLite sync) | Complex sync semantics | Pending store + retry |
| E2E encrypted chat | Conflicts with report-based moderation and ban accountability, and is complex | TLS + at-rest encryption by provider. Revisit only with a clear threat model. |
| Voice/video messages, polls, GIFs | Moderation + transcoding costs | V2+ |
| Uploaded avatars / free-text display names | Impersonation + face-photo de-anonymization | Generated avatars/pseudonyms |
| Web student client | Doubles UI work | Mobile only. Admin is the only web app. |
| Custom native modules / ejecting from Expo | Maintenance burden | Expo modules only |
| Complex CI (preview deployments per PR, matrix builds) | Slow and costly | The single pipeline in §23 |
| Multi-university admin tooling | One university first | Tenancy columns now, tooling in V2 |
| Monetization features | No users yet | Plan §44 later |
| Turborepo/Nx | pnpm workspaces suffice | Add when builds are slow |

---

## 33. Final Architecture

**TECH STACK**
- **Mobile:** React Native + Expo (latest stable SDK, EAS dev builds), Expo Router, JavaScript + JSDoc checkJs, TanStack Query, Zustand, Axios, socket.io-client, FlashList, expo-image, expo-secure-store, expo-image-picker, expo-image-manipulator, expo-notifications, expo-linking, react-hook-form + Zod, NetInfo, Sentry.
- **Backend:** Node LTS, Express 5, JavaScript + JSDoc checkJs, Zod, Prisma, pino, rate-limiter-flexible, BullMQ, sharp, file-type, @aws-sdk/client-s3 + presigner, expo-server-sdk, jsonwebtoken (or jose), argon2, otplib (admin TOTP), helmet.
- **Database:** PostgreSQL 16 (managed, PITR), UUIDv7 keys, keyset pagination.
- **Cache:** Redis 7 (noeviction; split later).
- **Realtime:** Socket.IO (per-user rooms; Redis adapter at 2+ instances).
- **Storage:** Cloudflare R2 (private, presigned PUT/GET), MinIO locally.
- **Authentication:** university email OTP → 15-min JWT + rotating hashed refresh tokens (PG), SecureStore.
- **Notifications:** Expo Push via the worker + in-app notifications table + deep links.
- **Moderation:** sync rules engine → async provider-agnostic AI text/image scan → risk matrix → human review. AI never bans.
- **Admin:** Next.js (App Router, JS) on Vercel. Separate admin users, TOTP, RBAC, audit, break-glass.
- **Testing:** Vitest + Supertest + real PG/Redis, socket.io-client tests, Jest + React Native Testing Library, Maestro, Playwright (V1), k6.
- **Deployment:** GitHub Actions → Docker image → Railway/Render (Singapore), API + worker. Neon/managed PG. EAS Build/Update/Submit.
- **Monitoring:** Sentry (all apps), pino logs → log drain, uptime checks, queue/DB alerts.

**FINAL REPOSITORY STRUCTURE**
```
anonymous-campus/                (this repo: TEST_CLOUD → rename when product name is chosen)
├── apps/
│   ├── mobile/                  # Expo app (§6.3)
│   ├── server/                  # Express API + Socket.IO + worker (§7.2)
│   └── admin/                   # Next.js admin (from P10)
├── packages/
│   ├── shared/                  # Zod schemas, enums, error codes, limits, socket events (+ generated .d.ts)
│   └── config/                  # ESLint, Prettier, base jsconfig
├── docs/
│   ├── architecture.md          # This plan, maintained
│   ├── conventions.md           # Layering, naming, presenter rule, testing rules
│   ├── adr/                     # Architecture decision records (one per D-item)
│   ├── runbooks/                # Incident, moderation escalation, legal requests, restore
│   └── phases/                  # Per-phase contracts (endpoints, schemas, migration, DoD)
├── .github/ workflows/ci.yml, deploy-staging.yml, release.yml · PULL_REQUEST_TEMPLATE.md · CODEOWNERS
├── docker-compose.yml  pnpm-workspace.yaml  package.json  .npmrc  .nvmrc  .editorconfig  .gitignore
├── plan.md  CLAUDE_PLAN_PROMPT.md  README.md
```

**FINAL DATABASE ARCHITECTURE:** §8 (MVP tables), §8.4 (post-MVP), with PG as the only source of truth and Redis limited to §9.

**FINAL API ARCHITECTURE:** REST `/api/v1` with a standard envelope and cursor pagination (§26) + Socket.IO event set (§26), all defined in `@campus/shared`. Admin API under `/api/v1/admin` with cookie auth.

**FINAL MOBILE ARCHITECTURE:** Expo Router groups `(auth)` → `(onboarding)` → `(app)/(tabs)`, feature folders, TanStack Query for server state, Zustand for session/UI, SecureStore for tokens, a socket provider, and push/deep-link handling (§6).

**FINAL DEVELOPMENT ROADMAP:** P0 → P12 → closed beta → P13–P20 (§28).

**FINAL TEAM WORKFLOW:** trunk-based, squash PRs, Conventional Commits, CODEOWNERS on shared/prisma, one migration in flight, contract-first, lanes per person (§24).

**FINAL CLAUDE CODE WORKFLOW:** one phase per session, starting from the phase contract in `docs/phases/`. Claude first explains the files, DB changes, API changes, mobile changes and security impact (plan §112), then implements, runs tests, lints, and reports (plan §115–116 output format). No automatic continuation to the next phase. Single agent for P0–P4. Worktree-based backend/mobile/QA agents from P5 with the lead reviewing (§25). A security review at the end of each phase.

---

## 34. Exact First Implementation Step

### What Claude Code should build FIRST
**Phase 0, step 1: the monorepo skeleton and the shared contract package**, in this order:
1. Root: `package.json` (workspace scripts), `pnpm-workspace.yaml`, `.npmrc`, `.nvmrc`, `.editorconfig`, `.gitignore`, update `README.md` (setup instructions).
2. `packages/config/`: `eslint.config.js` (flat config incl. the restricted-syntax rules for `$queryRawUnsafe`, `dangerouslySetInnerHTML`, `include: { user: true }` patterns), `prettier.config.js`, `jsconfig.base.json` (`checkJs`, `strict`-ish options).
3. `packages/shared/`: `src/enums.js`, `src/errors.js`, `src/limits.js`, `src/schemas/common.js` (envelope, pagination, cursor), `src/index.js`, `package.json`, a declaration-build script, and Vitest tests.
4. `docker-compose.yml` (postgres:16, redis:7, minio + bucket init, mailpit) + `.env.example` placeholders for server and mobile.
5. `.github/workflows/ci.yml` (install, lint, typecheck, test, gitleaks), `PULL_REQUEST_TEMPLATE.md`, `CODEOWNERS`.
6. `docs/architecture.md` (this plan), `docs/conventions.md`, `docs/adr/0001-modular-monolith.md`, `0002-js-jsdoc-zod.md`, `0003-auth-otp-jwt-refresh.md`, `0004-privacy-model.md` (and the rest of D1–D18 as short ADRs), `docs/phases/phase-1-backend-foundation.md`.

Then **P1 (server foundation)** and **P2 (mobile foundation)**, which can proceed in parallel.

### Prerequisites before coding starts
**Must have (blocking P0–P2):**
- [ ] Node LTS, pnpm, Docker, Git installed for all three developers. Android Studio emulator or an Android phone.
- [ ] GitHub repo with branch protection on `main` (required CI + 1 review) and the three collaborators added.
- [ ] **Working product name + reverse-DNS app ID** (e.g., `com.<name>.app`). The Play Store app ID can't change after publishing, so choose deliberately (a placeholder is fine for P0–P2 if it's replaced before the first store upload).
- [ ] Expo account (organization) for EAS dev builds.
- [ ] Target university confirmed (plan uses UET, `@uet.edu.pk`) and the **exact list of email domains/subdomains** students use.
- [ ] Team lanes agreed (§24) and this plan committed as `docs/architecture.md`.

**Must have before P3 (auth):**
- [ ] A domain you control (for the email sending domain, later API/admin hostnames and App Links), with DNS access for SPF/DKIM/DMARC.
- [ ] Transactional email provider account (Resend/Postmark/SES).
- [ ] At least 3 real university email inboxes available for deliverability testing.

**Before P7/P10/P12:** Cloudflare account (R2), hosting account (Railway/Render), managed Postgres (Neon), Sentry, AI moderation provider decision + account, Google Play Console ($25), legal advice + drafted policies, admin TOTP app for each admin.

### What should NOT be implemented yet (during P0)
- No Expo app scaffolding beyond an empty `apps/mobile` placeholder (it comes in P2).
- No Express app, Prisma schema, migrations or database models (P1).
- No authentication, users, sessions or any product feature.
- No Socket.IO, BullMQ, storage, push or moderation code.
- No admin app (P10).
- No deployment pipelines beyond CI checks (staging deploy arrives in P1/P3 once there is something to deploy).
- Nothing from V1/V1.5/V2 (matching, communities, study/FYP, lost & found, reveal, events, societies, career, search).

---

### "If we follow this architecture and development sequence, what should Claude Code build FIRST, and what exact prerequisites must be completed before we start implementation?"

**Build first:** Phase 0: the pnpm monorepo skeleton (`apps/`, `packages/shared`, `packages/config`, `docs/`), lint/format/JSDoc type-check tooling, `docker-compose.yml` with Postgres, Redis, MinIO and Mailpit, the CI workflow, and the shared contract package's base (enums, error codes, limits, envelope/pagination schemas with tests). Nothing product-facing comes before this, because every later phase depends on its conventions, contracts and CI safety net. Next come the Express foundation (P1) and the Expo foundation (P2), in parallel, followed by authentication (P3).

**Prerequisites:** developer tooling installed (Node LTS, pnpm, Docker, Android emulator/device). A GitHub repo with branch protection and collaborators. An Expo account. A chosen app name/app ID (placeholder allowed until the first store upload). The target university and its exact email domains confirmed. Team lanes agreed and this plan committed to `docs/`. Before P3 you also need a domain with DNS access, an email provider, and real university inboxes for deliverability testing.

---

## Verification of this plan (how to check it once implementation starts)
- P0 is correct when a fresh clone runs `pnpm i && docker compose up -d && pnpm lint && pnpm typecheck && pnpm test` green locally and in GitHub Actions.
- Every later phase is verified by its DoD in §28: integration + authz-matrix + leak tests in CI, Maestro flows on an Android dev build, and (for P3) real OTP delivery to university inboxes.
- A security review (§20 checklist) runs at the end of each phase before moving on.
