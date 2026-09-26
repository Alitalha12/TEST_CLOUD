# Anonymous University Social & Chat Platform

## Complete Product & Development Specification

## 1. Project Overview

Build a university-focused anonymous social networking and communication web application where verified university students can communicate, discover other students, participate in campus discussions, find project/study partners, share media, and build communities without exposing their real identity to other users.

The platform should not simply be a generic anonymous chat application. It should function as a **digital anonymous campus community**.

The core idea is:

> **Students verify that they belong to a university, but their real identity remains hidden from other students unless they voluntarily choose to reveal it.**

The application should initially target **one university** and be designed so that additional universities can be added later.

---

# 2. Main Problem

University students already communicate through:

* WhatsApp groups
* Facebook groups
* Discord
* Instagram
* class groups
* society groups

However, these platforms have several problems:

1. Students may not feel comfortable expressing opinions using their real identity.
2. Useful campus information is scattered across many groups.
3. Students often don't know other students outside their own class/friend circle.
4. Finding FYP/project partners can be difficult.
5. Finding study partners is difficult.
6. Students may want to discuss academic or campus problems anonymously.
7. Lost-and-found information is fragmented.
8. Internship, event, society, and campus information is distributed across different channels.
9. Students cannot easily discover people with similar interests.
10. There is no centralized anonymous digital community specifically for their university.

The platform should solve these problems while maintaining privacy and strong abuse-prevention mechanisms.

---

# 3. Important Privacy Principle

The application should provide:

> **Anonymity from other users, not unrestricted anonymity from the platform.**

Students should not see another user's:

* real name
* university email
* phone number
* personal account information
* internal user ID
* private metadata

The backend may securely maintain the minimum information required for:

* university verification
* account management
* abuse prevention
* moderation
* security
* legal compliance where applicable

Do NOT advertise the platform as:

> "Nobody can ever identify you."

Instead communicate:

> "Your identity is hidden from other students."

---

# 4. Target Users

Primary users:

* University students
* Undergraduate students
* Postgraduate students

Potential secondary users later:

* University societies
* Student clubs
* Campus organizations
* Verified university departments
* Student-focused businesses

The initial launch should focus on **one university** rather than attempting to support every university immediately.

---

# 5. Core Product Modules

The application should contain the following major modules:

1. Authentication & University Verification
2. Anonymous Identity/Profile
3. Anonymous Campus Feed
4. Posts & Comments
5. Anonymous 1-to-1 Chat
6. Anonymous Matching
7. Interest-Based Discovery
8. Communities
9. Academic Communities
10. FYP/Project Partner Finder
11. Study Partner Finder
12. Skills & Networking
13. Photos and Media Sharing
14. Lost & Found
15. Campus Discussions
16. Events & Society Communities
17. Career/Internship Community
18. AI Moderation
19. Reporting & Blocking
20. Admin Moderation Dashboard
21. Privacy & Security System
22. Notifications
23. Search & Discovery

Some of these should be implemented after the MVP rather than all at once.

---

# 6. Authentication & University Verification

Users must first verify that they belong to the supported university.

Example flow:

Student
→ Enter university email
→ Receive OTP/email verification
→ Verify email
→ Create account
→ System generates anonymous identity

Example:

Real identity internally:

Ali
[ali@student.university.edu](mailto:ali@student.university.edu)

Public identity:

Anonymous Fox #2841

Other users should only see:

Anonymous Fox #2841

The university domain should be configurable.

Example:

```text
Allowed domains:

@uet.edu.pk
```

The system should make it easy to add additional university domains later.

---

# 7. Anonymous Identity System

After verification, generate an anonymous identity.

Example:

```text
Anonymous Fox #2841
Anonymous Panda #8122
Anonymous Tiger #1931
Anonymous Falcon #7712
```

The anonymous identity should contain:

* anonymous display name
* generated avatar
* optional interests
* optional department
* optional semester
* optional skills

Users should be able to change their anonymous avatar/name according to product rules.

Never expose:

* email
* real name
* phone
* internal database ID

through public APIs.

---

# 8. Anonymous Profile

A public anonymous profile could contain:

```text
Anonymous Fox #2841

Department:
Computer Science

Semester:
5th

Interests:
AI/ML
Web Development
Startups

Skills:
Python
React
Node.js

Looking for:
FYP Partner
Study Partner
Networking
```

All fields should be optional except the minimum required for platform functionality.

Users should control what information is visible.

---

# 9. Anonymous Campus Feed

The home screen should contain a university-wide anonymous feed.

Students can create posts such as:

> "Anyone else finding DBMS difficult?"

> "Looking for an FYP partner."

> "Best society to join?"

> "Anyone going to the hackathon?"

> "Does anyone know when the assignment is due?"

Each post should display:

```text
Anonymous Fox #2841
Post content
Timestamp

Like
Comment
Share
Report
```

Users should be able to sort/filter posts by:

* Trending
* Recent
* Popular
* Academic
* Career
* Campus
* Random

---

# 10. Comments

Users can anonymously comment on posts.

Example:

```text
Anonymous Fox #2841:
Anyone else struggling with this course?

Anonymous Panda #8122:
Yes 😂

Anonymous Tiger #1931:
Same here.
```

Comment authors should also remain anonymous.

---

# 11. Anonymous 1-to-1 Chat

Users should be able to start private anonymous conversations.

Example:

```text
Anonymous Fox #2841
        ↕
Anonymous Panda #8122
```

The chat should support:

* text messages
* emojis
* images
* files
* voice messages (future)
* message reactions
* reply to message
* delete message
* report
* block
* mute

The real identity of both users remains hidden.

---

# 12. Image & Media Sharing

Users should be able to send:

* images
* photos
* PDFs
* documents

Potential future support:

* short videos
* voice messages

Images/files should NOT be stored directly inside PostgreSQL.

Use object storage such as:

```text
S3-compatible storage
Cloudflare R2
AWS S3
Firebase Storage
```

Database should store metadata/reference rather than large binary files.

Example:

```text
messages
attachments
storage_key
file_type
file_size
```

---

# 13. Anonymous Matching

Provide a feature:

> **Find Someone**

Users can choose:

```text
Department:
Computer Science

Semester:
Any

Topic:
AI/ML

Purpose:
Study
Networking
Friends
Project
Random
```

System finds another compatible student.

Example:

```text
🐼 Anonymous Panda #8217

CS
5th Semester
Interested in AI/ML

[Start Anonymous Chat]
```

---

# 14. Interest-Based Matching

Users can select interests:

```text
AI/ML
Web Development
Mobile Development
Cyber Security
Gaming
Startups
Photography
Sports
Movies
Programming
Research
Freelancing
```

The system should use these interests to improve discovery and matching.

Example:

User A:

```text
AI
Python
Startups
```

User B:

```text
AI
Python
Entrepreneurship
```

The system may suggest them as compatible students.

---

# 15. Identity Reveal System

The platform may optionally support mutual identity reveal.

Initially:

```text
Anonymous Fox #2841
        ↕
Anonymous Panda #8217
```

One user can request:

> Reveal Identity

The other user receives:

> Anonymous Fox #2841 wants to reveal identities.

Options:

```text
Accept
Reject
```

Only if both agree should identity information become visible.

This feature should be optional and should never be automatic.

---

# 16. Academic Communities

Create university-specific academic communities.

Example:

```text
Academics

Computer Science
Software Engineering
Electrical Engineering
Mathematics
Physics
Business
```

Within each:

```text
Courses
Assignments
Exams
Study Material
Questions
Discussion
```

Students can anonymously ask:

> "Can someone explain normalization?"

> "What topics are important for the exam?"

---

# 17. Study Partner Finder

Students should be able to search for study partners.

Example:

```text
Looking for:

Subject:
Database Systems

Semester:
5

Study style:
Online / Campus

Availability:
Evening
```

System finds compatible students.

---

# 18. FYP / Project Partner Finder

This can become a major university feature.

Student creates:

```text
Looking for Project Partner

Project:
AI-powered university assistant

My skills:
Python
FastAPI
React

Looking for:
ML Engineer
UI/UX Designer
Backend Developer
```

Other students can discover the project and start an anonymous conversation.

---

# 19. Skills & Networking

Students can optionally list:

```text
Skills:

Python
JavaScript
React
Node.js
Flutter
Machine Learning
Cyber Security
UI/UX
Graphic Design
Video Editing
```

They can specify:

```text
Looking for:

Internship
FYP Partner
Freelance Partner
Startup Team
Study Partner
Networking
```

This turns the application into a student networking platform rather than only an entertainment app.

---

# 20. Communities

Create topic-based communities.

Example:

```text
Communities

Technology
├── AI/ML
├── Web Development
├── Cyber Security
├── Mobile Development

Career
├── Internships
├── Freelancing
├── Jobs

Campus
├── Events
├── Societies
├── Lost & Found

Entertainment
├── Gaming
├── Movies
├── Sports
```

Users can join communities and anonymously participate.

---

# 21. Lost & Found

Create a dedicated campus utility.

Example:

```text
FOUND

🎧 AirPods

Location:
Lab 3

If these belong to you, contact me.
```

Another example:

```text
LOST

Student Card

Last seen:
Library
```

This should include strong anti-abuse controls.

---

# 22. Campus Discussions

Students can discuss:

* courses
* teachers
* university facilities
* events
* societies
* campus life
* transport
* hostel
* food
* study areas

However, the platform must distinguish between:

* personal opinion
* verified information
* official announcements
* allegations/claims

Avoid presenting unverified allegations as facts.

---

# 23. Society Communities

Verified university societies can eventually receive official communities.

Example:

```text
ACM
IEEE
GDSC
Sports Society
Debating Society
```

Society admins can post:

* events
* recruitment
* announcements
* workshops
* competitions

Official organization accounts should be clearly marked as verified rather than anonymous.

---

# 24. Events

Users should be able to discover university-related events.

