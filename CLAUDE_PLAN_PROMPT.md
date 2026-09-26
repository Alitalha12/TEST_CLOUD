You are the lead software architect, product architect, senior React Native engineer, backend engineer, database architect, security engineer, DevOps engineer, QA engineer, and technical project manager for this startup.

IMPORTANT:
You are currently in PLAN MODE.

DO NOT write code.
DO NOT create files.
DO NOT modify the repository.
DO NOT start implementing anything.

Your job right now is to deeply understand the startup and produce a complete, realistic, production-grade development blueprint before implementation begins.

==================================================


## RESPONSE ORGANIZATION AND DEPTH

Do not sacrifice architectural quality for brevity.

However, organize the response in logical sections and prioritize the following:

1. Feasibility
2. Final architecture
3. Dependency and order of development
4. End-to-end feature architecture
5. Exact implementation phases

For every major architectural decision, explain:

* Why this approach is being recommended
* What alternatives were considered
* Why the selected approach fits this startup
* What dependencies or trade-offs it creates
* How it affects future scalability and maintainability

If a section becomes extremely large, do not omit important architectural decisions merely to keep the response short.

Instead:

* Provide the essential architecture and decisions first.
* Clearly identify which details should be expanded during the corresponding implementation phase.
* Keep the architecture internally consistent with `plan.md`.
* Do not repeat the same explanation unnecessarily across multiple sections.
* Prefer dependency-aware explanations over isolated feature descriptions.

The final plan should be detailed enough that it can later be converted into implementation tasks for Claude Code without requiring major architectural decisions to be made again.


1. FIRST: READ THE PROJECT DOCUMENTATION
   ==================================================

There is a `plan.md` file in the repository.

Read `plan.md` completely before doing anything else.

Treat `plan.md` as the primary source of truth for the product requirements and intended feature set.

Do not ignore features from the document.

However, do not blindly accept every architectural decision if there is a better production-grade approach.

If you believe something in `plan.md` should change, clearly explain:

* What the current proposal says
* What you recommend instead
* Why
* What trade-offs exist
* Whether the change is necessary for MVP or can wait

Do not silently change the requirements.

==================================================
2. UNDERSTAND THE ACTUAL STARTUP
================================

The startup is being built by:

* Ali Talha
* Moeed Amir
* Rayan Ali

The goal is NOT merely to build a university-project demo.

The goal is to build a real React Native mobile startup that can eventually be used by real university students.

Therefore, evaluate the project from a production perspective.

I currently do NOT have a complete understanding of how to build such a startup from zero.

I want you to explain the development process to me step-by-step.

Assume I understand programming reasonably well, but I need the complete system architecture and execution strategy.

==================================================
3. FEASIBILITY ANALYSIS
=======================

First determine whether the startup described in `plan.md` is technically buildable as a real product.

Analyze:

* Can this actually be built?
* Which parts are straightforward?
* Which parts are technically difficult?
* Which parts are risky?
* Which parts are expensive?
* Which parts can be built by a 3-person student team?
* Which parts should be simplified for MVP?
* Which parts should NOT be built initially?
* What external services will be required?
* What will eventually cost money?
* What can initially be free/low-cost?
* What will become difficult when users grow from:

  * 100 users
  * 1,000 users
  * 10,000 users
  * 100,000 users
* What architectural decisions should be made now so scaling later is possible?

Do not just say "yes, it is possible."

Give a realistic technical feasibility analysis.

==================================================
4. DEFINE THE PRODUCT DEVELOPMENT STRATEGY
==========================================

Create a complete development roadmap.

Do NOT simply list features.

Show the dependency order.

For example:

Foundation
↓
Mobile architecture
↓
Backend foundation
↓
Database
↓
Authentication
↓
Anonymous identity
↓
Feed
↓
Chat
↓
Media
↓
Notifications
↓
Safety/moderation
↓
Admin
↓
Matching
↓
Study/FYP
↓
Communities
↓
Events
↓
Career
↓
Search
↓
Production hardening
↓
Deployment
↓
Beta launch
↓
Scale

But create the ACTUAL dependency graph based on the project.

Explain why each phase must happen before or after another phase.

==================================================
5. REACT NATIVE MOBILE APP ARCHITECTURE
=======================================

Design the complete React Native mobile architecture.

The mobile application should use the architecture you recommend after analyzing `plan.md`.

