// @ts-check
/**
 * Cross-cutting enums shared by mobile, server and admin.
 *
 * These values are taken directly from the approved architecture
 * (docs/architecture.md §8.3 Database Architecture) so that the database
 * schema, the API contracts, and the client code are always built against
 * the same fixed vocabulary. Defining them here, before the features that
 * use them are implemented, is what makes later phases "contract-first"
 * (§26): the schema PR lands before the backend/mobile PRs that consume it.
 *
 * Do not add a value here that isn't already decided in the architecture
 * doc — enums are a contract, not a place to sketch ideas.
 */

/** @param {readonly string[]} values */
function freezeEnum(values) {
  return Object.freeze(values);
}

/** User account lifecycle. §8.3 `users.status`. */
export const AccountStatus = freezeEnum([
  'ACTIVE',
  'RESTRICTED',
  'SUSPENDED',
  'BANNED',
  'PENDING_DELETION',
  'DELETED',
]);

/** University lifecycle. §8.3 `universities.status`. */
export const UniversityStatus = freezeEnum(['ACTIVE', 'PILOT', 'DISABLED']);

/** Mobile device platform, used by device tokens and session records. */
export const Platform = freezeEnum(['ANDROID', 'IOS']);

/** Feed post category. §8.3 `posts.category`. */
export const PostCategory = freezeEnum(['ACADEMIC', 'CAMPUS', 'CAREER', 'GENERAL']);

/** Optional post flair. §3.3 Content labeling. */
export const PostFlair = freezeEnum(['QUESTION', 'OPINION', 'EXPERIENCE', 'CLAIM', 'OFFICIAL']);

/** Post/comment lifecycle. §8.3 `posts.status`. */
export const ContentStatus = freezeEnum([
  'PUBLISHED',
  'PENDING_REVIEW',
  'HIDDEN',
  'REMOVED',
  'DELETED',
]);

/** Feed sort modes. §12.1 (Random is intentionally NOT included — D12). */
export const FeedSort = freezeEnum(['RECENT', 'TRENDING', 'TOP']);

/** Conversation lifecycle. §8.3 `conversations.status` (D10 message requests). */
export const ConversationStatus = freezeEnum(['REQUESTED', 'ACTIVE', 'DECLINED', 'CLOSED']);

/** Conversation member role. §8.3 `conversation_members.role`. */
export const ConversationMemberRole = freezeEnum(['INITIATOR', 'RECIPIENT']);

/** What started a conversation. §8.3 `conversations.origin_type`. */
export const ConversationOriginType = freezeEnum([
  'POST',
  'COMMENT',
  'PROFILE',
  'MATCH',
  'LISTING',
]);

/** Message content kind. §8.3 `messages.kind`. */
export const MessageKind = freezeEnum(['TEXT', 'IMAGE', 'SYSTEM']);

/** Message lifecycle. §8.3 `messages.status`. */
export const MessageStatus = freezeEnum(['SENT', 'HIDDEN', 'DELETED']);

/** Media object purpose. §8.3 `media_objects.purpose`. */
export const MediaPurpose = freezeEnum(['POST_IMAGE', 'MESSAGE_IMAGE', 'MESSAGE_FILE']);

/** Media processing lifecycle. §8.3 `media_objects.status`. */
export const MediaStatus = freezeEnum([
  'PENDING_UPLOAD',
  'PROCESSING',
  'READY',
  'REJECTED',
  'DELETED',
]);

/** What kind of thing a report points at. §8.3 `reports.target_type`. */
export const ReportTargetType = freezeEnum([
  'POST',
  'COMMENT',
  'MESSAGE',
  'PROFILE',
  'CONVERSATION',
]);

/** Why something was reported. §8.3 `reports.reason` (plan.md §27). */
export const ReportReason = freezeEnum([
  'HARASSMENT',
  'BULLYING',
  'SPAM',
  'THREAT',
  'SEXUAL_CONTENT',
  'SCAM',
  'IMPERSONATION',
  'DOXXING',
  'SELF_HARM',
  'OTHER',
]);

/** Moderation case lifecycle. §8.3 `moderation_cases.status`. */
export const ModerationCaseStatus = freezeEnum(['OPEN', 'IN_REVIEW', 'ACTIONED', 'DISMISSED']);

/** Moderation case priority. §8.3 `moderation_cases.priority`. */
export const ModerationCasePriority = freezeEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

/** Where a moderation decision came from. §8.3 `moderation_cases.source`. */
export const ModerationSource = freezeEnum(['REPORT', 'AUTO', 'ADMIN']);

/** Automated moderation pipeline stage. §8.3 `moderation_decisions.stage`. */
export const ModerationStage = freezeEnum(['RULES', 'AI_TEXT', 'AI_IMAGE', 'LINK']);

/** Automated moderation outcome. §18.1 Pipeline. */
export const ModerationAction = freezeEnum(['ALLOW', 'FLAG', 'HOLD', 'REJECT']);

/** Sanction applied to a user. §8.3 `user_sanctions.type` / §18.3. */
export const SanctionType = freezeEnum(['WARNING', 'RESTRICTION', 'SUSPENSION', 'BAN']);

/** In-app / push notification type. §8.3 `notifications.type`. */
export const NotificationType = freezeEnum([
  'NEW_MESSAGE',
  'MESSAGE_REQUEST',
  'NEW_COMMENT',
  'MODERATION_NOTICE',
]);

/** Push preview visibility preference. §8.3 `user_settings.push_preview`. */
export const PushPreview = freezeEnum(['NONE', 'SENDER_ONLY']);

/** DM policy on a profile. §8.3 `anonymous_profiles.dm_policy`. */
export const DmPolicy = freezeEnum(['EVERYONE', 'NOBODY']);

/** Admin role. §19 Admin Architecture. */
export const AdminRole = freezeEnum(['MODERATOR', 'SENIOR_MODERATOR', 'SUPER_ADMIN']);
