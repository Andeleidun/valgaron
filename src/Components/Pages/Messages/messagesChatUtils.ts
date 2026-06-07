import type {
  ChatType,
  ContactType,
  GroupType,
  MessageType,
  ModeType,
  ProfileType,
} from '../../../types';
import { getProfilesForMode } from '../../../Utlilities/data';
import { DIRECT_CHAT_SELF_ID } from '../../../Utlilities/chatIdentity';

/**
 * Format a message timestamp for display in chat views.
 */
export const formatMessageTimestamp = (
  timestamp: Date | string,
  language: string
): string => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat(language, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
};

/**
 * Build contact initials for avatar fallback rendering.
 */
export const getContactInitials = (name: string): string => {
  const segments = name.trim().split(/\s+/).filter(Boolean);
  if (segments.length === 0) {
    return '?';
  }
  const initials = segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('');
  return initials || '?';
};

/**
 * Return non-self members for chat title and avatar display.
 */
export const getOtherMembers = (chat: ChatType): ContactType[] =>
  chat.members.filter((member) => member.id !== DIRECT_CHAT_SELF_ID);

/**
 * Build a display title for a chat.
 */
export const getChatTitle = (chat: ChatType): string => {
  const names = getOtherMembers(chat).map((member) => member.name);
  return names.join(', ');
};

const buildSelfContact = (selfName: string): ContactType => ({
  id: DIRECT_CHAT_SELF_ID,
  name: selfName,
});

/**
 * Build the canonical sender payload for a group message from the authenticated
 * member identity.
 */
export const buildCurrentGroupSender = ({
  currentUserId,
  selfName,
}: {
  currentUserId: string;
  selfName: string;
}): ContactType => ({
  id: currentUserId,
  name: selfName,
});

/**
 * Resolve a candidate profile for a direct chat participant.
 */
export const getRecipientProfile = (
  modeId: ModeType['id'],
  contactId: string
): ProfileType | undefined =>
  getProfilesForMode(modeId).find((profile) => profile.id === contactId);

/**
 * Determine whether a direct contact is blocked in the active mode.
 */
export const isBlockedDirectContact = ({
  contactId,
  blockedProfileIds,
}: {
  contactId: string;
  blockedProfileIds: ReadonlySet<string>;
}): boolean => blockedProfileIds.has(contactId);

/**
 * Match a routed contact id against direct chats in the active mode.
 */
export const directChatMatchesContact = ({
  chat,
  contactId,
}: {
  chat: ChatType;
  contactId: string;
}): boolean => getOtherMembers(chat).some((member) => member.id === contactId);

/**
 * Build a direct-chat contact from canonical profile data.
 */
export const buildDirectContactFromProfile = (
  profile: ProfileType
): ContactType => ({
  id: profile.id,
  name: profile.name,
  avatarUrl: profile.pictures[0],
});

const buildGroupContact = (group: GroupType): ContactType => ({
  id: `group-${group.id}`,
  name: group.groupName,
  avatarUrl: group.groupPicture,
});

const buildGroupMessages = ({
  currentUserId,
  group,
  selfName,
  memberFallbackLabel,
}: {
  currentUserId: string;
  group: GroupType;
  selfName: string;
  memberFallbackLabel: string;
}): MessageType[] => {
  const primaryRoom = group.chatRooms?.[0];
  if (!primaryRoom?.messages) {
    return [];
  }
  const memberLookup = new Map(
    (primaryRoom.members ?? []).map((member) => [
      member.userId,
      member.userName,
    ])
  );
  return primaryRoom.messages.map((message) => ({
    sender: {
      id:
        message.senderId === currentUserId
          ? DIRECT_CHAT_SELF_ID
          : message.senderId,
      name:
        message.senderId === currentUserId
          ? selfName
          : memberLookup.get(message.senderId) ?? memberFallbackLabel,
    },
    text: message.content,
    sentAt: message.sentAt,
  }));
};

/**
 * Build group chats from community group data.
 */
export const buildGroupChats = ({
  currentUserId,
  groups,
  selfName,
  memberFallbackLabel,
}: {
  currentUserId: string;
  groups: GroupType[];
  selfName: string;
  memberFallbackLabel: string;
}): ChatType[] =>
  groups.map((group) => ({
    members: [buildSelfContact(selfName), buildGroupContact(group)],
    messages: buildGroupMessages({
      currentUserId,
      group,
      selfName,
      memberFallbackLabel,
    }),
  }));

/**
 * Filter groups to only those the user has joined.
 */
export const filterJoinedGroups = (
  groups: GroupType[],
  joinedGroupIds: string[]
): GroupType[] => {
  if (joinedGroupIds.length === 0) {
    return [];
  }
  const joinedSet = new Set(joinedGroupIds);
  return groups.filter((group) => joinedSet.has(group.id));
};
