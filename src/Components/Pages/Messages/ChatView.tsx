import {
  type ChangeEvent,
  type FC,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import Avatar from '@mui/material/Avatar';
import type {
  ChatType,
  InteractionGateType,
  MessageStatusType,
} from '../../../types';
import { Box, Button, Card, Text } from '../../';
import { Input } from '../../Common';
import InteractionGateNotice from '../../Common/InteractionGateNotice';
import { DIRECT_CHAT_SELF_ID } from '../../../Utlilities/chatIdentity';
import type { FirstContactGuidanceType } from './MessageGuidance';
import {
  formatMessageTimestamp,
  getChatTitle,
  getContactInitials,
} from './messagesChatUtils';

type ChatViewProps = {
  chat: ChatType;
  language: string;
  onSend: (text: string) => void;
  onBack: () => void;
  labels: {
    back: string;
    send: string;
    placeholder: string;
    statusSent: string;
    statusDelivered: string;
    statusRead: string;
    avatarPrefix: string;
    currentUserName: string;
    report: string;
    block: string;
    suggestedOpeners: string;
    useSuggestion: string;
  };
  suggestions?: string[];
  feedback?: string | null;
  onReport?: () => void;
  onBlock?: () => void;
  guidance?: FirstContactGuidanceType;
  composeDisabled?: boolean;
  interactionGate?: InteractionGateType;
};

const getMessageStatusLabel = (
  status: MessageStatusType | undefined,
  labels: {
    sent: string;
    delivered: string;
    read: string;
  }
): string => {
  if (status === 'delivered') {
    return labels.delivered;
  }
  if (status === 'read') {
    return labels.read;
  }
  return labels.sent;
};

/**
 * Conversation pane shared by direct chats and community-derived group chats.
 */
export const ChatView: FC<ChatViewProps> = ({
  chat,
  language,
  onSend,
  onBack,
  labels,
  suggestions = [],
  feedback = null,
  onReport,
  onBlock,
  guidance,
  composeDisabled = false,
  interactionGate,
}) => {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [chat.messages.length]);

  /**
   * Submit the composer message to the parent list state.
   */
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (composeDisabled) {
      return;
    }
    const trimmedDraft = draft.trim();
    if (!trimmedDraft) {
      return;
    }
    onSend(trimmedDraft);
    setDraft('');
  };

  return (
    <Box className="who-chat-box-full">
      <Box className="chat-header">
        <Button onClick={onBack} className="secondary">
          <Text>{labels.back}</Text>
        </Button>
        <Text className="chat-title">{getChatTitle(chat)}</Text>
        <Box
          sx={{ display: 'flex', gap: 1, marginLeft: 'auto', flexWrap: 'wrap' }}
        >
          {onReport ? (
            <Button onClick={onReport} className="secondary">
              <Text>{labels.report}</Text>
            </Button>
          ) : null}
          {onBlock ? (
            <Button onClick={onBlock} className="secondary">
              <Text>{labels.block}</Text>
            </Button>
          ) : null}
        </Box>
      </Box>

      <Box className="messages-container">
        {chat.messages.map((message, index) => {
          const isSelf = message.sender.id === DIRECT_CHAT_SELF_ID;
          const senderName = isSelf
            ? labels.currentUserName
            : message.sender.name;
          const timestamp = formatMessageTimestamp(message.sentAt, language);
          const statusLabel = isSelf
            ? getMessageStatusLabel(message.status, {
                sent: labels.statusSent,
                delivered: labels.statusDelivered,
                read: labels.statusRead,
              })
            : '';
          const avatarLabel = `${labels.avatarPrefix} ${senderName}`;
          return (
            <Card
              key={`${message.sender.id}-${String(message.sentAt)}-${index}`}
              className={`who-message-card ${
                isSelf ? 'self-message' : 'other-message'
              }`}
            >
              <Avatar
                src={message.sender.avatarUrl}
                alt={avatarLabel}
                aria-label={avatarLabel}
                className="message-avatar"
              >
                {getContactInitials(senderName)}
              </Avatar>
              <Box className="message-content">
                <Text className="message-sender">{senderName}</Text>
                <Text className="message-text">{message.text}</Text>
                <Box className="message-meta">
                  <Text className="message-timestamp">{timestamp}</Text>
                  {isSelf ? (
                    <Text className="message-status">{statusLabel}</Text>
                  ) : null}
                </Box>
              </Box>
            </Card>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {guidance &&
      (guidance.bannerMessages.length > 0 ||
        (chat.messages.length === 0 && guidance.promptItems.length > 0)) ? (
        <Box className="chat-guidance">
          {guidance.bannerMessages.map((message) => (
            <Text key={message} variant="body2" color="text.secondary">
              {message}
            </Text>
          ))}
          {chat.messages.length === 0 && guidance.promptItems.length > 0 ? (
            <Box className="chat-guidance-prompts">
              {guidance.promptItems.map((prompt) => (
                <Card key={prompt.id} className="who-message-guidance-card">
                  <Text variant="subtitle2">{prompt.label}</Text>
                  <Text variant="body2" color="text.secondary">
                    {prompt.description}
                  </Text>
                </Card>
              ))}
            </Box>
          ) : null}
        </Box>
      ) : null}

      {feedback ? (
        <Box sx={{ paddingInline: 2, paddingBottom: 1 }}>
          <Text variant="body2" color="text.secondary">
            {feedback}
          </Text>
        </Box>
      ) : null}
      {interactionGate?.isLocked ? (
        <Box sx={{ paddingInline: 2, paddingBottom: 1 }}>
          <InteractionGateNotice gate={interactionGate} variant="body2" />
        </Box>
      ) : null}

      {chat.messages.length === 0 && suggestions.length > 0 ? (
        <Box
          sx={{ paddingInline: 2, paddingBottom: 1, display: 'grid', gap: 1 }}
        >
          <Text variant="subtitle2">{labels.suggestedOpeners}</Text>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                className="secondary"
                onClick={() => setDraft(suggestion)}
                disabled={composeDisabled}
              >
                <Text>{labels.useSuggestion}</Text>
              </Button>
            ))}
          </Box>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {suggestions.map((suggestion) => (
              <Text
                key={`${suggestion}-copy`}
                variant="body2"
                color="text.secondary"
              >
                {suggestion}
              </Text>
            ))}
          </Box>
        </Box>
      ) : null}

      <Box component="form" className="chat-composer" onSubmit={handleSubmit}>
        <Box className="message-input-field">
          <Input
            type="text"
            inline
            fullWidth
            variant="outlined"
            className="message-input"
            placeholder={labels.placeholder}
            aria-label={labels.placeholder}
            value={draft}
            disabled={composeDisabled}
            handleChange={(
              event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => setDraft(event.target.value)}
          />
        </Box>
        <Button type="submit" disabled={composeDisabled || !draft.trim()}>
          <Text>{labels.send}</Text>
        </Button>
      </Box>
    </Box>
  );
};