Example:

```text
Upcoming Events

AI Workshop
Hackathon
Career Fair
Sports Tournament
Society Recruitment
```

Students can discuss events anonymously.

---

# 25. Career & Internship Community

Create a dedicated career section.

Students can anonymously discuss:

* internships
* job openings
* interview experiences
* technical preparation
* CVs
* freelancing
* companies

Example:

```text
Company X internship applications opened.

Anonymous discussion:
How was their interview?
What topics did they ask?
```

Information should be clearly labeled when it is based on individual experience rather than official company information.

---

# 26. AI Moderation

AI should be used primarily for moderation assistance.

Analyze:

```text
Text
Images
Links
User behavior
```

Possible categories:

```text
Safe
Spam
Harassment
Bullying
Threat
Sexual content
Scam
Abuse
```

Flow:

```text
User submits content
        ↓
Moderation system
        ↓
Risk assessment
        ↓
Allow / Flag / Block / Review
```

AI should not independently make every serious enforcement decision.

Provide human-admin review for serious or ambiguous cases.

---

# 27. Reporting System

Every post, comment, and chat should support:

```text
Report
```

Reasons:

```text
Harassment
Bullying
Spam
Threat
Sexual content
Scam
Impersonation
Doxxing
Other
```

Users should also be able to:

```text
Block
Mute
Delete conversation
```

---

# 28. Anti-Abuse System

Anonymous systems require strong abuse prevention.

Implement:

* rate limiting
* spam detection
* account restrictions
* report thresholds
* temporary bans
* permanent bans
* message limits for new accounts
* suspicious behavior detection
* image moderation
* link scanning
* admin review

Do not allow anonymity to mean unlimited abuse.

---

# 29. Admin Dashboard

Build a secure admin panel.

Admin should be able to view:

```text
Users
Reports
Posts
Comments
Messages flagged by moderation
Suspended accounts
Blocked accounts
Moderation history
```

Admin actions:

```text
Warn
Remove content
Restrict account
Suspend account
Ban account
Review report
Dismiss report
```

Access to identifying information should be highly restricted and audited.

---

# 30. Notifications

Support:

```text
New message
New comment
Post interaction
Match found
Report outcome
Community activity
Event reminder
```

Use real-time notifications for chat.

---

# 31. Search

Users should be able to search:

```text
Posts
Communities
Topics
Anonymous profiles
Events
```

Search results must not expose private identity information.

---

# 32. Suggested Technology Stack

Use a stack suitable for a modern production web application.

### Frontend

```text
Next.js
React
Tailwind CSS
```

### Backend

```text
Node.js
Express.js
Socket.IO
```

### Database

```text
PostgreSQL
```

### Cache / Real-Time Support

```text
Redis
```

Use Redis for:

* rate limiting
* online presence
* temporary matching
* caching
* session-related temporary state

### Storage

Use:

```text
Cloudflare R2
AWS S3
or another S3-compatible object storage
```

### Authentication

University email verification using:

```text
Email OTP / verification link
```

### Deployment

Frontend:

```text
Vercel
```

Backend:

```text
Railway / Render / Fly.io / AWS
```

Database:

```text
Managed PostgreSQL
```

The final infrastructure can change according to scale and cost.

---

# 33. Suggested Architecture

```text
                    WEB CLIENT
                 Next.js / React
                       │
                       │ HTTPS
                       ▼
              ┌──────────────────┐
              │   API SERVER     │
              │ Node + Express   │
              └────────┬─────────┘
                       │
             ┌─────────┼──────────┐
             │         │          │
             ▼         ▼          ▼
        PostgreSQL   Redis    Object Storage
             │         │          │
             │         │          │
             └─────────┼──────────┘
                       │
                       ▼
                 Moderation
                    Service
```

Real-time chat:

```text
User A
  │
  │ WebSocket
  ▼
Socket.IO
  │
  ▼
Backend
  │
  ▼
Socket.IO
  │
  │ WebSocket
  ▼
User B
```

---

# 34. Database Entities

Initial database design should contain approximately:

```text
users
universities
anonymous_profiles
interests
user_interests

posts
comments
post_likes

conversations
conversation_members
messages
message_attachments

communities
community_members

matches
match_requests

reports
blocks
moderation_events

events
notifications
```

Keep real identity data logically separated from public anonymous profile data.

---

# 35. Security Requirements

Implement:

* HTTPS
* password hashing if passwords are used
* secure authentication
* JWT/session security
* authorization checks
* input validation
* SQL injection protection
* XSS protection
* CSRF protection where applicable
* rate limiting
* secure file upload validation
* file size limits
* MIME type validation
* image processing
* access-controlled object storage
* secure WebSocket authentication
* audit logging for admin actions

Never trust client-side authorization.

Every sensitive action must be validated on the backend.

---

# 36. Anonymous Identity Security

Never send this to the frontend unless absolutely necessary:

```text
real_name
email
phone
internal_user_id
IP address
private moderation data
```

Public API should return something like:

```json
{
  "anonymousId": "anon_82k19",
  "displayName": "Anonymous Fox #2841",
  "avatar": "...",
  "department": "Computer Science",
  "semester": 5
}
```

Not:

```json
{
  "userId": 18291,
  "email": "student@university.edu",
  "name": "Ali"
}
```

---

# 37. MVP — Version 1

Do NOT implement every feature initially.

The first MVP should contain only:

### Authentication

* University email verification
* Login
* Logout

### Anonymous Identity

* Anonymous username
* Anonymous avatar
* Optional department/semester

### Feed

* Create post
* View posts
* Like
* Comment
* Delete own post
* Report post

### Chat

* 1-to-1 anonymous chat
* Real-time messaging
* Images
* Block
* Report

### Moderation

* Basic content moderation
* Report system
* Admin dashboard
* User suspension/ban

### Notifications

* New message
* New comment

That is enough to test the product.

---

# 38. Version 2

After validating the MVP, add:

```text
Anonymous matching
Interest matching
Communities
Study partner finder
FYP partner finder
Skills
Lost & Found
Events
Societies
```

---

# 39. Version 3

After achieving meaningful campus adoption:

```text
AI Campus Assistant
AI-powered recommendations
AI moderation improvements
Career section
Internship section
Verified societies
University partnerships
Multiple universities
Mobile applications
```

---

# 40. Mobile Application

After validating the web product, build:

```text
React Native / Expo
```

Mobile app should use the same backend API and WebSocket infrastructure.

Do not build web and mobile simultaneously during the initial MVP unless there is a strong reason.

---

# 41. User Journey

Typical user:

```text
Visit Website
      ↓
University Email
      ↓
Verify
      ↓
Anonymous Profile Created
      ↓
Choose Interests
      ↓
Enter Campus
      ↓
View Feed
      ↓
Create Post / Comment
      ↓
Discover Student
      ↓
Start Anonymous Chat
      ↓
Share Image / Information
      ↓
Optional Identity Reveal
```

---

# 42. Example Real-World Use Cases

### Use Case 1 — Academic

Student:

> "Does anyone understand today's lecture?"

Another student replies anonymously.

They start a private anonymous chat and study together.

---

### Use Case 2 — FYP

Student:

> "I know Python and React. Looking for someone interested in ML."

Another student discovers the post and contacts them.

They eventually become an FYP team.

---

### Use Case 3 — Campus Problem

Student:

> "Library has no seats after 5 PM."

Other students discuss possible alternatives.

---

### Use Case 4 — Lost & Found

Student finds a wallet.

Posts anonymously:

> "Found near CS Lab."

Owner contacts them.

---

### Use Case 5 — Networking

Student wants to meet other AI enthusiasts.

They select:

```text
AI/ML
Python
Research
```

and find compatible students.

---

### Use Case 6 — Anonymous Discussion

A student wants to discuss a campus experience without immediately attaching their real name.

They post anonymously and other verified students can discuss it.

Moderation and reporting must still apply.

---

# 43. Product Philosophy

The application should follow these principles:

### Privacy First

Users should control what information they reveal.

### Verified Community

Only verified university members should participate in university-specific spaces.

### Anonymous but Accountable

Users are anonymous to other students, but the platform needs reasonable abuse-prevention mechanisms.

### Useful, Not Just Entertaining

The application should help students:

* communicate
* study
* network
* find teammates
* find opportunities
* discover events
* solve campus problems

### Community First

The goal is to create a digital university community rather than simply another messaging application.

---

# 44. Potential Future Business Model

Initially:

```text
Free for students
```

Later:

### University partnerships

Universities may use the platform for:

* student engagement
* communities
* events
* announcements
* feedback

### Sponsored student offers

Local businesses can advertise:

* food discounts
* student deals
* events
* services

### Event promotion

Societies and businesses can promote events.

### Optional premium features

Potential features:

* advanced discovery
* additional profile customization
* advanced matching

Core communication should remain accessible.

---

# 45. Initial Launch Strategy

Do NOT launch nationally.

Start with:

```text
ONE UNIVERSITY
```

Target:

```text
First 30 users
      ↓
100 users
      ↓
300 users
      ↓
500 users
      ↓
1000+ users
```

Use:

* student ambassadors
* QR codes
* university societies
* student groups
* campus events
* word of mouth

The first objective is not revenue.

The first objective is:

> **Do students repeatedly use the platform without being forced to?**

---

# 46. Key Product Metrics

Track:

```text
Daily Active Users
Weekly Active Users

Messages per user
Posts per user
Comments per post

7-day retention
30-day retention

New users per day
Invites per user

Number of active conversations
Number of active communities

Reports per 1000 users
Moderation actions
```

Especially monitor:

> **7-day retention**

and:

> **How many users initiate at least one meaningful conversation?**

---

# 47. Success Criteria for MVP

Do not immediately judge the startup by revenue.

First determine:

1. Are students willing to verify their university identity?
2. Do they actually create posts?
3. Do they initiate anonymous chats?
4. Do they return after the first day?
5. Do students invite friends?
6. Do students use it for useful purposes rather than only gossip?
7. Can moderation control abuse?
8. Can the platform maintain privacy while still preventing serious abuse?

If these signals are positive, continue building.

---

# 48. Final Product Vision

The long-term vision is:

```text
                 DIGITAL CAMPUS
                      │
        ┌─────────────┼─────────────┐
        │             │             │
      SOCIAL        ACADEMIC       CAREER
        │             │             │
      Chat          Study         Jobs
      Feed          FYP           Internships
      Match         Partners      Networking
        │             │             │
        └─────────────┼─────────────┘
                      │
                   CAMPUS
                      │
        ┌─────────────┼─────────────┐
        │             │             │
     Events       Societies     Lost & Found
        │             │             │
        └─────────────┼─────────────┘
                      │
                VERIFIED STUDENTS
                      │
               ANONYMOUS IDENTITY
```

The product should ultimately feel like:

> **Reddit + WhatsApp + Discord + university community + student networking — designed specifically for one university and built around privacy.**

The initial MVP, however, should remain much smaller:

```text
University Verification
        ↓
Anonymous Identity
        ↓
Anonymous Feed
        ↓
Comments
        ↓
1-to-1 Real-Time Chat
        ↓
Image Sharing
        ↓
Block / Report
        ↓
Moderation Dashboard
```

Build this first, get real students using it, collect feedback, and only then expand into matching, FYP finder, communities, events, career, AI assistant, and multi-university support.


# Anonymous University Social Network

## Complete Product, Technical & Development Documentation

**Platform:** React Native Mobile Application
**Frontend:** React Native + Expo
**Backend:** Node.js + Express.js
**Database:** PostgreSQL
**Cache / Real-Time Infrastructure:** Redis + Socket.IO
**Storage:** S3-compatible Object Storage / Cloudflare R2
**Authentication:** University Email Verification
**Architecture:** Mobile Client → REST API / WebSocket → Backend → PostgreSQL / Redis / Object Storage
**Initial Market:** One University
**Long-Term Vision:** Multi-University Student Social Network

---

# 1. PRODUCT VISION

The application is a university-focused anonymous social networking and communication platform.

Students verify that they belong to a university, but their real identity is hidden from other students.

The application should not simply be an anonymous chat app.

It should become a:

> **Digital Anonymous Campus**

where students can:

* communicate
* post anonymously
* discuss university life
* ask academic questions
* find study partners
* find FYP/project partners
* discover students with similar interests
* chat privately
* join communities
* discover societies/events
* discuss careers/internships
* report problems
* find lost/found items
* network without immediately exposing their real identity

The existing product specification defines this as anonymity from other users rather than unrestricted anonymity from the platform. The backend may retain minimum identity/security information required for verification, abuse prevention, moderation, and applicable legal requirements.

---

# 2. PRODUCT PHILOSOPHY

The entire system should follow five principles.

## 2.1 Privacy First

A student's real identity should not be publicly exposed.

Other students should not see:

* real name
* university email
* phone number
* internal database ID
* authentication identifiers
* private metadata

---

## 2.2 Anonymous But Accountable

Anonymous does NOT mean:

> "Nobody can ever identify the user."

Instead:

> "Your real identity is hidden from other students."

The platform itself needs enough information to:

* verify university membership
* prevent abuse
* enforce bans
* investigate serious reports
* protect the platform
* satisfy applicable legal requirements

---

# 3. TARGET USERS

## Primary

* University students
* Undergraduate students
* Postgraduate students

## Future

* University societies
* Student clubs
* Departments
* Campus organizations
* Verified university representatives
* Student-focused businesses

---

# 4. INITIAL LAUNCH STRATEGY

Do NOT launch with 50 universities.

Start with:

```text
ONE UNIVERSITY
       ↓
Validate product
       ↓
Improve retention
       ↓
Build community
       ↓
Add more universities
```

Example:

```text
Phase 1
UET Lahore

Phase 2
Other Lahore universities

Phase 3
Pakistan universities

Phase 4
International universities
```

The backend must nevertheless be designed as multi-university from the beginning.

---

# 5. HIGH-LEVEL SYSTEM ARCHITECTURE

```text
                    ┌───────────────────────┐
                    │   React Native App    │
                    │       Expo           │
                    └───────────┬───────────┘
                                │
                     HTTPS / REST API
                                │
                       WebSocket / Socket.IO
                                │
                                ▼
                 ┌──────────────────────────┐
                 │     Node.js Backend       │
                 │        Express.js         │
                 │                          │
                 │ Auth                      │
                 │ Users                     │
                 │ Feed                      │
                 │ Chat                      │
                 │ Matching                  │
                 │ Communities               │
                 │ Moderation                │
                 │ Notifications              │
                 └───────┬─────────┬────────┘
                         │         │
              ┌──────────┘         └─────────────┐
              ▼                                  ▼
       ┌──────────────┐                   ┌──────────────┐
       │ PostgreSQL   │                   │    Redis     │
       │              │                   │              │
       │ Users        │                   │ Cache        │
       │ Posts        │                   │ Sessions     │
       │ Messages     │                   │ Rate limits  │
       │ Communities  │                   │ Presence     │
       │ Reports      │                   │ Queues       │
       └──────────────┘                   └──────────────┘
                                               
                         ┌─────────────────────┐
                         │ Object Storage      │
                         │ S3 / Cloudflare R2  │
                         │                     │
                         │ Images              │
                         │ PDFs                │
                         │ Documents           │
                         └─────────────────────┘
```

---

# 6. TECHNOLOGY STACK

# Mobile

Use:

```text
React Native
Expo
Expo Router
JavaScript
```

Recommended libraries:

```text
@tanstack/react-query
zustand
axios
socket.io-client
expo-secure-store
expo-image-picker
expo-notifications
expo-file-system
expo-image
expo-linking
expo-device
```

Additional packages should only be introduced when a real requirement exists.

---

# 7. WHY EXPO

Expo should handle:

* Android
* iOS
* push notifications
* image picker
* permissions
* secure storage
* deep linking
* device information
* builds

The initial development target should be Android because the first university launch can be validated quickly.

Later:

```text
Android
+
iOS
```

---

# 8. BACKEND

Use:

```text
Node.js
Express.js
JavaScript
```

Backend responsibilities:

* authentication
* university verification
* user management
* anonymous identity generation
* authorization
* posts
* comments
* likes
* chats
* messages
* media uploads
* matching
* communities
* reports
* blocks
* moderation
* notifications
* search
* admin operations

---

# 9. DATABASE

Use:

```text
PostgreSQL
```

PostgreSQL should be the source of truth.

Redis should NOT replace PostgreSQL.

Redis is for:

* caching
* temporary state
* rate limiting
* online presence
* WebSocket-related state
* queues
* short-lived data

---

# 10. OBJECT STORAGE

Never store large images/files directly inside PostgreSQL.

Use:

```text
Cloudflare R2
OR
AWS S3
OR
another S3-compatible provider
```

Database stores:

```text
storage_key
file_name
file_type
file_size
mime_type
width
height
created_at
```

---

# 11. PROJECT STRUCTURE

## React Native

```text
mobile/
│
├── app/
│   ├── _layout.js
│   │
│   ├── index.js
│   │
│   ├── (auth)/
│   │   ├── login.js
│   │   ├── verify-email.js
│   │   ├── create-identity.js
│   │   └── interests.js
│   │
│   ├── (tabs)/
│   │   ├── _layout.js
│   │   ├── index.js
│   │   ├── discover.js
│   │   ├── create.js
│   │   ├── chats.js
│   │   └── profile.js
│   │
│   ├── post/
│   │   └── [id].js
│   │
│   ├── chat/
│   │   └── [conversationId].js
│   │
│   ├── community/
│   │   └── [id].js
│   │
│   ├── user/
│   │   └── [id].js
│   │
│   ├── settings/
│   │   ├── index.js
│   │   ├── privacy.js
│   │   ├── notifications.js
│   │   └── blocked-users.js
│   │
│   └── matching/
│       ├── index.js
│       ├── study.js
│       └── fyp.js
│
├── src/
│   ├── components/
│   ├── features/
│   ├── services/
│   ├── store/
│   ├── hooks/
│   ├── utils/
│   ├── constants/
│   ├── types/
│   └── config/
│
├── assets/
│
├── package.json
└── app.json
```

---

# 12. BACKEND PROJECT STRUCTURE

```text
server/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.js
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── storage.js
│   │
│   ├── modules/
│   │
│   │   ├── auth/
│   │   ├── users/
│   │   ├── universities/
│   │   ├── anonymousProfiles/
│   │   ├── posts/
│   │   ├── comments/
│   │   ├── likes/
│   │   ├── conversations/
│   │   ├── messages/
│   │   ├── attachments/
│   │   ├── matching/
│   │   ├── communities/
│   │   ├── events/
│   │   ├── societies/
│   │   ├── lostFound/
│   │   ├── reports/
│   │   ├── blocks/
│   │   ├── moderation/
│   │   ├── notifications/
│   │   ├── search/
│   │   └── admin/
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── rateLimit.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   │
│   ├── sockets/
│   │   ├── index.js
│   │   ├── chat.js
│   │   └── presence.js
│   │
│   ├── jobs/
│   │
│   ├── utils/
│   │
│   ├── app.js
│   └── server.js
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
│
├── tests/
│
├── .env
├── package.json
└── README.md
```

---

# 13. DATABASE DESIGN

Use Prisma ORM with PostgreSQL.

Core entities:

```text
University
User
AnonymousProfile
Interest
UserInterest
Skill
UserSkill

Post
Comment
PostLike

Conversation
ConversationMember
Message
MessageAttachment
MessageReaction

Community
CommunityMember

MatchPreference
Match
MatchRequest

StudyRequest
FypRequest

Event
Society

LostFoundPost

Report
Block
ModerationEvent

Notification
DeviceToken

IdentityRevealRequest

AdminUser
AdminAction
```

