# Feature Scope by Release

Summary of which features ship in which stage. Full rationale in `docs/architecture.md` (§27, §28).

## MVP (closed beta, one university)
- **Account & identity:** university email OTP signup/login, persistent session, logout, account deletion; generated pseudonym ("Anonymous Fox #2841", pick 1 of 3, rename once/30 days); generated animal avatar; optional department/semester/interests; privacy toggles; guidelines + 18+ acceptance.
- **Feed:** text posts + up to 4 images; categories Academic/Campus/Career/General; flairs Question/Opinion/Experience/Claim; sort Recent/Trending/Top; likes; flat comments; delete own; share link (login required); infinite scroll + pull to refresh.
- **Chat (1-to-1):** message requests (accept/decline); real-time text/emoji; images after acceptance; typing indicator; read receipts; delete for everyone; mute/hide conversation; reconnect with gap recovery.
- **Safety:** block (both directions); report posts/comments/messages/profiles/conversations; rules engine (EN/Urdu/Roman Urdu terms, personal data, links); async AI text/image moderation (can hide, never bans); warnings/restrictions/suspensions/bans; new-account limits; EXIF/GPS stripping.
- **Notifications:** push for new message, message request, comment, moderation notice; in-app notification list; deep links.
- **Admin (web):** login + TOTP; case queue; remove/restore content; sanctions; user search by pseudonym; audit log; break-glass identity access.
- **Legal/store:** privacy policy, terms, guidelines, report & appeal process, in-app support contact.

## V1
Saved posts; comment replies + likes; chat replies, reactions, PDF sharing; opt-in online status; read-receipt toggle; logout all devices; appeals; skills/looking-for/bio; search (posts, pseudonyms); iOS release; admin analytics + rule-list editor.

## V1.5
Find Someone (rule-based matching); communities (topic + academic) with community mods; Study Partner Finder; FYP/Project Partner Finder; Lost & Found; mutual identity reveal (user-written reveal cards).

## V2
Verified societies/organizations; events + RSVP + reminders; career/internship section; multi-university support.

## Future
AI campus assistant; AI recommendations; voice/video/polls; web student client; verified employers; premium features.

## Deliberately not planned
Uploaded avatars; free-text display names; end-to-end encrypted chat; "Random" feed sort.