Explain:

* React Native
* Expo
* Expo Router
* JavaScript vs TypeScript
* navigation architecture
* screen structure
* feature-based folder structure
* reusable components
* hooks
* services
* API layer
* authentication state
* server state
* local/client state
* caching
* offline behavior
* loading states
* error states
* optimistic updates
* pagination
* infinite scrolling
* image handling
* file handling
* push notifications
* deep linking
* secure storage
* environment configuration

Show the proposed mobile folder structure.

For EVERY major folder explain:

* why it exists
* what belongs there
* what must NOT go there

==================================================
6. UI/UX ARCHITECTURE
=====================

For every major feature from `plan.md`, explain how the mobile UI should work.

For each feature provide:

1. User goal
2. Screens required
3. Navigation flow
4. UI components
5. User interactions
6. Loading states
7. Empty states
8. Error states
9. Permission requirements
10. Backend dependency
11. Database dependency
12. Security/privacy considerations

Do this for features including, where applicable:

* onboarding
* university verification
* anonymous identity creation
* profile
* interests
* home/feed
* categories
* posts
* comments
* likes
* saves
* anonymous user interaction
* 1-to-1 chat
* conversations
* message reactions
* media sharing
* matching
* study partner finder
* FYP/project partner finder
* skills/networking
* communities
* academic communities
* campus discussions
* lost and found
* societies
* events
* career/internships
* notifications
* search
* reports
* blocks
* settings

Explain the actual user journey.

Example:

Student opens app
→ verifies university email
→ creates anonymous identity
→ selects interests
→ enters Home
→ sees feed
→ opens post
→ comments anonymously
→ receives notification
→ opens chat
→ sends message
→ backend validates request
→ Socket.IO delivers message
→ database persists message
→ recipient receives push notification if offline

Create equivalent workflows for all major features.

==================================================
7. BACKEND ARCHITECTURE
=======================

Design the complete backend.

Analyze and decide the appropriate stack.

Potential technologies from the documentation include:

* Node.js
* Express
* PostgreSQL
* Prisma
* Redis
* Socket.IO
* Object Storage
* Push Notifications

Do not assume every technology must be used.

Evaluate each one and explain why it should or should not be used.

Design:

* API architecture
* module architecture
* controller/service/repository responsibilities
* validation
* authentication
* authorization
* middleware
* error handling
* logging
* configuration
* rate limiting
* caching
* background jobs
* file uploads
* media processing
* notifications
* WebSockets
* moderation
* audit logs

Show the proposed backend folder structure.

Explain how a request travels through the backend.

Example:

Mobile App
→ API
→ Authentication Middleware
→ Validation
→ Controller
→ Service
→ Repository/Prisma
→ PostgreSQL
→ Response

And for realtime chat:

Mobile
→ Socket.IO
→ Authentication
→ Authorization
→ Validation
→ Rate limit
→ Message service
→ PostgreSQL
→ Socket event
→ recipient
→ push notification if offline

==================================================
8. DATABASE ARCHITECTURE
========================

Design the production database architecture.

Use PostgreSQL unless you have a strong reason to recommend something else.

Determine:

* all tables
* columns
* primary keys
* foreign keys
* indexes
* unique constraints
* enums
* relationships
* cascade behavior
* soft deletion
* timestamps
* audit requirements

Review the database entities already proposed in `plan.md`.

Identify:

* missing tables
* unnecessary tables
* relationships that need improvement
* indexes required for performance
* privacy-sensitive columns
* fields that must NEVER be returned publicly

Explain the complete data model.

For every major feature explain:

Mobile UI
→ API
→ backend service
→ database tables
→ database operation
→ response
→ mobile state update

Also explain why PostgreSQL is being used as the source of truth.

==================================================
9. REDIS ARCHITECTURE
=====================

Explain exactly where Redis should be used.

Do NOT use Redis just because it is available.

Determine whether Redis is needed for:

* caching
* rate limiting
* sessions
* Socket.IO scaling
* online presence
* typing indicators
* unread counters
* temporary data
* queues
* notifications
* abuse prevention

For every Redis use case explain:

* what data is stored
* TTL
* key pattern
* invalidation strategy
* why Redis is appropriate

Also clearly identify what MUST remain in PostgreSQL.

==================================================
10. MEDIA / FILE STORAGE
========================