---

# 14. USER DATABASE MODEL

Conceptually:

```text
User

id
university_id
email
email_verified
status
role
created_at
updated_at
last_active_at
```

Important:

The public API must never return the raw `User` record.

The real account identity and anonymous identity should remain separate.

---

# 15. ANONYMOUS PROFILE

```text
AnonymousProfile

id
user_id
display_name
avatar
department
semester
bio
visibility_settings
created_at
updated_at
```

Example:

```text
Anonymous Fox #2841

Computer Science
5th Semester

AI/ML
React
Startups
```

---

# 16. ANONYMOUS ID GENERATION

Generate identities such as:

```text
Anonymous Fox #2841
Anonymous Panda #8122
Anonymous Tiger #1931
Anonymous Falcon #7712
```

The number should be generated server-side.

Do not expose sequential database IDs.

---

# 17. INTEREST SYSTEM

Example interests:

```text
AI/ML
Web Development
Mobile Development
Cyber Security
Gaming
Startups
Photography
Sports
Movies
Programming
Research
Freelancing
Blockchain
Cloud
DevOps
UI/UX
```

Database:

```text
Interest
UserInterest
```

Many-to-many relationship.

---

# 18. AUTHENTICATION FLOW

```text
Open App
   ↓
Enter University Email
   ↓
Backend validates domain
   ↓
Generate verification code
   ↓
Send email
   ↓
User enters code
   ↓
Backend verifies
   ↓
Create authenticated session
   ↓
Create anonymous identity
   ↓
Choose interests
   ↓
Enter application
```

Example university:

```text
@uet.edu.pk
```

But university domains must be configurable.

---

# 19. AUTH SECURITY

Never store:

```text
plain passwords
plain OTPs
```

Use:

```text
hashed OTP
short expiration
attempt limits
rate limits
```

For authentication sessions:

Use secure token/session strategy.

Mobile token storage:

```text
Expo SecureStore
```

Do not store authentication tokens in ordinary AsyncStorage unless there is a deliberate security reason.

---

# 20. HOME SCREEN

Main mobile navigation:

```text
HOME
DISCOVER
CREATE
CHATS
PROFILE
```

Home should contain:

```text
University
↓
Feed categories
↓
Posts
```

Categories:

```text
Trending
Recent
Popular
Academic
Career
Campus
Random
```

These categories come from the original product specification.

---

# 21. POST SYSTEM

Users can create:

```text
Text post
Image post
Multiple image post
Link
```

Future:

```text
Video
Poll
```

Post:

```text
Anonymous identity
content
attachments
category
created_at
likes
comments
```

---

# 22. POST API

Example:

```http
POST /api/posts
GET /api/posts
GET /api/posts/:id
DELETE /api/posts/:id
POST /api/posts/:id/like
DELETE /api/posts/:id/like
POST /api/posts/:id/report
```

Feed must use pagination.

Do NOT load 500 posts at once.

Use:

```text
cursor pagination
```

for production feeds.

---

# 23. COMMENTS

Anonymous comments.

Example:

```text
Anonymous Fox #2841:
Anyone else struggling with DBMS?

Anonymous Panda #8122:
Yes 😂

Anonymous Tiger #1931:
Same.
```

Comments should support:

```text
create
delete own
report
like
reply
```

---

# 24. CHAT SYSTEM

Private anonymous 1-to-1 chat.

Example:

```text
Anonymous Fox #2841
          ↕
Anonymous Panda #8122
```

Supported:

* text
* emojis
* images
* documents
* replies
* reactions
* delete
* report
* block
* mute

Voice messages can be future functionality. The original specification explicitly lists voice as future support.

---

# 25. CHAT ARCHITECTURE

Use:

```text
REST API
+
Socket.IO
```

REST handles:

```text
conversation history
message pagination
attachments
conversation creation
```

Socket.IO handles:

```text
new message
typing
online status
read receipt
message reaction
message deletion
```

Architecture:

```text
React Native
     │
     │ WebSocket
     ▼
Socket.IO Server
     │
     ├── Redis
     │
     └── PostgreSQL
```

---

# 26. MESSAGE FLOW

```text
User A
  ↓
React Native
  ↓
Socket.IO
  ↓
Authentication
  ↓
Authorization
  ↓
Validate message
  ↓
Moderation
  ↓
Save PostgreSQL
  ↓
Emit to User B
  ↓
Notification if offline
```

Never trust the mobile client.

---

# 27. MESSAGE DATABASE

```text
Message

id
conversation_id
sender_user_id
content
message_type
reply_to_message_id
created_at
edited_at
deleted_at
moderation_status
```

Attachment:

```text
MessageAttachment

id
message_id
storage_key
file_name
mime_type
file_size
url_or_reference
created_at
```

---

# 28. BLOCK SYSTEM

If A blocks B:

```text
A → B
```

Then:

* B cannot message A
* B cannot initiate interaction with A
* depending on product rules, their content may disappear from discovery
* notifications should stop
* existing conversation access can be restricted

Blocking must be enforced server-side.

---

# 29. REPORT SYSTEM

Report reasons:

```text
Harassment
Bullying
Spam
Threat
Sexual Content
Scam
Impersonation
Doxxing
Other
```

These categories are aligned with the existing specification.

---

# 30. MODERATION FLOW

```text
User Content
      ↓
Basic validation
      ↓
Automated moderation
      ↓
Safe ───────────────→ Publish
      │
      ├── Suspicious → Review
      │
      └── High Risk → Restrict / Review
```

AI moderation should be a support system.

Human administrators should handle serious/ambiguous decisions.

---

# 31. ADMIN DASHBOARD

The mobile app is for students.

Admin dashboard can initially be a separate web application.

Recommended:

```text
Next.js
```

Admin dashboard:

```text
Dashboard
Users
Reports
Posts
Comments
Messages
Flagged Content
Banned Users
Suspended Users
Communities
Events
Universities
Moderation
Audit Logs
System Settings
```

---

# 32. ADMIN ACTIONS

Admin can:

```text
Review
Warn
Remove content
Restrict user
Suspend user
Ban user
Dismiss report
Restore content
```

Every sensitive action must create:

```text
AdminAction
```

Example:

```text
admin_id
target_user_id
action
reason
created_at
```

---

# 33. ADMIN ACCESS TO REAL IDENTITY

Real identity information should have restricted access.

Normal admin:

```text
Anonymous Fox #2841
```

Only authorized administrative workflows should expose identifying information when genuinely required.

Every such access should be audited.

---

# 34. MATCHING SYSTEM

Feature:

> Find Someone

User selects:

```text
Department
Semester
Topic
Purpose
```

Purpose:

```text
Study
Networking
Friends
Project
Random
```

This matches the product concept already defined in the specification.

---

# 35. MATCHING ALGORITHM — V1

Do NOT start with AI.

Start with deterministic scoring.

Example:

```text
Department match       +30
Semester match         +20
Interest overlap       +30
Purpose match          +20
```

Maximum:

```text
100
```

Example:

```text
Student A

CS
5th
AI
Python
Project
```

Student B:

```text
CS
5th
AI
React
Project
```

Score:

```text
Department  = 30
Semester    = 20
Interests   = 15
Purpose     = 20

Total = 85
```

Then sort candidates.

Later use ML/recommendation models.

---

# 36. INTEREST MATCHING

Use many-to-many interests.

Example:

```text
User A:
AI
Python
Startups

User B:
AI
Python
Entrepreneurship
```

Common interests:

```text
AI
Python
```

This increases compatibility.

---

# 37. IDENTITY REVEAL

Initially:

```text
Anonymous Fox
       ↕
Anonymous Panda
```

A user can request:

```text
Reveal Identity
```

Other user sees:

```text
Anonymous Fox wants to reveal identities.

[Accept]
[Reject]
```

Only if both agree:

```text
Identity Revealed
```

This must never happen automatically.

---

# 38. ACADEMIC COMMUNITIES

Structure:

```text
Academics
   │
   ├── Computer Science
   ├── Software Engineering
   ├── Electrical Engineering
   ├── Mathematics
   └── Physics
```

Inside:

```text
Courses
Assignments
Exams
Study Material
Questions
Discussion
```

Students remain anonymous.

---

# 39. STUDY PARTNER FINDER

User creates:

```text
Subject:
Database Systems

Semester:
5

Study Mode:
Online / Campus

Availability:
Evening

Goal:
Exam preparation
```

System finds compatible users.

---

# 40. FYP / PROJECT PARTNER FINDER

User:

```text
Skills:
Python
React
Machine Learning

Looking for:
Backend Developer
ML Engineer

Project:
AI Recommendation System
```

Other students can discover the request.

---

# 41. SKILLS & NETWORKING

Skills:

```text
Python
JavaScript
React
React Native
Node.js
Flutter
Java
C++
Machine Learning
Cyber Security
UI/UX
DevOps
Cloud
```

Students can choose:

```text
I can help with
```

and:

```text
I am looking for
```

This creates a student networking layer.

---

# 42. COMMUNITIES

Communities can be:

```text
Computer Science
AI/ML
Cyber Security
Gaming
Startups
Programming
Photography
Sports
Movies
```

Community structure:

```text
Community
   ↓
Members
   ↓
Posts
   ↓
Comments
```

Community moderators can be introduced later.

---

# 43. SOCIETIES

Future verified society system.

Example:

```text
Google Developer Student Club
AI Society
Programming Society
Sports Society
```

Society accounts should be separately verified.

Students can:

```text
Follow
Join
View events
View announcements
```

---

# 44. EVENTS

Events:

```text
Hackathon
Seminar
Workshop
Sports Event
Society Event
Career Fair
Competition
```

Event:

```text
title
description
location
start_time
end_time
organizer
image
registration_link
```

