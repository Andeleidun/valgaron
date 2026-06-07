import React, {
  type ChangeEvent,
  FC,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Avatar from '@mui/material/Avatar';
import {
  ChatType,
  CommonStringsType,
  MessagingGuidanceStringsType,
  MessagesStringsType,
  ModeType,
  PanelsType,
  TranslationStringType,
} from '../../../types';
import {
  Box,
  Button,
  Card,
  Container,
  EmptyState,
  ErrorState,
  Spinner,
  Stack,
  Tabs,
  Text,
} from '../../';
import { Input } from '../../Common';
import {
  evaluateIntroMessageGate,
  formatTemplate,
  resolveGateActor,
  UserContext,
  useRelationship,
} from '../../../Utlilities';
import { getModeActivationStatus } from '../../../Utlilities/userActivation';
import {
  buildConversationExcerpt,
  buildFirstMessageSuggestions,
  createSafetyReport,
} from '../../../Utlilities/safety';
import { useLocation, useSearchParams } from 'react-router-dom';
import { buildFirstContactGuidance } from './MessageGuidance';
import { useAuth } from '../../../Utlilities/auth/AuthContext';
import { LOCAL_AUTH_USER_UID } from '../../../Utlilities/auth/localIdentity';
import { DIRECT_CHAT_SELF_NAME } from '../../../Utlilities/chatIdentity';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ChatView } from './ChatView';
import {
  buildCurrentGroupSender,
  buildDirectContactFromProfile,
  buildGroupChats,
  directChatMatchesContact,
  filterJoinedGroups,
  formatMessageTimestamp,
  getChatTitle,
  getContactInitials,
  getOtherMembers,
  getRecipientProfile,
  isBlockedDirectContact,
} from './messagesChatUtils';
import './Messages.css';

const TAB_DIRECT = 0;
const TAB_GROUPS = 1;

type TabId = typeof TAB_DIRECT | typeof TAB_GROUPS;

type MessagesProps = {
  mode: ModeType;
  strings: {
    messages: MessagesStringsType;
    messagingGuidance: MessagingGuidanceStringsType;
    common: CommonStringsType;
  };
  language: string;
};

type ChatEntryType = {
  key: string;
  rawIndex: number;
  chat: ChatType;
  title: string;
  snippet: string;
  avatarUrl?: string;
  avatarInitials: string;
};

type MessagesLocationState = {
  groupId?: string;
  contactId?: string;
};

/**
 * Resolve a translated label in the current language with a fallback.
 */
const resolveLocalizedLabel = (
  translation: TranslationStringType | undefined,
  language: string
): string => translation?.[language] ?? translation?.en ?? '';

/**
 * Convert numeric tab values into the local tab union.
 */
const toTabId = (tabIndex: number): TabId =>
  tabIndex === TAB_GROUPS ? TAB_GROUPS : TAB_DIRECT;

/**
 * Build a display snippet for a chat list row.
 */
const getChatSnippet = (chat: ChatType, noMessagesLabel: string): string =>
  chat.messages[chat.messages.length - 1]?.text ?? noMessagesLabel;

/**
 * Map direct/group chats into a stable list-entry shape.
 */
const buildChatEntries = (
  chats: ChatType[],
  tabId: TabId,
  noMessagesLabel: string
): ChatEntryType[] =>
  chats.map((chat, rawIndex) => {
    const primaryMember = getOtherMembers(chat)[0];
    const title = getChatTitle(chat);
    return {
      key: `${tabId}-${rawIndex}`,
      rawIndex,
      chat,
      title,
      snippet: getChatSnippet(chat, noMessagesLabel),
      avatarUrl: primaryMember?.avatarUrl,
      avatarInitials: getContactInitials(primaryMember?.name ?? title),
    };
  });

/**
 * Search chat entries by title and latest snippet text.
 */
