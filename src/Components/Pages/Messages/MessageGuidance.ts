import type {
  MessagingGuidanceModeStringsType,
  ProfileType,
} from '../../../types';
import { canViewProfileField, returnStringOrValue } from '../../../Utlilities';
import type { GateActorLikeType } from '../../../Utlilities/verificationGateFeedback';

/**
 * One informational prompt item shown in the first-contact tray.
 */
export type MessagePromptItemType = {
  id: string;
  label: string;
  description: string;
};

/**
 * Resolved first-contact guidance shown above the composer for direct chats.
 */
export type FirstContactGuidanceType = {
  bannerMessages: string[];
  promptItems: MessagePromptItemType[];
};

const getUniqueMessages = (values: string[]): string[] =>
  Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0)
    )
  );

const buildPromptItems = ({
  strings,
  language,
}: {
  strings: MessagingGuidanceModeStringsType;
  language: string;
}): MessagePromptItemType[] =>
  Object.keys(strings.firstMessagePromptLabels)
    .map((id) => ({
      id,
      label: returnStringOrValue(
        language,
        strings.firstMessagePromptLabels[id]
      ),
      description: returnStringOrValue(
        language,
        strings.firstMessagePromptDescriptions[id]
      ),
    }))
    .filter((item) => item.label.length > 0 && item.description.length > 0);

/**
 * Resolve connection-style hint keys only when the active viewer is allowed to
 * access those recipient fields.
 */
const getVisibleFirstContactHintKeys = ({
  recipient,
  viewer,
  isConnection,
  language,
}: {
  recipient: ProfileType;
  viewer?: GateActorLikeType;
  isConnection: boolean;
  language: string;
}): {
  communicationPaceKey: string;
  introductionPreferenceKey: string;
} => ({
  communicationPaceKey: canViewProfileField({
    profile: recipient,
    fieldName: 'connectionCommunicationPace',
    viewer,
    isConnection,
    language,
  })
    ? recipient.connectionStyle?.communicationPace ?? ''
    : '',
  introductionPreferenceKey: canViewProfileField({
    profile: recipient,
    fieldName: 'connectionIntroductionPreference',
    viewer,
    isConnection,
    language,
  })
    ? recipient.connectionStyle?.introductionPreference ?? ''
    : '',
});

/**
 * Resolve first-contact messaging guidance for a direct-chat recipient.
 */
export const buildFirstContactGuidance = ({
  recipient,
  viewer,
  isConnection,
  introAllowed,
  blockedExplanation,
  strings,
  language,
}: {
  recipient?: ProfileType;
  viewer?: GateActorLikeType;
  isConnection: boolean;
  introAllowed: boolean;
  blockedExplanation?: string;
  strings: MessagingGuidanceModeStringsType;
  language: string;
}): FirstContactGuidanceType => {
  if (!recipient) {
    return {
      bannerMessages: [],
      promptItems: [],
    };
  }

  const { communicationPaceKey, introductionPreferenceKey } =
    getVisibleFirstContactHintKeys({
      recipient,
      viewer,
      isConnection,
      language,
    });
  const hintKeys = getUniqueMessages([
    communicationPaceKey,
    introductionPreferenceKey,
  ]);
  const prefersGroupContext =
    introductionPreferenceKey === 'group_first' ||
    introductionPreferenceKey === 'context_before_direct';

  return {
    bannerMessages: getUniqueMessages([
      ...(introAllowed
        ? [returnStringOrValue(language, strings.introAllowed)]
        : [
            blockedExplanation ?? '',
            returnStringOrValue(language, strings.introBlocked),
          ]),
      ...(prefersGroupContext
        ? [returnStringOrValue(language, strings.groupFirstPreferred)]
        : []),
      ...hintKeys.map((key) =>
        returnStringOrValue(language, strings.paceHints[key])
      ),
    ]),
    promptItems: introAllowed
      ? buildPromptItems({
          strings,
          language,
        })
      : [],
  };
};