Design the complete image/file architecture.

Evaluate:

* Cloudflare R2
* Amazon S3
* other appropriate object storage

Explain:

Mobile
→ request upload permission
→ backend validates
→ signed upload URL
→ object storage
→ upload
→ backend confirmation
→ database metadata

Include:

* file size limits
* MIME validation
* extension validation
* image processing
* thumbnails
* private/public objects
* signed URLs
* malicious file protection
* cleanup of orphan files

==================================================
11. AUTHENTICATION + ANONYMITY
==============================

This is one of the most important parts of the startup.

Design the authentication and anonymity architecture carefully.

The product should provide:

ANONYMOUS TO OTHER USERS

It should NOT falsely promise:

"Nobody, including the platform, can ever identify you."

Explain the difference.

Design:

* university email verification
* OTP/link verification
* account creation
* sessions
* refresh/access tokens if appropriate
* SecureStore
* anonymous profile
* internal user identity
* public identity
* privacy boundaries
* admin access
* audit logging
* account recovery
* account deletion

Clearly identify which fields are private and which are public.

Explain how APIs prevent accidental exposure of:

* email
* real name
* student ID
* phone number
* internal database IDs
* verification information

==================================================
12. CHAT ARCHITECTURE
=====================

Design production-grade anonymous 1-to-1 chat.

Explain:

* conversation creation
* conversation membership
* Socket.IO connection
* authentication
* authorization
* message sending
* persistence
* delivery
* read receipts
* typing indicators
* online status
* message reactions
* replies
* attachments
* deletion
* blocking
* reporting
* muting
* rate limits
* spam prevention
* offline users
* push notifications
* reconnect behavior
* duplicate message prevention
* ordering
* pagination

Explain REST vs WebSocket responsibilities.

Do NOT put everything into WebSockets if REST is more appropriate.

==================================================
13. FEED ARCHITECTURE
=====================

Design:

* post creation
* feed retrieval
* pagination
* infinite scroll
* ranking
* likes
* comments
* saves
* reports
* media
* deletion
* moderation
* caching

Explain how the feed should work for the initial MVP.

Then explain how it could evolve for larger scale.

Do not build an unnecessarily complex recommendation algorithm for MVP.

==================================================
14. MATCHING / DISCOVERY
========================

Design the matching system.

Determine how students can discover:

* study partners
* FYP partners
* project partners
* students with similar interests
* students with complementary skills
* relevant communities

Explain:

* matching inputs
* scoring
* filtering
* database queries
* ranking
* privacy
* mutual matching
* future ML possibilities

Start with deterministic/rule-based matching unless there is a strong reason to introduce ML immediately.

==================================================
15. MODERATION + SAFETY
=======================

Design a serious production moderation architecture.

Consider:

* spam
* harassment
* bullying
* threats
* sexual content
* scams
* impersonation
* doxxing
* malicious links
* inappropriate media

Explain:

deterministic rules
→ automated moderation
→ risk score
→ action
→ human review where necessary

Define:

* report flow
* block flow
* mute flow
* warning
* content removal
* temporary restriction
* suspension
* permanent ban
* appeal/review if appropriate
* moderation cases
* admin audit logs

Explain what AI moderation should and should NOT decide automatically.

==================================================
16. ADMIN DASHBOARD
===================

Design the separate secure admin application.

Explain:

* admin authentication
* role-based access
* reports
* users
* posts
* comments
* messages requiring review
* moderation cases
* bans
* suspensions
* warnings
* audit logs
* privacy restrictions

Clearly define what admins can see and what they should NOT casually access.

==================================================
17. SECURITY ARCHITECTURE
=========================

Perform a security review of the entire proposed system.

Cover:

* authentication
* authorization
* API security
* input validation
* SQL injection
* XSS
* CSRF where applicable
* rate limiting
* brute force protection
* token security
* SecureStore
* WebSocket authentication
* object storage
* file uploads
* secrets
* environment variables
* logging
* privacy
* database security
* backups
* admin security
* abuse prevention
* account enumeration
* IDOR/BOLA
* privilege escalation

For each threat explain the mitigation.

==================================================
18. PERFORMANCE + OPTIMIZATION
==============================

Design for performance from the beginning without premature overengineering.

Analyze:

Mobile:

* rendering
* FlatList/FlashList
* image caching
* pagination
* memoization
* network requests
* bundle size

Backend:

* database indexes
* query optimization
* connection pooling
* caching
* rate limiting
* background jobs

Database:

* indexes
* query patterns
* pagination strategy
* transactions
* connection management

Realtime:

* Socket.IO
* rooms
* presence
* scaling

Media:

* compression
* thumbnails
* CDN

Explain what optimizations are required for MVP and what can wait until scale.

==================================================
19. TESTING STRATEGY
====================

Testing must happen DURING development, not at the end.

Create a testing strategy for:

Frontend:

* unit tests
* component tests
* integration tests
* navigation tests
* critical user flows

Backend:

* unit tests
* API integration tests
* authentication tests
* authorization tests
* database tests
* WebSocket tests
* moderation tests

End-to-end:

* signup
* verification
* anonymous profile
* create post
* feed
* chat
* media
* report
* block
* notifications

Security testing:

* unauthorized requests
* IDOR/BOLA
* invalid tokens
* privilege escalation
* rate limits
* malicious uploads

For each development phase specify:

WHAT TO BUILD
→ WHAT TO TEST
→ HOW TO TEST
→ DEFINITION OF DONE

==================================================
20. CI/CD + DEVOPS
==================

Design development and deployment environments.

Explain:

Local
→ Development
→ Staging
→ Production

Determine:

* environment variables
* secrets
* database migrations
* Docker
* CI/CD
* automated tests
* linting
* builds
* deployment
* rollback
* backups
* monitoring
* logging
* error tracking

Explain what should run automatically on every pull request.

==================================================
21. GIT + TEAM WORKFLOW
=======================

There are three developers:

Ali Talha
Moeed Amir
Rayan Ali

Design a Git workflow for the team.

Explain:

* main
* develop if necessary
* feature branches
* pull requests
* code review
* commit conventions
* issue tracking
* task ownership
* merge strategy

Also explain how to avoid two developers breaking each other's work.

==================================================
22. MULTI-AGENT CLAUDE CODE STRATEGY
====================================

I may later use multiple Claude Code agents.

Do NOT immediately split everything into agents.

First determine when multi-agent development becomes useful.

Evaluate separate agents for:

1. React Native frontend
2. Backend/API
3. Database/Prisma
4. Testing/QA
5. Security
6. DevOps
7. UI/UX
8. Documentation

Explain:

* which agents can work independently
* which must work sequentially
* which can work in parallel
* which files/modules they should own
* how they coordinate
* how they avoid conflicting changes
* how shared contracts are maintained
* when one lead/architect agent should review everything

Recommend a practical workflow for a 3-person startup team.

==================================================
23. CONTRACT-FIRST DEVELOPMENT
==============================

Determine whether API contracts, database contracts, shared types/schemas, or other interfaces should be defined before implementation.

If appropriate, design:

Mobile
↕
API contract
↕
Backend
↕
Database

Explain how changes should be managed so frontend and backend do not become incompatible.

==================================================
24. MVP DEFINITION
==================

Do NOT assume that every feature in `plan.md` belongs in the first launch.

Create:

MVP

V1

V1.5

V2

Future

For each feature explain:

* why it belongs in that stage
* dependencies
* engineering effort
* product value
* scaling implications

The MVP must be realistically launchable by a small student team.

==================================================
25. ACTUAL DEVELOPMENT ORDER
============================

Give me the exact order in which Claude Code should build the repository.

For example:

Phase 0
Architecture/repository

Phase 1
React Native foundation

Phase 2
Backend foundation

Phase 3
Database/Prisma

Phase 4
Authentication

Phase 5
Anonymous profile

...

But determine the ACTUAL phases yourself after studying `plan.md`.

For every phase include:

* objective
* features
* files/modules involved
* frontend work
* backend work
* database work
* API endpoints
* realtime work if applicable
* tests
* security checks
* performance checks
* definition of done
* dependencies
* what must NOT be implemented yet

==================================================
26. END-TO-END FEATURE MATRIX
=============================

Create a matrix showing:

Feature
→ Mobile screens
→ React Native components
→ State
→ API endpoints
→ Backend modules
→ Database tables
→ Redis usage
→ Object storage
→ Socket.IO events
→ Notifications
→ Tests
→ Security considerations

This should allow us to understand exactly how every feature connects across the entire stack.