Future:

```text
RSVP
Attendees
Reminders
Calendar integration
```

---

# 45. LOST & FOUND

Students can anonymously post:

```text
Found wallet near CS Lab.
```

Post contains:

```text
description
location
date
image
category
```

Categories:

```text
Wallet
Phone
ID Card
Keys
Laptop
Books
Other
```

Sensitive information should not be unnecessarily exposed.

---

# 46. CAREER / INTERNSHIP

Community:

```text
Career
Internships
Jobs
Freelancing
CV
Interview Preparation
```

Students can discuss:

```text
internships
companies
interviews
skills
career paths
```

Later verified employers can be introduced.

---

# 47. SEARCH

Search:

```text
Students
Posts
Communities
Events
Societies
Academic topics
```

Search must respect:

```text
privacy
blocks
university boundaries
permissions
```

Never expose users who have restricted discoverability.

---

# 48. NOTIFICATIONS

Push notifications:

```text
New message
New comment
Reply
Like
Match
Match request
Identity reveal request
Community activity
Event reminder
Moderation action
```

Use Expo Notifications.

Backend stores device tokens:

```text
DeviceToken

id
user_id
token
platform
created_at
last_used_at
```

---

# 49. REDIS

Redis should handle:

```text
Rate limiting
Caching
Online presence
Typing state
Temporary matching state
Session-related temporary state
Queues
```

Example:

```text
user:123:online
```

TTL-based state.

---

# 50. RATE LIMITING

Protect:

```text
Login
OTP
Post creation
Comments
Messages
Reports
Matching
File uploads
Search
```

Example conceptual limits:

```text
OTP:
few requests / time window

Posts:
reasonable hourly limit

Messages:
reasonable per-minute limit

Reports:
limited to prevent report abuse
```

Exact limits should be configurable.

---

# 51. FILE UPLOAD SECURITY

Never blindly accept uploads.

Validate:

```text
MIME type
File extension
File size
Actual file signature
```

For images:

```text
Resize
Compress
Strip unnecessary metadata where appropriate
Generate safe variants
```

Never trust:

```text
filename
extension
client MIME type
```

---

# 52. API SECURITY

Backend must implement:

```text
Authentication
Authorization
Input validation
Rate limiting
CORS
Secure headers
SQL injection protection
XSS-aware output handling
File upload validation
Access control
Audit logging
```

All API inputs should be validated.

Use schema validation.

---

# 53. AUTHORIZATION

Authentication answers:

> Who are you?

Authorization answers:

> Are you allowed to do this?

Example:

User A must not be able to:

```text
delete User B's post
read User B's private conversation
edit another user's profile
access admin endpoints
```

Authorization must always be enforced on backend.

---

# 54. MOBILE STATE MANAGEMENT

Use two different concepts.

## Server State

Use:

```text
TanStack Query
```

For:

```text
posts
comments
communities
users
matches
events
notifications
```

## Client State

Use:

```text
Zustand
```

For:

```text
auth state
theme
UI state
chat UI state
temporary app state
```

Do not put everything into one global store.

---

# 55. API CLIENT

Create:

```text
src/services/api.js
```

Central Axios instance.

Concept:

```text
Axios
   ↓
baseURL
   ↓
auth interceptor
   ↓
refresh/session handling
   ↓
API
```

Never hard-code production URLs throughout components.

---

# 56. ENVIRONMENT CONFIGURATION

Mobile:

```text
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SOCKET_URL=
```

Backend:

```text
PORT=
DATABASE_URL=
REDIS_URL=

JWT_SECRET=
SESSION_SECRET=

SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=

S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

```

Secrets must never be committed to Git.

---

# 57. API MODULES

Recommended API structure:

```text
/api/auth
/api/users
/api/universities
/api/profiles

/api/posts
/api/comments
/api/likes

/api/conversations
/api/messages
/api/attachments

/api/matching
/api/study
/api/fyp

/api/communities
/api/events
/api/societies

/api/lost-found

/api/reports
/api/blocks

/api/notifications

/api/search

/api/admin
```

---

# 58. REST API DESIGN

Use consistent responses.

Example:

```json
{
  "success": true,
  "data": {},
  "message": "Post created successfully"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input"
  }
}
```

Never expose stack traces in production.

---

# 59. PAGINATION

Feeds:

```text
cursor pagination
```

Example:

```http
GET /api/posts?cursor=abc123&limit=20
```

Response:

```json
{
  "items": [],
  "nextCursor": "xyz789",
  "hasMore": true
}
```

React Native uses this for infinite scrolling.

---

# 60. REACT NATIVE FEED PERFORMANCE

Use:

```text
FlatList
```

or:

```text
FlashList
```

if justified.

Avoid:

```text
ScrollView
```

for thousands of posts.

Optimize:

```text
images
memoization
list rendering
pagination
network requests
```

---

# 61. MOBILE NAVIGATION

Use Expo Router.

Structure:

```text
Authentication Stack
        ↓
Main Tabs
        ↓
Detail Screens
```

Main:

```text
Home
Discover
Create
Chats
Profile
```

---

# 62. DISCOVER SCREEN

Sections:

```text
Find Someone
Study Partners
FYP Partners
Communities
Interests
Events
Societies
```

Example:

```text
Who are you looking for?

[Study Partner]
[FYP Partner]
[Networking]
[Friends]
[Random]
```

---

# 63. PROFILE SCREEN

Anonymous profile:

```text
Avatar

Anonymous Fox #2841

Computer Science
5th Semester

Interests:
AI
React
Startups

Skills:
Python
Node.js
React Native

Looking for:
FYP Partner
Networking
```

Buttons:

```text
Edit Profile
Privacy
Blocked Users
Notifications
Logout
```

---

# 64. PRIVACY SETTINGS

User controls:

```text
Show department
Show semester
Show interests
Show skills
Allow discovery
Allow messages
```

Potential settings:

```text
Who can message me?
Everyone
Matched users
Nobody
```

---

# 65. CHAT UI

WhatsApp-style structure:

```text
Header
Anonymous identity

Messages
   ↓
Text bubble
Image bubble
File bubble

Input
Emoji
Attachment
Send
```

Future:

```text
Voice
Video
```

---

# 66. CHAT PRESENCE

Use:

```text
online
offline
last seen
typing
```

Privacy settings should allow users to control visibility.

---

# 67. MESSAGE DELIVERY STATES

Support:

```text
sending
sent
delivered
read
failed
```

Do not rely only on local UI.

Backend should maintain message state.

---

# 68. OFFLINE SUPPORT

The mobile app should gracefully handle:

```text
No internet
Slow internet
Socket disconnected
API timeout
```

For example:

```text
Socket disconnected

Reconnecting...
```

Queued outgoing messages can be considered later.

---

# 69. ERROR HANDLING

Every screen should handle:

```text
Loading
Success
Empty
Error
Retry
```

Example:

```text
Loading posts...

No posts yet.

Something went wrong.
[Retry]
```

Never leave blank screens.

---

# 70. DESIGN SYSTEM

Create reusable components:

```text
Button
Input
Avatar
AnonymousAvatar
PostCard
CommentCard
MessageBubble
CommunityCard
UserCard
MatchCard
Modal
BottomSheet
Loader
EmptyState
ErrorState
ReportModal
```

Use consistent:

```text
spacing
typography
border radius
icons
colors
dark mode
```

---

# 71. THEME

Support:

```text
Light
Dark
System
```

Store preference locally.

---

# 72. DEEP LINKING

Future links:

```text
anonymousapp://post/123
anonymousapp://chat/456
anonymousapp://community/789
```

Useful for:

* notifications
* sharing
* invitations

---

# 73. PUSH NOTIFICATION FLOW

```text
Backend
   ↓
Push Service
   ↓
Expo Notification
   ↓
Phone
   ↓
User taps
   ↓
Deep Link
   ↓
Correct screen
```

Example:

New message notification:

```text
Anonymous Panda sent you a message
```

Tap:

```text
/chat/123
```

---

# 74. MODERATION ARCHITECTURE

Create:

```text
ModerationService
```

Inputs:

```text
post
comment
message
profile
report
```

Outputs:

```text
SAFE
REVIEW
RESTRICT
```

Do not make AI the final authority for every moderation decision.

---

# 75. REPORTING FLOW

```text
User
 ↓
Report
 ↓
Select reason
 ↓
Optional description
 ↓
Backend creates report
 ↓
Moderation queue
 ↓
Admin review
 ↓
Action
```

---

# 76. ANTI-SPAM SYSTEM

Signals:

```text
too many posts
too many messages
repeated content
rapid account activity
many reports
suspicious link sharing
mass messaging
```

System can:

```text
warn
rate limit
temporarily restrict
send to moderation
suspend
```

---

# 77. ACCOUNT STATES

User:

```text
ACTIVE
RESTRICTED
SUSPENDED
BANNED
DELETED
```

Every protected API should check account status.

---

# 78. UNIVERSITY ISOLATION

Very important.

A user from University A should not automatically see:

```text
University B
```

unless cross-university functionality is explicitly enabled.

Every major query should respect:

```text
university_id
```

---

# 79. MULTI-UNIVERSITY ARCHITECTURE

Database:

```text
universities
      ↓
users
      ↓
profiles
posts
communities
events
```

Every university-specific resource must be associated with a university.

This allows future expansion without rebuilding the system.

---

# 80. ANALYTICS

Track product metrics without unnecessarily exposing personal identity.

Important metrics:

```text
Daily Active Users
Weekly Active Users
Monthly Active Users

Posts/day
Comments/day
Messages/day

New users
Verified users
Active users

Match requests
Successful matches

Reports
Moderation actions

Retention
```

---

# 81. PRODUCT EVENTS

Example events:

```text
USER_REGISTERED
EMAIL_VERIFIED
PROFILE_COMPLETED
POST_CREATED
COMMENT_CREATED
MESSAGE_SENT
MATCH_CREATED
COMMUNITY_JOINED
REPORT_CREATED
IDENTITY_REVEAL_REQUESTED
```

