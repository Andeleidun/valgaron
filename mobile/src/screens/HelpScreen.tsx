import {
  getCodexHelpScreenModel,
  getCodexScreenIntro,
  valgaronPrivacyPolicy,
} from '@valgaron/core';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import { getMobileRouteHref } from '../navigation/mobileRoutes';
import { getMobileRouteParam } from '../navigation/mobileRouteParams';
import { useMobileSectionPreferences } from '../state/useMobileSectionPreferences';
import {
  ActionButton,
  BodyText,
  ButtonRow,
  MutedText,
  MobileSectionDashboard,
  ScreenHeader,
  ScreenScroll,
  SectionBlock,
} from './screenPrimitives';

export function HelpScreen() {
  const intro = getCodexScreenIntro('help');
  const routeParams = useLocalSearchParams<{ topic?: string }>();
  const helpModel = getCodexHelpScreenModel(
    getMobileRouteParam(routeParams.topic)
  );
  const { focusedTopic } = helpModel;
  const helpSectionIds = [
    ...(focusedTopic ? ['help.focused'] : []),
    'help.first-use',
    'help.quick-actions',
    'help.focus-topics',
    ...helpModel.workflowTopics.map((_, index) => `help.workflow.${index}`),
    'help.data',
    'help.offline',
    'help.support',
    'help.privacy',
    'help.release-limits',
  ];
  const dashboard = useMobileSectionPreferences({
    screenId: 'help',
    sectionIds: helpSectionIds,
  });

  return (
    <ScreenScroll>
      <ScreenHeader
        title={helpModel.app.title}
        detail={`${intro.detail} ${helpModel.app.versionText}`}
      />

      <MobileSectionDashboard
        collapsed={dashboard.collapsed}
        isLoaded={dashboard.isLoaded}
        onMove={dashboard.move}
        onReset={dashboard.reset}
        onResetAll={dashboard.resetAll}
        onSetCollapsed={dashboard.setCollapsed}
        order={dashboard.order}
      >
        {focusedTopic ? (
          <SectionBlock
            sectionId="help.focused"
            title={`${helpModel.sections.focused.title}: ${focusedTopic.title}`}
          >
            <BodyText>{focusedTopic.detail}</BodyText>
          </SectionBlock>
        ) : null}

        <SectionBlock
          sectionId="help.first-use"
          title={helpModel.sections.firstUse.title}
        >
          <BodyText>{helpModel.firstUse}</BodyText>
        </SectionBlock>

        <SectionBlock
          sectionId="help.quick-actions"
          title={helpModel.sections.quickActions.title}
        >
          <ButtonRow>
            {helpModel.quickActions.map((action) => (
              <ActionButton
                key={action.id}
                label={action.label}
                onPress={() => router.push(getMobileRouteHref(action.path))}
              />
            ))}
          </ButtonRow>
        </SectionBlock>

        <SectionBlock
          sectionId="help.focus-topics"
          title={helpModel.sections.focusTopics.title}
        >
          <ButtonRow>
            {helpModel.focusTopics.map((topic) => (
              <ActionButton
                key={topic.id}
                label={topic.title}
                selected={focusedTopic?.id === topic.id}
                tone={focusedTopic?.id === topic.id ? 'accent' : 'neutral'}
                onPress={() => router.push(getMobileRouteHref(topic.path))}
              />
            ))}
          </ButtonRow>
        </SectionBlock>

        {helpModel.workflowTopics.map((topic, index) => (
          <SectionBlock
            key={topic.title}
            sectionId={`help.workflow.${index}`}
            title={topic.title}
          >
            {topic.items.map((item) => (
              <MutedText key={item}>{item}</MutedText>
            ))}
          </SectionBlock>
        ))}

        <SectionBlock sectionId="help.data" title={helpModel.data.title}>
          <BodyText>{helpModel.data.summary}</BodyText>
          {helpModel.data.details.map((item) => (
            <MutedText key={item.term}>
              {item.term}: {item.detail}
            </MutedText>
          ))}
        </SectionBlock>

        <SectionBlock sectionId="help.offline" title={helpModel.offline.title}>
          <MutedText>{helpModel.offline.detail}</MutedText>
        </SectionBlock>

        <SectionBlock sectionId="help.support" title={helpModel.support.title}>
          <MutedText>{helpModel.support.detail}</MutedText>
        </SectionBlock>

        <SectionBlock sectionId="help.privacy" title={helpModel.privacy.title}>
          <MutedText>{helpModel.privacy.detail}</MutedText>
          <ButtonRow>
            <ActionButton
              accessibilityHint="Opens the hosted web privacy policy."
              label={valgaronPrivacyPolicy.actionLabel}
              onPress={() => {
                void Linking.openURL(valgaronPrivacyPolicy.webUrl);
              }}
            />
          </ButtonRow>
        </SectionBlock>

        <SectionBlock
          sectionId="help.release-limits"
          title={helpModel.releaseLimits.title}
        >
          <MutedText>{helpModel.releaseLimits.detail}</MutedText>
        </SectionBlock>
      </MobileSectionDashboard>
    </ScreenScroll>
  );
}
