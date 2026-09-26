# ADR 0001: Modular monolith + worker, not microservices

**Status:** Accepted

## Context
Three students need to build, debug and deploy a real product without an
ops team. `plan.md` lists ~20 feature areas that could each look like a
"service".

## Decision
One Node/Express API process (also hosting Socket.IO) plus one worker
process, both from the same codebase, organized into modules with their
own service/repository/presenter layers (`docs/architecture.md` §5, §7.2).

## Why
A single deployable unit keeps debugging, transactions and deploys simple.
Module boundaries keep the code splittable later if it's ever needed.
Microservices would add operational overhead (service discovery, network
calls, distributed transactions) with no benefit below tens of thousands
of users.

## Consequences
- Scaling is vertical/horizontal-replica first (§2.4), not per-service.
- Module boundaries must be enforced by convention + code review, not by
  process isolation — see `docs/conventions.md` layering rules.