==================================================
27. REAL USER LAUNCH PLAN
=========================

Explain how this can move from:

Local development
→ internal testing
→ team testing
→ closed beta
→ university pilot
→ real users
→ larger user base

Explain:

* what needs to be ready before real users
* what must be monitored
* what metrics should be collected
* what logs are needed
* what safety systems are required
* what happens when reports increase
* what happens when traffic increases
* how database/storage costs grow

Do not make business success predictions.

Focus on technical/product readiness.

==================================================
28. RISKS AND FAILURE POINTS
============================

Identify the biggest risks.

Separate them into:

Technical
Security
Privacy
Moderation
Scalability
UX
Operational
Team/process
Cost

For each:

Risk
→ impact
→ likelihood
→ mitigation
→ when to address it

==================================================
29. WHAT WE SHOULD NOT BUILD YET
================================

This is extremely important.

Identify features or technologies that would create unnecessary complexity at the beginning.

Examples may include:

* premature microservices
* unnecessary ML
* complex recommendation systems
* unnecessary event-driven architecture
* excessive caching
* unnecessary Kubernetes
* overcomplicated CI/CD
* unnecessary native modules

But make your own assessment based on the actual project.

==================================================
30. FINAL RECOMMENDATION
========================

At the end give me a clear final architecture.

Include:

TECH STACK

Mobile:
Backend:
Database:
Cache:
Realtime:
Storage:
Authentication:
Notifications:
Moderation:
Admin:
Testing:
Deployment:
Monitoring:

Then provide:

FINAL REPOSITORY STRUCTURE

FINAL DATABASE ARCHITECTURE

FINAL API ARCHITECTURE

FINAL MOBILE ARCHITECTURE

FINAL DEVELOPMENT ROADMAP

FINAL TEAM WORKFLOW

FINAL CLAUDE CODE WORKFLOW

==================================================
31. VERY IMPORTANT: EXPLAIN IT TO ME
====================================

Do not write the answer as if it is only for another senior engineer.

I need to understand how this startup will actually be built.

Whenever something important is introduced, explain:

WHAT it is
WHY we need it
WHERE it lives
HOW it connects to other parts
WHEN we build it
WHAT depends on it
HOW we test it

Use practical examples.

For example:

"Ali opens the app and sends a message to another anonymous student."

Then explain exactly what happens:

React Native
→ API/Socket
→ authentication
→ authorization
→ backend
→ PostgreSQL
→ Socket.IO
→ recipient
→ notification
→ UI update

Do this kind of end-to-end reasoning throughout the architecture.

==================================================
32. DO NOT IMPLEMENT YET
========================

Again:

DO NOT write code.

DO NOT modify files.

DO NOT create database migrations.

DO NOT install packages.

DO NOT create the React Native app.

DO NOT create backend files.

DO NOT create the database.

DO NOT make commits.

This is ONLY the architecture and implementation planning stage.

==================================================
33. FINAL OUTPUT FORMAT
=======================

Structure your final plan using:

1. Executive Summary
2. Feasibility Assessment
3. Product Architecture
4. Recommended Tech Stack
5. System Architecture
6. React Native Architecture
7. Backend Architecture
8. Database Architecture
9. Redis Architecture
10. Media Architecture
11. Authentication & Anonymity
12. Feed Architecture
13. Chat Architecture
14. Matching Architecture
15. Communities Architecture
16. Events/Societies/Lost & Found
17. Career Features
18. Moderation & Safety
19. Admin Architecture
20. Security Architecture
21. Performance Architecture
22. Testing Strategy
23. CI/CD & DevOps
24. Git/Team Workflow
25. Multi-Agent Claude Code Strategy
26. API/Data Contracts
27. MVP/V1/V2 Scope
28. Exact Development Phases
29. End-to-End Feature Matrix
30. Real User Launch Readiness
31. Risks
32. What Not To Build Yet
33. Final Architecture
34. Exact First Implementation Step

At the VERY END answer this:

"If we follow this architecture and development sequence, what should Claude Code build FIRST, and what exact prerequisites must be completed before we start implementation?"

Remember:

This is a real startup architecture exercise, not a tutorial toy project.

Think deeply about maintainability, security, privacy, scalability, developer experience, testing, and real-world users.

Use `plan.md` as the primary source of truth.

Do not code yet.