const filterChatEntries = (
  entries: ChatEntryType[],
  searchQuery: string
): ChatEntryType[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) {
    return entries;
  }
  return entries.filter((entry) => {
    const titleIncludesQuery = entry.title
      .toLowerCase()
      .includes(normalizedQuery);
    const snippetIncludesQuery = entry.snippet
      .toLowerCase()
      .includes(normalizedQuery);
    return titleIncludesQuery || snippetIncludesQuery;
  });
};

/**
 * Messages workspace that combines persisted direct chats with group chats
 * derived from the current mode's joined communities.
 */
export const Messages: FC<MessagesProps> = ({ mode, strings, language }) => {
  const theme = useTheme();
  const isMobileViewport = useMediaQuery(theme.breakpoints.down('md'));
  const userContext = useContext(UserContext);
  const { user: authUser } = useAuth();
  const {
    groupLoadStateByMode,
    getModeState,
    ensureDirectChat,
    sendDirectMessage,
    sendGroupMessage,
    blockProfile,
    blockGroup,
    submitSafetyReport,
  } = useRelationship();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesStrings = strings.messages[mode.id];
  const messagingGuidanceStrings = strings.messagingGuidance[mode.id];
  const modeRelationshipState = getModeState(mode.id);
  const currentUserProfile = userContext.user[mode.id];
  const currentUserId = authUser?.uid ?? LOCAL_AUTH_USER_UID;

  const directTabLabel = resolveLocalizedLabel(
    messagesStrings.tabs.direct,
    language
  );
  const groupsTabLabel = resolveLocalizedLabel(
    messagesStrings.tabs.groups,
    language
  );
  const searchLabel = resolveLocalizedLabel(
    messagesStrings.search.label,
    language
  );
  const searchPlaceholder = resolveLocalizedLabel(
    messagesStrings.search.placeholder,
    language
  );
  const noMessagesYetLabel = resolveLocalizedLabel(
    messagesStrings.chatList.noMessagesYet,
    language
  );
  const backLabel = resolveLocalizedLabel(
    messagesStrings.composer.back,
    language
  );
  const sendLabel = resolveLocalizedLabel(
    messagesStrings.composer.send,
    language
  );
  const composerPlaceholder = resolveLocalizedLabel(
    messagesStrings.composer.placeholder,
    language
  );
  const noDirectChatsTitle = resolveLocalizedLabel(
    messagesStrings.empty.noDirectChatsTitle,
    language
  );
  const noDirectChatsMessage = resolveLocalizedLabel(
    messagesStrings.empty.noDirectChatsMessage,
    language
  );
  const noGroupChatsTitle = resolveLocalizedLabel(
    messagesStrings.empty.noGroupChatsTitle,
    language
  );
  const noGroupChatsMessage = resolveLocalizedLabel(
    messagesStrings.empty.noGroupChatsMessage,
    language
  );
  const noChatSelectedTitle = resolveLocalizedLabel(
    messagesStrings.empty.noChatSelectedTitle,
    language
  );
  const noChatSelectedMessage = resolveLocalizedLabel(
    messagesStrings.empty.noChatSelectedMessage,
    language
  );
  const directLoadingLabel = resolveLocalizedLabel(
    messagesStrings.loading.directChats,
    language
  );
  const groupLoadingLabel = resolveLocalizedLabel(
    messagesStrings.loading.groupChats,
    language
  );
  const groupErrorTitle = resolveLocalizedLabel(
    messagesStrings.errors.groupChatsTitle,
    language
  );
  const groupErrorMessage = resolveLocalizedLabel(
    messagesStrings.errors.groupChatsMessage,
    language
  );
  const statusSentLabel = resolveLocalizedLabel(
    messagesStrings.status.sent,
    language
  );
  const statusDeliveredLabel = resolveLocalizedLabel(
    messagesStrings.status.delivered,
    language
  );
  const statusReadLabel = resolveLocalizedLabel(
    messagesStrings.status.read,
    language
  );
  const avatarPrefix = resolveLocalizedLabel(
    messagesStrings.avatars.chatAvatarLabel,
    language
  );
  const resolveCommonLabel = (key: string): string =>
    strings.common[key]?.[language] ?? strings.common[key]?.en ?? '';
  const currentUserName =
    resolveCommonLabel('youLabel') || DIRECT_CHAT_SELF_NAME;
  const memberFallbackLabel = resolveCommonLabel('memberLabel');
  const reportLabel = resolveCommonLabel('reportLabel');
  const blockLabel = resolveCommonLabel('blockLabel');
  const suggestedOpenersLabel = resolveCommonLabel('suggestedOpenersLabel');
  const useSuggestionLabel = resolveCommonLabel('useSuggestionLabel');
  const reportSavedLabel = resolveCommonLabel('reportSavedLabel');
  const blockedUserLabel = resolveCommonLabel('blockedUserLabel');
  const blockedGroupLabel = resolveCommonLabel('blockedGroupLabel');
  const conversationReportedTemplate = resolveCommonLabel(
    'conversationReportedTemplate'
  );
  const groupConversationReportedTemplate = resolveCommonLabel(
    'groupConversationReportedTemplate'
  );

  const [selectedChatKey, setSelectedChatKey] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState<TabId>(TAB_DIRECT);
  const [searchByTab, setSearchByTab] = useState<Record<TabId, string>>({
    [TAB_DIRECT]: '',
    [TAB_GROUPS]: '',
  });
  const [conversationFeedback, setConversationFeedback] = useState<
    string | null
  >(null);
  const pendingRouteStateRef = useRef<MessagesLocationState | null>(null);
  const consumeRouteQueryParams = () => {
    const nextParams = new URLSearchParams(searchParams);
    let hasChanges = false;

    if (nextParams.has('groupId')) {
      nextParams.delete('groupId');
      hasChanges = true;
    }
    if (nextParams.has('contactId')) {
      nextParams.delete('contactId');
      hasChanges = true;
    }

    if (hasChanges) {
      setSearchParams(nextParams, { replace: true });
    }
  };
  const consumePendingRouteContact = ({
    pendingRouteContactId,
    queryContactId,
    routeContactId,
  }: {
    pendingRouteContactId?: string;
    queryContactId: string | null;
    routeContactId: string;
  }) => {
    if (queryContactId) {
      consumeRouteQueryParams();
    }
    if (routeContactId === pendingRouteContactId) {
      pendingRouteStateRef.current = null;
    }
  };
  /**
   * Consume a routed or query-string group target once it has been handled or
   * determined to be invalid for the current workspace state.
   */
  const consumePendingRouteGroup = ({
    pendingRouteGroupId,
    queryGroupId,
    routeGroupId,
  }: {
    pendingRouteGroupId?: string;
    queryGroupId: string | null;
    routeGroupId: string;
  }) => {
    if (queryGroupId) {
      consumeRouteQueryParams();
    }
    if (routeGroupId === pendingRouteGroupId) {
      pendingRouteStateRef.current = null;
    }
  };
  const blockedProfileIds = useMemo(
    () => new Set(modeRelationshipState.blockedProfileIds ?? []),
    [modeRelationshipState.blockedProfileIds]
  );
  const directChatList = useMemo(
    () =>
      modeRelationshipState.directChats.filter(
        (chat) =>
          !getOtherMembers(chat).some((member) =>
            blockedProfileIds.has(member.id)
          )
      ),
    [blockedProfileIds, modeRelationshipState.directChats]
  );
  const blockedGroupIds = useMemo(
    () => new Set(modeRelationshipState.blockedGroupIds ?? []),
    [modeRelationshipState.blockedGroupIds]
  );
  /**
   * Group conversations are derived from canonical community state rather than
   * duplicated into a second persisted chat store.
   */
  const groupChatList = useMemo(
    () =>
      buildGroupChats({
        currentUserId,
        groups: filterJoinedGroups(
          modeRelationshipState.groups.filter(
            (group) => !blockedGroupIds.has(group.id)
          ),
          userContext.user.groupMemberships?.[mode.id] ?? []
        ),
        selfName: currentUserName,
        memberFallbackLabel,
      }),
    [
      blockedGroupIds,
      currentUserId,
      currentUserName,
      memberFallbackLabel,
      mode.id,
      modeRelationshipState.groups,
      userContext.user.groupMemberships,
    ]
  );
  const groupLoadState = groupLoadStateByMode[mode.id];
  const isDirectLoading = false;
  const isGroupLoading = groupLoadState.isLoading;
  const groupLoadError = groupLoadState.hasError
    ? groupLoadState.errorMessage ?? groupErrorMessage
    : null;
  const viewerActor = resolveGateActor({
    id: currentUserProfile?.id,
    verificationTier: currentUserProfile?.verificationTier,
    restrictionState: currentUserProfile?.restrictionState,
    lifecycleState: currentUserProfile?.lifecycleState,
  });
  const activationStatus = getModeActivationStatus({
    user: userContext.user,
    modeId: mode.id,
  });
  const interactionGate = useMemo(
    () => ({
      isLocked: !activationStatus.isReady,
      message: resolveLocalizedLabel(
        strings.common.activationGateMessagingMessage,
        language
      ),
    }),
    [
      activationStatus.isReady,
      language,
      strings.common.activationGateMessagingMessage,
    ]
  );

  const directEntries = useMemo(
    () => buildChatEntries(directChatList, TAB_DIRECT, noMessagesYetLabel),
    [directChatList, noMessagesYetLabel]
  );
  const groupEntries = useMemo(
    () => buildChatEntries(groupChatList, TAB_GROUPS, noMessagesYetLabel),
    [groupChatList, noMessagesYetLabel]
  );
  const filteredDirectEntries = useMemo(
    () => filterChatEntries(directEntries, searchByTab[TAB_DIRECT]),
    [directEntries, searchByTab]
  );
  const filteredGroupEntries = useMemo(
    () => filterChatEntries(groupEntries, searchByTab[TAB_GROUPS]),
    [groupEntries, searchByTab]
  );
  const activeEntries =
    tabIndex === TAB_DIRECT ? filteredDirectEntries : filteredGroupEntries;
  const isChatSelected = activeEntries.some(
    (entry) => entry.key === selectedChatKey
  );

  useEffect(() => {
    if (!selectedChatKey) {
      return;
    }
    const existsInActiveList = activeEntries.some(
      (entry) => entry.key === selectedChatKey
    );
    if (!existsInActiveList) {
      setSelectedChatKey(null);
    }
  }, [activeEntries, selectedChatKey]);

  useEffect(() => {
    setConversationFeedback(null);
  }, [selectedChatKey, tabIndex]);

  useEffect(() => {
    const state = location.state as MessagesLocationState | null;
    if (state?.contactId || state?.groupId) {
      pendingRouteStateRef.current = state;
    }
  }, [location.key, location.state]);

  useEffect(() => {
    const pendingRouteState = pendingRouteStateRef.current;
    const pendingRouteGroupId = pendingRouteState?.groupId;
    const pendingRouteContactId = pendingRouteState?.contactId;
    const queryGroupId = searchParams.get('groupId');
    const queryContactId = searchParams.get('contactId');
    const routeGroupId = queryGroupId ?? pendingRouteGroupId;
    const routeContactId = queryContactId ?? pendingRouteContactId;
    if (routeGroupId) {
      const targetGroupEntry = groupEntries.find((entry) =>
        entry.chat.members.some(
          (member) => member.id === `group-${routeGroupId}`
        )
      );
      if (!targetGroupEntry) {
        if (!isGroupLoading) {
          consumePendingRouteGroup({
            pendingRouteGroupId,
            queryGroupId,
            routeGroupId,
          });
        }
        return;
      }
      setTabIndex(TAB_GROUPS);
      setSelectedChatKey(targetGroupEntry.key);
      consumePendingRouteGroup({
        pendingRouteGroupId,
        queryGroupId,
        routeGroupId,
      });
      return;
    }
    if (routeContactId) {
      if (blockedProfileIds.has(routeContactId)) {
        consumePendingRouteContact({
          pendingRouteContactId,
          queryContactId,
          routeContactId,
        });
        return;
      }
      const targetDirectEntry = directEntries.find((entry) =>
        directChatMatchesContact({
          chat: entry.chat,
          contactId: routeContactId,
        })
      );
      if (targetDirectEntry) {
        setTabIndex(TAB_DIRECT);
        setSelectedChatKey(targetDirectEntry.key);
        if (queryContactId) {
          consumeRouteQueryParams();
        }
        if (routeContactId === pendingRouteContactId) {
          pendingRouteStateRef.current = null;
        }
        return;
      }
      const recipientProfile = getRecipientProfile(mode.id, routeContactId);
      if (!recipientProfile) {
        consumePendingRouteContact({
          pendingRouteContactId,
          queryContactId,
          routeContactId,
        });
        return;
      }
      setTabIndex(TAB_DIRECT);
      ensureDirectChat(
        mode.id,
        buildDirectContactFromProfile(recipientProfile)
      );
    }
  }, [
    directEntries,
    ensureDirectChat,
    groupEntries,
    blockedProfileIds,
    isGroupLoading,
    location.key,
    mode.id,
    searchParams,
    setSearchParams,
  ]);

  /**
   * Resolve direct-chat recipient context and intro eligibility for the selected
   * conversation.
   */
  const getDirectConversationContext = (entry: ChatEntryType) => {
    const directContact = getOtherMembers(entry.chat)[0];
    if (!directContact) {
      return {
        directContact: undefined,
        recipientProfile: undefined,
        isConnection: false,
        introDecision: {
          allowed: true,
          reason: undefined,
        },
      };
    }

    const directContactProfileId = directContact.id;
    const recipientProfile = getRecipientProfile(mode.id, directContact.id);
    const isConnection =
      typeof directContactProfileId === 'string' &&
      modeRelationshipState.connectionIds.includes(directContactProfileId);

    if (!recipientProfile) {
      return {
        directContact,
        recipientProfile: undefined,
        isConnection,
        introDecision: {
          allowed: true,
          reason: undefined,
        },
      };
    }

    const recipientActor = resolveGateActor({
      id: recipientProfile.id,
      verificationTier: recipientProfile.verificationTier,
      restrictionState: recipientProfile.restrictionState,
      lifecycleState: recipientProfile.lifecycleState,
    });

    return {
      directContact,
      recipientProfile,
      isConnection,
      introDecision: evaluateIntroMessageGate({
        sender: viewerActor,
        recipient: recipientActor,
        isConnection,
        messagingPrivacy: recipientProfile.messagingPrivacy ?? 'open_intro',
        language,
      }),
    };
  };

  /**
   * Send a new message in the selected tab/chat.
   */
  const handleSend = (text: string) => {
    if (interactionGate.isLocked) {
      return;
    }
    if (!selectedChatKey) {
      return;
    }
    const sourceEntries =
      tabIndex === TAB_DIRECT ? directEntries : groupEntries;
    const targetEntry = sourceEntries.find(
      (entry) => entry.key === selectedChatKey
    );
    if (!targetEntry) {
      return;
    }

    if (tabIndex === TAB_DIRECT) {
      const { directContact, introDecision } =
        getDirectConversationContext(targetEntry);
      const isFirstMessage = targetEntry.chat.messages.length === 0;
      if (isFirstMessage && !introDecision.allowed) {
        setConversationFeedback(introDecision.reason ?? null);
        return;
      }
      const contact = directContact;
      if (!contact) {
        return;
      }
      if (
        isBlockedDirectContact({
          contactId: contact.id,
          blockedProfileIds,
        })
      ) {
        setConversationFeedback(blockedUserLabel);
        setSelectedChatKey(null);
        return;
      }
      sendDirectMessage(mode.id, contact, text);
      return;
    }

    const groupId = targetEntry.chat.members
      .find((member) => member.id.startsWith('group-'))
      ?.id.replace('group-', '');
    if (!groupId) {
      return;
    }
    sendGroupMessage(
      mode.id,
      groupId,
      text,
      buildCurrentGroupSender({ currentUserId, selfName: currentUserName })
    );
  };

  /**
   * Report the selected conversation using a local excerpt for later moderation.
   */
  const handleReportConversation = (entry: ChatEntryType): void => {
    const excerpt = buildConversationExcerpt({
      messages: entry.chat.messages,
      range: 'last_5_messages',
    });
    const directContact = getOtherMembers(entry.chat)[0];
    const targetType = tabIndex === TAB_DIRECT ? 'conversation' : 'group';
    const targetId =
      tabIndex === TAB_DIRECT
        ? directContact?.id ?? entry.key
        : entry.chat.members
            .find((member) => member.id.startsWith('group-'))
            ?.id.replace('group-', '') ?? entry.key;

    submitSafetyReport(
      createSafetyReport({
        modeId: mode.id,
        targetType,
        targetId,
        reason: 'community_rule_violation',
        range: 'last_5_messages',
        summary:
          tabIndex === TAB_DIRECT
            ? formatTemplate(conversationReportedTemplate, {
                name: directContact?.name ?? entry.title,
              })
            : formatTemplate(groupConversationReportedTemplate, {
                name: getChatTitle(entry.chat),
              }),
        excerpt,
      })
    );
    setConversationFeedback(reportSavedLabel);
  };

  /**
   * Block the selected direct contact or group for this mode.
   */
  const handleBlockConversation = (entry: ChatEntryType): void => {
    if (tabIndex === TAB_DIRECT) {
      const directContact = getOtherMembers(entry.chat)[0];
      if (!directContact) {
        return;
      }
      blockProfile(mode.id, directContact.id);
      setConversationFeedback(blockedUserLabel);
      setSelectedChatKey(null);
      return;
    }

    const targetGroupId = entry.chat.members
      .find((member) => member.id.startsWith('group-'))
      ?.id.replace('group-', '');
    if (!targetGroupId) {
      return;
    }
    blockGroup(mode.id, targetGroupId);
    setConversationFeedback(blockedGroupLabel);
    setSelectedChatKey(null);
  };

  /**
   * Resolve loading, empty, and error state labels for the target tab.
   */
  const getWorkspaceState = (tabId: TabId) => {
    const isLoading = tabId === TAB_DIRECT ? isDirectLoading : isGroupLoading;
    const loadingLabel =
      tabId === TAB_DIRECT ? directLoadingLabel : groupLoadingLabel;
    const emptyTitle =
      tabId === TAB_DIRECT ? noDirectChatsTitle : noGroupChatsTitle;
    const emptyMessage =
      tabId === TAB_DIRECT ? noDirectChatsMessage : noGroupChatsMessage;
    const isGroupsTabWithError = tabId === TAB_GROUPS && !!groupLoadError;

    return {
      isLoading,
      loadingLabel,
      emptyTitle,
      emptyMessage,
      isGroupsTabWithError,
    };
  };

  /**
   * Render the shared search input for a tab workspace.
   */
  const renderSearchControl = (tabId: TabId) => (
    <Box className="chat-search">
      <label htmlFor={`chat-search-${tabId}`} className="chat-search-label">
        {searchLabel}
      </label>
      <Input
        id={`chat-search-${tabId}`}
        type="search"
        inline
        fullWidth
        variant="outlined"
        className="chat-search-input"
        aria-label={searchLabel}
        placeholder={searchPlaceholder}
        value={searchByTab[tabId]}
        handleChange={(
          event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ) =>
          setSearchByTab((previousQueries) => ({
            ...previousQueries,
            [tabId]: event.target.value,
          }))
        }
      />
    </Box>
  );

  /**
   * Render list rows for the active tab.
   */
  const renderChatList = (entries: ChatEntryType[]) => (
    <Stack spacing={1} className="who-chat-list">
      {entries.map((entry) => {
        const latestMessage =
          entry.chat.messages[entry.chat.messages.length - 1];
        const avatarLabel = `${avatarPrefix} ${entry.title}`;
        const isSelected = entry.key === selectedChatKey;
        return (
          <Card
            key={entry.key}
            className={`who-chat-card${isSelected ? ' is-selected' : ''}`}
          >
            <Button
              onClick={() => setSelectedChatKey(entry.key)}
              variant="text"
              className={`who-chat-button${isSelected ? ' is-selected' : ''}`}
              sx={{ color: 'text.primary' }}
              aria-pressed={isSelected}
            >
              <Avatar
                src={entry.avatarUrl}
                alt={avatarLabel}
                aria-label={avatarLabel}
                className="chat-avatar"
              >
                {entry.avatarInitials}
              </Avatar>
              <Box className="chat-card-content">
                <Text className="chat-card-title">{entry.title}</Text>
                <Text className="chat-card-snippet">{entry.snippet}</Text>
                {latestMessage?.sentAt && (
                  <Text className="chat-card-timestamp">
                    {formatMessageTimestamp(latestMessage.sentAt, language)}
                  </Text>
                )}
              </Box>
            </Button>
          </Card>
        );
      })}
    </Stack>
  );

  /**
   * Render the right-side conversation panel for a tab.
   */
  const renderConversationPanel = (
    entries: ChatEntryType[],
    tabId: TabId
  ): React.ReactNode => {
    const {
      isLoading,
      loadingLabel,
      emptyTitle,
      emptyMessage,
      isGroupsTabWithError,
    } = getWorkspaceState(tabId);

    if (isLoading) {
      return (
        <Box className="who-chat-box-full chat-panel-state">
          <Spinner />
          <Text>{loadingLabel}</Text>
        </Box>
      );
    }
    if (isGroupsTabWithError) {
      return (
        <Box className="who-chat-box-full chat-panel-state">
          <ErrorState
            title={groupErrorTitle}
            message={groupLoadError || groupErrorMessage}
          />
        </Box>
      );
    }
    if (entries.length === 0) {
      return (
        <Box className="who-chat-box-full chat-panel-state">
          <EmptyState title={emptyTitle} message={emptyMessage} />
        </Box>
      );
    }

    const selectedEntry = entries.find(
      (entry) => entry.key === selectedChatKey
    );
    if (!selectedEntry) {
      return (
        <Box className="who-chat-box-full chat-panel-state">
          <EmptyState
            title={noChatSelectedTitle}
            message={noChatSelectedMessage}
          />
        </Box>
      );
    }

    const selectedDirectContact =
      tabId === TAB_DIRECT ? getOtherMembers(selectedEntry.chat)[0] : undefined;
    const directConversationContext =
      tabId === TAB_DIRECT
        ? getDirectConversationContext(selectedEntry)
        : undefined;
    const isFirstContact =
      tabId === TAB_DIRECT && selectedEntry.chat.messages.length === 0;
    const firstContactGuidance =
      tabId === TAB_DIRECT && isFirstContact
        ? buildFirstContactGuidance({
            recipient: directConversationContext?.recipientProfile,
            viewer: viewerActor,
            isConnection: directConversationContext?.isConnection ?? false,
            introAllowed:
              directConversationContext?.introDecision.allowed ?? true,
            blockedExplanation: directConversationContext?.introDecision.reason,
            strings: messagingGuidanceStrings,
            language,
          })
        : undefined;
    const suggestionSet =
      tabId === TAB_DIRECT &&
      selectedDirectContact &&
      (directConversationContext?.introDecision.allowed ?? true)
        ? buildFirstMessageSuggestions({
            viewer: currentUserProfile,
            recipient: directConversationContext?.recipientProfile,
            isConnection: directConversationContext?.isConnection ?? false,
            language,
            strings: messagingGuidanceStrings,
          })
        : [];

    return (
      <ChatView
        chat={selectedEntry.chat}
        onSend={handleSend}
        onBack={() => setSelectedChatKey(null)}
        language={language}
        labels={{
          back: backLabel,
          send: sendLabel,
          placeholder: composerPlaceholder,
          statusSent: statusSentLabel,
          statusDelivered: statusDeliveredLabel,
          statusRead: statusReadLabel,
          avatarPrefix,
          currentUserName,
          report: reportLabel,
          block: blockLabel,
          suggestedOpeners: suggestedOpenersLabel,
          useSuggestion: useSuggestionLabel,
        }}
        suggestions={suggestionSet}
        feedback={conversationFeedback}
        onReport={() => handleReportConversation(selectedEntry)}
        onBlock={() => handleBlockConversation(selectedEntry)}
        guidance={firstContactGuidance}
        composeDisabled={
          interactionGate.isLocked ||
          (isFirstContact &&
            !(directConversationContext?.introDecision.allowed ?? true))
        }
        interactionGate={interactionGate}
      />
    );
  };

  /**
   * Render the mobile-first list view with a dedicated thread drill-in.
   */
  const renderMobileListView = (
    entries: ChatEntryType[],
    tabId: TabId
  ): React.ReactNode => {
    const {
      isLoading,
      loadingLabel,
      emptyTitle,
      emptyMessage,
      isGroupsTabWithError,
    } = getWorkspaceState(tabId);

    return (
      <Box className="messages-tab-list-pane">
        {renderSearchControl(tabId)}
        {isLoading ? (
          <Box className="who-chat-box-full chat-panel-state chat-list-panel-state">
            <Spinner />
            <Text>{loadingLabel}</Text>
          </Box>
        ) : isGroupsTabWithError ? (
          <Box className="who-chat-box-full chat-panel-state chat-list-panel-state">
            <ErrorState
              title={groupErrorTitle}
              message={groupLoadError || groupErrorMessage}
            />
          </Box>
        ) : entries.length === 0 ? (
          <Box className="who-chat-box-full chat-panel-state chat-list-panel-state">
            <EmptyState title={emptyTitle} message={emptyMessage} />
          </Box>
        ) : (
          renderChatList(entries)
        )}
      </Box>
    );
  };

  /**
   * Render a single tab workspace with search, list, and conversation areas.
   */
  const renderTabWorkspace = (entries: ChatEntryType[], tabId: TabId) => (
    <Box
      className={`messages-tab-workspace ${
        isMobileViewport
          ? isChatSelected
            ? 'mobile-thread-view'
            : 'mobile-list-view'
          : 'split-view'
      }`}
    >
      {isMobileViewport ? (
        isChatSelected ? (
          <Box className="messages-tab-conversation-pane">
            {renderConversationPanel(entries, tabId)}
          </Box>
        ) : (
          renderMobileListView(entries, tabId)
        )
      ) : (
        <>
          <Box className="messages-tab-list-pane">
            {renderSearchControl(tabId)}
            {renderChatList(entries)}
          </Box>
          <Box className="messages-tab-conversation-pane">
            {renderConversationPanel(entries, tabId)}
          </Box>
        </>
      )}
    </Box>
  );

  const panels: PanelsType = [
    {
      title: directTabLabel,
      panel: renderTabWorkspace(filteredDirectEntries, TAB_DIRECT),
    },
    {
      title: groupsTabLabel,
      panel: renderTabWorkspace(filteredGroupEntries, TAB_GROUPS),
    },
  ];

  /**
   * Switch tabs and reset chat selection.
   */
  const handleTabChange = (nextTab: number) => {
    setSelectedChatKey(null);
    setTabIndex(toTabId(nextTab));
  };

  return (
    <Container
      component="main"
      className={`who-main messages responsive split slide${
        isChatSelected ? ' chat-selected' : ''
      } ${mode.id}`}
    >
      <Tabs
        panels={panels}
        title="messages-tabs"
        tabIndex={tabIndex}
        setTabIndex={handleTabChange}
      />
    </Container>
  );
};

export { ChatView };

export default Messages;
