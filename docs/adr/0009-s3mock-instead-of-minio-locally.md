# ADR 0009: adobe/s3mock instead of MinIO for local S3-compatible storage

**Status:** Accepted — local development tooling only, not a change to production architecture.

## Context
`docs/architecture.md` specifies MinIO as the local stand-in for Cloudflare
R2 (§7.1, §10, §23.1, §28 P0/P1/P7). While building Phase 0, `minio/minio`
turned out to be **no longer pullable anonymously** on either Docker Hub or
quay.io — both now return an access-denied/401 requiring a MinIO Inc.
account/license. `localstack/localstack` was tried as an alternative and
also now refuses to start without a `LOCALSTACK_AUTH_TOKEN`, even for pure
S3 usage. Both were verified directly against the real registries, not
assumed from prior knowledge, since this ecosystem shifts quickly.

## Decision
Use `adobe/s3mock` in `docker-compose.yml` for local development. It's a
free, actively maintained, S3-API-compatible single-container mock with no
account or license requirement, and it supports auto-creating the dev
bucket via `COM_ADOBE_TESTING_S3MOCK_STORE_INITIALBUCKETS`.

## Why this doesn't change the architecture
`docs/architecture.md` §5 and §33 name **Cloudflare R2** as the actual
production/staging storage provider — that decision is unaffected. "MinIO
locally" was always just a local-dev implementation detail standing in
behind the same S3 API that `lib/storage.js` (Phase 7) talks to. Swapping
which S3-compatible mock runs in Docker Compose changes zero application
code.

## Consequences
- `docker-compose.yml`'s `s3` service uses `adobe/s3mock`, not
  `minio/minio` — see the inline comment there for the verification detail.
- s3mock's default file store is in-container `/tmp` (not a mounted
  volume), so uploaded objects do **not** persist across
  `docker compose down`/`up` cycles. This is fine for local dev (nothing
  irreplaceable is stored there) but is worth knowing if a "why did my
  test upload disappear" question comes up.
- There is no web console (MinIO had one on :9001) — inspect objects via
  the S3 API itself (e.g. `aws --endpoint-url http://localhost:9000 s3 ls`)
  or a one-off S3 client tool if needed.
- Revisit this ADR if MinIO's or LocalStack's free distribution situation
  changes and the team would prefer to switch back — nothing else depends
  on this choice.
