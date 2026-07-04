import {
  codexDataHelpDetails,
  codexDataHelpSummary,
  codexFirstUseHelp,
  codexHelpFocusTopics,
  codexPrivacyHelp,
  codexReleaseLimitsHelp,
  codexSupportHelp,
  codexWorkflowHelpTopics,
  getCodexHelpFocus,
  getCodexScreenIntro,
} from '@valgaron/core';
import { router, useLocalSearchParams } from 'expo-router';
import { getMobileTabHref, type MobileTabId } from '../navigation/mobileRoutes';
import { getMobileRouteParam } from '../navigation/mobileRouteParams';
import {
  ActionButton,
  BodyText,
  ButtonRow,
  MutedText,
  ScreenHeader,
  ScreenScroll,
  SectionBlock,
} from './screenPrimitives';

const helpQuickActions: Array<{ id: MobileTabId; label: string }> = [
  { id: 'entries', label: 'Open Entries' },
  { id: 'relationships', label: 'Open Links' },
  { id: 'workspaces', label: 'Open Worlds' },
  { id: 'data', label: 'Open Data' },
];

export function HelpScreen() {
  const intro = getCodexScreenIntro('help');
  const routeParams = useLocalSearchParams<{ topic?: string }>();
  const focusedTopic = getCodexHelpFocus(
    getMobileRouteParam(routeParams.topic)
  );

  return (
    <ScreenScroll>
      <ScreenHeader title={intro.title} detail={intro.detail} />

      {focusedTopic ? (
        <SectionBlock title={`Focused Help: ${focusedTopic.title}`}>
          <BodyText>{focusedTopic.detail}</BodyText>
        </SectionBlock>
      ) : null}

      <SectionBlock title="Start With One Workspace">
        <BodyText>{codexFirstUseHelp}</BodyText>
      </SectionBlock>

      <SectionBlock title="Quick Actions">
        <ButtonRow>
          {helpQuickActions.map((action) => (
            <ActionButton
              key={action.id}
              label={action.label}
              onPress={() => router.push(getMobileTabHref(action.id))}
            />
          ))}
        </ButtonRow>
      </SectionBlock>

      <SectionBlock title="Help Topics">
        <ButtonRow>
          {codexHelpFocusTopics.map((topic) => (
            <ActionButton
              key={topic.id}
              label={topic.title}
              selected={focusedTopic?.id === topic.id}
              tone={focusedTopic?.id === topic.id ? 'accent' : 'neutral'}
              onPress={() =>
                router.push({
                  pathname: '/help',
                  params: { topic: topic.id },
                })
              }
            />
          ))}
        </ButtonRow>
      </SectionBlock>

      {codexWorkflowHelpTopics.map((topic) => (
        <SectionBlock key={topic.title} title={topic.title}>
          {topic.items.map((item) => (
            <MutedText key={item}>{item}</MutedText>
          ))}
        </SectionBlock>
      ))}

      <SectionBlock title="Backups And Recovery">
        <BodyText>{codexDataHelpSummary}</BodyText>
        {codexDataHelpDetails.map((item) => (
          <MutedText key={item.term}>
            {item.term}: {item.detail}
          </MutedText>
        ))}
      </SectionBlock>

      <SectionBlock title="Support">
        <MutedText>{codexSupportHelp}</MutedText>
      </SectionBlock>

      <SectionBlock title="No Telemetry Or Remote Account">
        <MutedText>{codexPrivacyHelp}</MutedText>
      </SectionBlock>

      <SectionBlock title="Intentionally Out Of Scope">
        <MutedText>{codexReleaseLimitsHelp}</MutedText>
      </SectionBlock>
    </ScreenScroll>
  );
}