These can later support analytics.

---

# 82. ADMIN ANALYTICS

Dashboard:

```text
Total Users
Verified Users
Active Today
Posts Today
Messages Today
Reports Today
Pending Reports
Banned Users
```

Charts:

```text
DAU
WAU
MAU
Posts/day
Messages/day
Retention
```

---

# 83. TESTING

Backend:

```text
Unit tests
Integration tests
API tests
Authorization tests
Security tests
```

Mobile:

```text
Component tests
Navigation tests
API integration tests
```

Critical flows:

```text
Registration
Verification
Login
Post
Comment
Chat
Block
Report
Matching
Notifications
```

---

# 84. SECURITY TESTING

Test:

```text
Unauthorized API access
IDOR
Broken access control
SQL injection
Rate-limit bypass
File upload abuse
Token misuse
WebSocket authorization
Admin endpoint access
Cross-university access
```

Especially test:

> Can User A access User B's private data by changing an ID?

The answer must always be:

```text
NO
```

---

# 85. DATABASE INDEXES

Index high-query columns:

```text
users.university_id
users.email

posts.university_id
posts.created_at

comments.post_id

messages.conversation_id
messages.created_at

conversation_members.user_id

notifications.user_id

reports.status
reports.created_at
```

Add indexes based on actual query patterns.

---

# 86. TRANSACTIONS

Use PostgreSQL transactions when multiple operations must succeed together.

Example:

Creating a match:

```text
create match
+
create notification
+
update preference state
```

should be handled carefully so partial state is not produced.

---

# 87. BACKGROUND JOBS

Introduce a queue system later.

Possible:

```text
BullMQ
+
Redis
```

Jobs:

```text
send email
send notification
moderation
image processing
cleanup
analytics aggregation
```

Do not block HTTP requests with heavy work.

---

# 88. EMAIL SYSTEM

University verification email:

```text
Enter email
     ↓
Generate OTP
     ↓
Send email
     ↓
Verify
```

Email templates:

```text
Verification
Security alert
Account restriction
Identity reveal
```

---

# 89. DEPLOYMENT ARCHITECTURE

Development:

```text
React Native Expo
localhost backend
PostgreSQL
Redis
local storage
```

Production:

```text
React Native
      ↓
Cloud backend
      ↓
Node.js / Express
      ↓
Managed PostgreSQL
      ↓
Managed Redis
      ↓
Cloudflare R2 / S3
```

---

# 90. CI/CD

Use GitHub.

Branches:

```text
main
develop
feature/*
fix/*
```

Workflow:

```text
Pull Request
    ↓
Lint
    ↓
Tests
    ↓
Build
    ↓
Review
    ↓
Merge
```

---

# 91. MONOREPO

Recommended:

```text
anonymous-campus/
│
├── mobile/
├── server/
├── admin/
├── packages/
│   ├── shared/
│   └── config/
│
├── docs/
└── README.md
```

Shared package can eventually contain:

```text
API schemas
constants
validation schemas
shared utilities
```

---

# 92. DEVELOPMENT PHASES

Do NOT build everything at once.

Use the following sequence.

---

# PHASE 0 — FOUNDATION

Build:

```text
Repository
Monorepo
Mobile project
Backend project
Database
Environment variables
Git
ESLint
Prettier
Basic CI
```

Deliverable:

```text
App opens
Backend runs
Database connects
```

---

# PHASE 1 — AUTHENTICATION

Build:

```text
University configuration
Email input
OTP
Email verification
Session
Logout
Secure token storage
```

Deliverable:

```text
Student can create authenticated account.
```

---

# PHASE 2 — ANONYMOUS IDENTITY

Build:

```text
Anonymous name generator
Avatar
Department
Semester
Interests
Skills
Profile visibility
```

Deliverable:

```text
Ali
   ↓
Anonymous Fox #2841
```

Public API only returns anonymous information.

---

# PHASE 3 — HOME FEED

Build:

```text
Create post
Feed
Categories
Like
Comment
Delete
Report
Pagination
Pull to refresh
Infinite scrolling
```

Deliverable:

A real working anonymous campus feed.

---

# PHASE 4 — CHAT

Build:

```text
Conversation
Socket.IO
Message
Message history
Typing
Read receipt
Online state
Block
Report
```

Deliverable:

Fully functional anonymous 1-to-1 messaging.

---

# PHASE 5 — MEDIA

Build:

```text
Image picker
File picker
Upload
Object storage
Image preview
File preview
Message attachments
Post attachments
```

Deliverable:

Students can send images/documents.

---

# PHASE 6 — MODERATION

Build:

```text
Reports
Blocks
Rate limits
Content moderation
Admin queue
Admin actions
Audit logs
```

Deliverable:

Platform can safely handle abusive users.

---

# PHASE 7 — DISCOVERY

Build:

```text
Find Someone
Interest matching
Student discovery
Search
```

---

# PHASE 8 — STUDY/FYP

Build:

```text
Study Partner
FYP Partner
Skills
Networking
```

---

# PHASE 9 — COMMUNITIES

Build:

```text
Communities
Academic communities
Community posts
Members
Moderators
```

---

# PHASE 10 — EVENTS/SOCIETIES

Build:

```text
Events
Societies
Announcements
RSVP
```

---

# PHASE 11 — LOST & FOUND

Build:

```text
Lost post
Found post
Categories
Location description
Contact anonymously
```

---

# PHASE 12 — IDENTITY REVEAL

Build:

```text
Reveal request
Accept
Reject
Mutual consent
```

---

# PHASE 13 — NOTIFICATIONS

Build:

```text
Push notifications
Notification center
Deep links
Message notifications
Comment notifications
Match notifications
```

---

# PHASE 14 — ADMIN PLATFORM

Build separate:

```text
Admin web application
```

With:

```text
Users
Reports
Moderation
Analytics
Universities
Communities
Events
Audit logs
```

---

# PHASE 15 — PRODUCTION

Before launch:

```text
Security audit
Performance testing
Database optimization
Crash monitoring
Logging
Backup
Recovery
Rate limits
Privacy policy
Terms
Community guidelines
App Store preparation
Google Play preparation
```

---

# 93. MVP DEFINITION

The first public MVP should NOT contain every feature.

MVP:

```text
University verification
        +
Anonymous profile
        +
Feed
        +
Posts
        +
Comments
        +
Likes
        +
1-to-1 anonymous chat
        +
Images
        +
Block
        +
Report
        +
Basic moderation
        +
Push notifications
```

This is enough to test whether students actually want the product.

The original specification similarly identifies authentication, anonymous profile, feed, chat, moderation, and notifications as the MVP foundation.

---

# 94. VERSION 2

After MVP validation:

```text
Matching
Interest matching
Communities
Study partner
FYP finder
Skills
Lost & Found
Events
Societies
```

These features are explicitly included in the original V2 direction.

---

# 95. VERSION 3

Later:

```text
AI Campus Assistant
AI recommendations
Advanced moderation
Career
Internships
Verified societies
University partnerships
Multiple universities
```

---

# 96. FUTURE AI CAMPUS ASSISTANT

Potential system:

```text
Student
   ↓
AI Assistant
   ↓
University Knowledge Base
   ↓
RAG
```

Could answer:

```text
Where is CS department?
When is society event?
What are campus facilities?
Where can I find academic resources?
```

Only use verified university information.

---

# 97. AI RECOMMENDATION SYSTEM

Future:

```text
User behavior
+
Interests
+
Communities
+
Posts
+
Matching history
```

Can improve:

```text
feed ranking
student recommendations
community recommendations
study partner recommendations
FYP recommendations
```

Start with rules.

Then collect enough product data.

Then ML.

---

# 98. REAL-TIME ARCHITECTURE

Socket events:

```text
connection
disconnect

message:send
message:new

message:read

typing:start
typing:stop

presence:update

conversation:join
conversation:leave

message:reaction
message:delete
```

Server must authenticate the socket connection.

---

# 99. SOCKET SECURITY

Never trust:

```text
conversationId
senderId
userId
```

from client.

Server determines:

```text
authenticatedUserId
```

Then verifies:

```text
Is this user a member of this conversation?
```

Only then allow message operations.

---

# 100. DATABASE OWNERSHIP RULE

Every resource must have an ownership/access rule.

Examples:

Post:

```text
Only owner can delete.
```

Message:

```text
Only conversation members can read.
```

Profile:

```text
Only public fields can be exposed.
```

Admin:

```text
Only admin role.
```

---

# 101. MOBILE PERFORMANCE

Optimize:

```text
FlatList/FlashList
image caching
pagination
memoization
query caching
lazy screens
small bundles
compressed images
```

Avoid unnecessary:

```text
re-renders
API calls
large state objects
base64 images
```

Never send giant images directly through JSON.

---

# 102. OFFLINE / NETWORK EXPERIENCE

Handle:

```text
Wi-Fi
Mobile data
Weak signal
Offline
Socket disconnect
Timeout
Server unavailable
```

UI:

```text
No connection
Retry
```

Chat:

```text
Reconnecting...
```

---

# 103. LOGGING

Backend should log:

```text
request ID
route
status
latency
errors
important security events
```

Do NOT log:

```text
OTP
password
authentication secrets
private message content unnecessarily
tokens
```

---

# 104. ERROR MONITORING

Production should have:

```text
Crash monitoring
Backend error monitoring
Performance monitoring
```

Mobile crashes should be traceable without exposing private user data.

---

# 105. BACKUPS

PostgreSQL:

```text
automated backups
```

Need:

```text
backup retention
restore procedure
disaster recovery plan
```

Do not assume:

> "Cloud database means backups are automatically enough."

Test restoration.

---

# 106. LEGAL / TRUST LAYER

Before public launch prepare:

```text
Privacy Policy
Terms of Service
Community Guidelines
Report & Appeal Process
Account Deletion Process
Data Retention Policy
```

Especially important because this is an anonymous social platform.

---

# 107. ACCOUNT DELETION

User should be able to request deletion.

System should define:

```text
what is deleted
what is anonymized
what must be retained temporarily
what happens to posts
what happens to messages
```

Do not simply delete rows blindly if relationships/audit requirements require another approach.

---

# 108. PRIVACY MODEL

Conceptually:

```text
AUTH IDENTITY
      │
      │ private
      ▼
USER ACCOUNT
      │
      │ private mapping
      ▼
ANONYMOUS PROFILE
      │
      │ public
      ▼
OTHER USERS
```

The critical design principle is that the anonymous public identity should be separated from the underlying authentication identity.

---

# 109. DATA FLOW EXAMPLE

Student posts:

```text
"Anyone looking for an AI FYP partner?"
```

Flow:

```text
React Native
      ↓
POST /api/posts
      ↓
Auth middleware
      ↓
User identified
      ↓
Authorization
      ↓
Validation
      ↓
Moderation
      ↓
Post created
      ↓
Post returned using anonymous profile
```

Response should conceptually expose:

```text
Anonymous Fox #2841
```

not:

```text
Ali
ali@email.com
user_id=123
```

---

# 110. CHAT DATA FLOW

```text
Anonymous Fox
      ↓
Message
      ↓
Socket.IO
      ↓
Authenticate
      ↓
Check conversation membership
      ↓
Moderate
      ↓
Persist
      ↓
Redis/presence
      ↓
Anonymous Panda
```

---

# 111. MATCHING DATA FLOW

```text
Student
 ↓
Select preferences
 ↓
Backend
 ↓
University filter
 ↓
Block filter
 ↓
Eligibility filter
 ↓
Interest matching
 ↓
Purpose matching
 ↓
Ranking
 ↓
Candidates
 ↓
Anonymous cards
```

---

# 112. DEVELOPMENT RULE FOR CLAUDE CODE

Claude Code must NOT attempt to implement the entire application in one generation.

It must work:

```text
ONE PHASE
    ↓
ONE MODULE
    ↓
ONE FEATURE
    ↓
TEST
    ↓
REVIEW
    ↓
NEXT MODULE
```

Before modifying architecture, Claude should explain:

```text
What will change?
Why?
Which files?
Database changes?
API changes?
Mobile changes?
Security impact?
```

---

# 113. CLAUDE CODING RULES

Claude must:

1. Use JavaScript unless explicitly instructed otherwise.

2. Use React Native + Expo.

3. Use Expo Router.

4. Use Node.js + Express.

5. Use PostgreSQL.

6. Use Prisma.

7. Use Redis where appropriate.

8. Use Socket.IO for real-time communication.

9. Never put business-critical security logic only in React Native.

10. Never trust client-supplied user IDs.

11. Never expose real identity through public APIs.

12. Never store secrets in source code.

13. Never create duplicate API logic.

14. Reuse components.

15. Use feature-based architecture.

16. Validate all backend inputs.

17. Add authorization checks.

18. Add loading/error/empty states.

19. Add pagination.

20. Add tests for important functionality.

---

# 114. CLAUDE SHOULD NEVER DO THIS

Do NOT allow Claude to:

```text
Generate fake backend responses
Hard-code user IDs
Hard-code authentication
Store secrets in frontend
Expose database IDs
Skip authorization
Use local arrays as permanent database
Use AsyncStorage for sensitive tokens without justification
Store images as base64 in PostgreSQL
Create huge monolithic files
Put everything in App.js
Skip error handling
Skip validation
Skip security
```

---

# 115. CLAUDE DEVELOPMENT OUTPUT FORMAT

For every module Claude should provide:

```text
1. Objective

2. Architecture

3. Files to create

4. Files to modify

5. Database changes

6. API endpoints

7. Backend implementation

8. Mobile implementation

9. Security considerations

10. Tests

11. How to run

12. Expected result
```

---

# 116. FIRST CLAUDE CODE PROMPT

Use this as the initial master instruction:

```text
You are the lead software architect and senior full-stack engineer for my startup.

We are building a production-grade anonymous university social networking and communication platform.

The mobile application must be built with:

- React Native
- Expo
- Expo Router
- JavaScript

The backend must use:

- Node.js
- Express.js
- JavaScript
- Prisma
- PostgreSQL
- Redis
- Socket.IO

Object storage:

- S3-compatible storage / Cloudflare R2

The product concept:

Verified university students can participate in a university-specific digital community while keeping their real identity hidden from other students.

This is NOT an unrestricted anonymous platform.

The user's identity is hidden from other users, but the backend securely maintains the minimum identity information required for authentication, university verification, abuse prevention, moderation, security, and applicable legal requirements.

The application must support:

1. University email verification
2. Anonymous identity
3. Anonymous profile
4. University feed
5. Posts
6. Comments
7. Likes
8. Anonymous 1-to-1 chat
9. Real-time messaging
10. Images and files
11. Blocking
12. Reporting
13. Moderation
14. Admin dashboard
15. Notifications
16. Anonymous matching
17. Interest matching
18. Communities
19. Academic communities
20. Study partner finder
21. FYP/project partner finder
22. Skills/networking
23. Lost & Found
24. Events
25. Societies
26. Career/internship communities
27. Search
28. Optional mutual identity reveal
29. Privacy settings
30. Security controls
31. Analytics

The first release should be an MVP.

MVP:

- University verification
- Anonymous identity
- Anonymous profile
- Feed
- Posts
- Comments
- Likes
- 1-to-1 chat
- Socket.IO
- Images
- Block
- Report
- Basic moderation
- Push notifications

DO NOT build the entire product at once.

Work module-by-module.

Start with PHASE 0 only.

PHASE 0:

1. Create repository structure.
2. Create mobile Expo application.
3. Create Node/Express backend.
4. Configure Prisma.
5. Configure PostgreSQL.
6. Configure Redis.
7. Configure environment variables.
8. Configure ESLint/Prettier.
9. Configure basic Git structure.
10. Create health-check endpoint.
11. Create basic React Native navigation architecture.
12. Create reusable API client.
13. Create initial Zustand store.
14. Create initial TanStack Query configuration.
15. Create development README.

Before writing code:

- Inspect the current repository.
- Do not overwrite existing work without explaining.
- Detect existing package managers and project structure.
- Explain what you are going to create.
- Show the planned folder structure.

Then implement only PHASE 0.

After implementation:

- Run the project.
- Run backend health check.
- Run mobile application.
- Run database connection check.
- Run lint.
- Run tests if applicable.
- Fix errors.

At the end provide:

- Files created
- Files changed
- Commands executed
- Current architecture
- Known issues
- Next recommended module

DO NOT continue to Phase 1 automatically.
```

---

# 117. PHASE 1 CLAUDE PROMPT

After Phase 0 works:

```text
Now implement PHASE 1: Authentication & University Verification.

Requirements:

1. University configuration
2. University email validation
3. Email verification
4. OTP generation
5. Secure OTP hashing
6. OTP expiration
7. OTP attempt limits
8. Rate limiting
9. User creation
10. Session/authentication
11. Secure mobile token/session storage
12. Login
13. Logout
14. Auth persistence
15. Protected routes
16. Auth middleware
17. Authorization foundation

Do not expose:

- real email
- internal user ID
- private account information

through public profile APIs.

Implement:

Backend:
- database models
- migrations
- services
- controllers
- routes
- validation
- middleware
- tests

Mobile:
- login screen
- email verification screen
- loading states
- error states
- auth state
- protected navigation

Before implementation explain:
- database changes
- API endpoints
- authentication architecture
- security model
- mobile auth flow

Then implement and test the complete module.

Do not implement Phase 2 until Phase 1 is working.
```

---

# 118. PHASE 2 CLAUDE PROMPT

```text
Implement PHASE 2: Anonymous Identity & Profile.

Requirements:

- Generate anonymous display name
- Generate unique anonymous number
- Generate avatar
- Department
- Semester
- Interests
- Skills
- Bio
- Privacy settings
- Profile editing
- Anonymous public profile
- Private user/account separation

Important:

The public API must NEVER expose:

- real email
- authentication identity
- private database identifiers
- security metadata

Create proper DTO/serializer logic so internal User objects cannot accidentally be returned.

Implement:
- Prisma models
- migrations
- services
- controllers
- routes
- validation
- mobile screens
- profile components
- tests

Test that another authenticated user cannot retrieve private identity data.
```

---

# 119. PHASE 3 CLAUDE PROMPT

```text
Implement PHASE 3: Anonymous Campus Feed.

Build:

- Home screen
- Feed
- Categories
- Create post
- Text posts
- Image posts
- Likes
- Comments
- Delete own post
- Report post
- Cursor pagination
- Pull to refresh
- Infinite scroll
- Loading state
- Empty state
- Error state

Backend must enforce:

- authentication
- university isolation
- ownership
- validation
- rate limiting
- moderation hook

React Native must use:

- TanStack Query
- FlatList/FlashList
- reusable PostCard
- reusable CommentCard

Do not load the complete feed at once.

Implement tests for:
- create
- read
- update/delete ownership
- likes
- comments
- unauthorized access
- cross-university access
```

---

# 120. PHASE 4 CLAUDE PROMPT

```text
Implement PHASE 4: Anonymous 1-to-1 Real-Time Chat.

Technology:

- Socket.IO
- PostgreSQL
- Redis
- React Native Socket.IO client

Features:

- create conversation
- conversation list
- message history
- send message
- receive message
- typing indicator
- online/offline
- read receipts
- message deletion
- reply
- block
- report
- pagination

Security:

- authenticate socket connection
- never trust sender ID from client
- verify conversation membership
- verify block status
- verify account status
- validate messages
- persist messages
- never expose real identity

Implement:
- Socket.IO server
- event handlers
- database models
- Redis presence
- mobile chat screen
- conversation list
- message bubble
- reconnect handling
- tests
```

