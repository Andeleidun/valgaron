import type {
  ChatType,
  ContactType,
  ModeType,
  RelationshipStateType,
} from '../../../types';
import { getDirectChatCounterpart } from '../../../Utlilities/directChats';

/**
 * Resolve direct chats that belong to the active mode and can be surfaced on
 * dashboard pages.
 */
export const selectDashboardDirectChats = ({
  modeId,
  relationshipState,
}: {
  modeId: ModeType['id'];
  relationshipState: RelationshipStateType;
}): ChatType[] => {
  const blockedProfileIds = new Set(
    relationshipState.byMode[modeId].blockedProfileIds ?? []
  );

  return relationshipState.byMode[modeId].directChats.filter((chat) => {
    const counterpart = getDirectChatCounterpart(chat);
    if (!counterpart) {
      return false;
    }

    return !blockedProfileIds.has(counterpart.id);
  });
};

/**
 * Resolve the primary counterpart shown for a dashboard direct-chat preview.
 */
export const selectDashboardDirectChatCounterpart = (
  chat: ChatType
): ContactType | undefined => getDirectChatCounterpart(chat);
