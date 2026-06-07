import type { GroupType, ModeType } from '../../../types';

/**
 * Resolve a stable notification version token from a timestamp-like value.
 */
export const buildNotificationTimestampToken = (
  value: Date | string | undefined
): string => {
  if (!value) {
    return 'unknown';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
};

/**
 * Resolve the latest message timestamp across every chat room in a group.
 */
export const getLatestGroupActivityTimestamp = (
  group: GroupType
): Date | string | undefined => {
  let latestTimestamp: Date | string | undefined;
  let latestValue = Number.NEGATIVE_INFINITY;

  group.chatRooms.forEach((chatRoom) => {
    chatRoom.messages.forEach((message) => {
      const timestamp = new Date(message.sentAt).getTime();

      if (Number.isNaN(timestamp) || timestamp <= latestValue) {
        return;
      }

      latestValue = timestamp;
      latestTimestamp = message.sentAt;
    });
  });

  return latestTimestamp;
};

/**
 * Build the canonical notification id for an incoming interest.
 */
export const buildInterestNotificationId = (profileId: string): string =>
  `interest-${profileId}`;

/**
 * Build the canonical notification id for an incoming direct request.
 */
export const buildRequestNotificationId = (profileId: string): string =>
  `request-${profileId}`;

/**
 * Build the canonical notification id for group activity.
 */
export const buildGroupNotificationId = (group: GroupType): string =>
  `group-${group.id}-${buildNotificationTimestampToken(
    getLatestGroupActivityTimestamp(group)
  )}`;

/**
 * Build the canonical notification id for a direct-message thread.
 */
export const buildMessageNotificationId = ({
  contactId,
  fallbackIndex,
  sentAt,
}: {
  contactId?: string;
  fallbackIndex: number;
  sentAt: Date | string | undefined;
}): string =>
  `message-${contactId ?? fallbackIndex}-${buildNotificationTimestampToken(
    sentAt
  )}`;

/**
 * Build the canonical notification id for incomplete profile guidance.
 */
export const buildProfileCompletionNotificationId = (
  modeId: ModeType['id']
): string => `profile-${modeId}`;

/**
 * Build the canonical notification id for profile freshness guidance.
 */
export const buildProfileFreshnessNotificationId = (
  modeId: ModeType['id']
): string => `profile-freshness-${modeId}`;