---

# 121. PHASE 5 CLAUDE PROMPT

```text
Implement PHASE 5: Media Upload.

Support:

- images
- PDFs
- documents

Use:

- Expo Image Picker
- Expo Document Picker
- S3-compatible object storage

Flow:

React Native
→ request upload
→ backend validates
→ signed upload URL
→ object storage
→ confirm upload
→ database metadata

Do NOT upload large binary files through the Node API unless necessary.

Validate:

- MIME
- file size
- extension
- ownership
- permissions

Never trust client MIME type alone.

Add media to:
- posts
- messages

Add previews and loading states.
```

---

# 122. PHASE 6 CLAUDE PROMPT

```text
Implement PHASE 6: Safety & Moderation.

Build:

- report system
- block system
- moderation service
- rate limiting
- spam protection
- account restrictions
- admin moderation queue
- audit logs

Report categories:

- harassment
- bullying
- spam
- threat
- sexual content
- scam
- impersonation
- doxxing
- other

Implement:

User
→ Report
→ Moderation queue
→ Admin review
→ Action

Actions:

- warn
- remove content
- restrict
- suspend
- ban
- dismiss

Sensitive admin operations must be audited.
```

---

# 123. PHASE 7 CLAUDE PROMPT

```text
Implement discovery and matching.

Build:

- Find Someone
- Interest matching
- Department matching
- Semester matching
- Purpose matching
- Student cards
- Start anonymous chat

Start with deterministic matching.

Do NOT use machine learning yet.

Filtering:

- same university
- not blocked
- active account
- privacy allows discovery

Ranking:

- department
- semester
- interests
- purpose

Make scoring configurable.
```

---

# 124. PHASE 8 CLAUDE PROMPT

```text
Implement:

- Study Partner Finder
- FYP Partner Finder
- Skills
- Networking

Users should create requests.

Study request:

- subject
- semester
- study mode
- availability
- purpose

FYP request:

- project description
- skills available
- skills wanted
- project category
- availability

Allow anonymous discovery and anonymous chat.
```

---

# 125. PHASE 9 CLAUDE PROMPT

```text
Implement communities.

Types:

- academic
- interests
- programming
- AI/ML
- cyber security
- gaming
- startups
- sports
- photography

Features:

- community list
- community detail
- join
- leave
- community posts
- comments
- moderators
- report
```

---

# 126. PHASE 10 CLAUDE PROMPT

```text
Implement:

- Events
- Societies
- Lost & Found

Events:
- title
- description
- image
- location
- start
- end
- organizer
- registration
- RSVP

Societies:
- verified society profiles
- announcements
- events

Lost & Found:
- lost item
- found item
- category
- description
- approximate location
- image
- anonymous contact
```

---

# 127. PHASE 11 CLAUDE PROMPT

```text
Implement notifications.

Use Expo Notifications.

Notifications:

- new message
- comment
- reply
- match
- identity reveal
- community activity
- event reminder
- moderation action

Implement:

- device token registration
- notification preferences
- backend notification service
- push sending
- deep links
- notification center
```

---

# 128. PHASE 12 CLAUDE PROMPT

```text
Implement mutual identity reveal.

Flow:

User A
→ requests identity reveal
→ User B receives request
→ Accept / Reject

Only if both sides have explicitly accepted:

Identity information becomes available according to privacy rules.

Do not reveal identity automatically.

Audit reveal events.

Add tests for:
- accept
- reject
- cancellation
- blocked users
- deleted users
- expired requests
```

---

# 129. PHASE 13 CLAUDE PROMPT

```text
Implement production admin dashboard.

Use Next.js.

Features:

Dashboard
Users
Reports
Posts
Comments
Messages
Moderation
Suspensions
Bans
Communities
Events
Societies
Universities
Analytics
Audit Logs
Settings

Implement role-based access.

Never expose sensitive identity information to unauthorized admin users.
```

---

# 130. PHASE 14 — PRODUCTION HARDENING

Before launch Claude must perform:

```text
Security review
Database review
API review
Authorization review
Mobile review
Socket review
File upload review
Rate-limit review
Privacy review
Performance review
```

Test:

```text
IDOR
Broken authorization
Cross-university access
Token leakage
File upload abuse
Socket abuse
Spam
Rate-limit bypass
Admin access
```

---

# 131. LAUNCH CHECKLIST

## Technical

```text
Production API
Production database
Redis
Object storage
HTTPS
Domain
Monitoring
Logging
Backups
Push notifications
Crash monitoring
```

## Mobile

```text
Android build
iOS build
App icon
Splash screen
Privacy policy
Terms
Store metadata
Screenshots
```

## Product

```text
University selected
University domain configured
Initial communities
Initial categories
Moderators
Community guidelines
Report process
Support channel
```

---

# 132. FIRST UNIVERSITY LAUNCH

Start with a controlled beta.

Example:

```text
30 students
   ↓
100 students
   ↓
300 students
   ↓
500 students
   ↓
1000 students
```

Do not immediately open the platform to everyone.

Observe:

```text
Are students posting?
Are they returning?
Are they chatting?
Are they finding partners?
Are reports manageable?
Are people abusing anonymity?
```

---

# 133. PRODUCT METRICS

Important:

```text
Activation
Retention
DAU
WAU
MAU

Posts per active user
Messages per active user
Comments per post

Match success rate
Chat initiation rate

Report rate
Moderation resolution time

7-day retention
30-day retention
```

---

# 134. PRODUCT SUCCESS LOOP

The most important loop:

```text
Student joins
      ↓
Creates anonymous identity
      ↓
Sees useful content
      ↓
Posts/comments
      ↓
Finds students
      ↓
Chats
      ↓
Finds study/FYP partner
      ↓
Returns
      ↓
Invites friends
```

This is the core growth loop.

---

# 135. LONG-TERM PRODUCT

Eventually the platform can become:

```text
Anonymous Social Network
        +
Student Messaging
        +
Academic Network
        +
Project Network
        +
Career Network
        +
Campus Information
        +
Events
        +
Societies
        +
University Community
```

The goal is not simply:

> "Anonymous chat."

The goal is:

> **A digital student community where university membership is verified but social identity can remain private.**

---

# 136. FINAL ARCHITECTURE

The final system should conceptually look like:

```text
                    STUDENT
                       │
                       ▼
              ┌─────────────────┐
              │ React Native App│
              │     Expo        │
              └────────┬────────┘
                       │
             REST API + WebSocket
                       │
                       ▼
              ┌─────────────────┐
              │ Node + Express  │
              ├─────────────────┤
              │ Auth            │
              │ Users           │
              │ Feed            │
              │ Chat            │
              │ Matching        │
              │ Communities     │
              │ Moderation      │
              │ Notifications   │
              └───────┬─────────┘
                      │
             ┌────────┼─────────┐
             │        │         │
             ▼        ▼         ▼
       PostgreSQL   Redis    Object Storage
             │        │         │
             │        │         │
             └────────┼─────────┘
                      │
                      ▼
               Admin Platform
                  Next.js
```

---

# 137. DEVELOPMENT ORDER — FINAL

The exact order should be:

```text
PHASE 0
Foundation
      ↓
PHASE 1
Authentication
      ↓
PHASE 2
Anonymous Identity
      ↓
PHASE 3
Feed
      ↓
PHASE 4
Chat
      ↓
PHASE 5
Media
      ↓
PHASE 6
Moderation
      ↓
PHASE 7
Discovery
      ↓
PHASE 8
Study + FYP
      ↓
PHASE 9
Communities
      ↓
PHASE 10
Events + Societies + Lost & Found
      ↓
PHASE 11
Notifications
      ↓
PHASE 12
Identity Reveal
      ↓
PHASE 13
Admin
      ↓
PHASE 14
Security + Performance
      ↓
BETA
      ↓
FIRST UNIVERSITY LAUNCH
      ↓
VALIDATION
      ↓
MULTI-UNIVERSITY
```

---

# 138. MOST IMPORTANT DEVELOPMENT RULE

Do not tell Claude:

```text
Build my entire startup.
```

Instead tell Claude:

```text
Implement Phase 0.
```

Then:

```text
Implement Phase 1.
```

Then:

```text
Implement Phase 2.
```

and so on.

This keeps the architecture understandable, makes debugging easier, and prevents Claude from generating a huge amount of disconnected code.

---

# 139. THE ACTUAL STARTING POINT

The first thing to build is:

```text
anonymous-campus/
│
├── mobile/
│
├── server/
│
├── admin/
│
├── packages/
│
├── docs/
│
└── README.md
```

Then:

```text
Mobile
   ↓
Expo
   ↓
Navigation
   ↓
API client

Server
   ↓
Express
   ↓
Prisma
   ↓
PostgreSQL

Redis
   ↓
Connection

Then
   ↓
Health checks
   ↓
Git
   ↓
Lint
   ↓
Tests
```

Only after this foundation works should authentication be implemented.

---

# 140. FINAL PRODUCT VISION

The finished application should allow a student to do this:

```text
Download App
      ↓
Verify University Email
      ↓
Create Anonymous Identity
      ↓
Select Interests
      ↓
Enter University Campus
      ↓
See Anonymous Feed
      ↓
Post Something
      ↓
Comment Anonymously
      ↓
Discover Students
      ↓
Find Study Partner
      ↓
Find FYP Partner
      ↓
Start Anonymous Chat
      ↓
Share Images/Documents
      ↓
Join Communities
      ↓
Discover Events/Societies
      ↓
Network
      ↓
Optionally Reveal Identity
```

while the platform maintains:

```text
Privacy
Security
Moderation
Accountability
Performance
Scalability
University isolation
```

The product should therefore be built as a **real production system**, not as a demo CRUD application.
