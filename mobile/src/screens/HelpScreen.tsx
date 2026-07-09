import {
  getCodexHelpScreenModel,
  getCodexScreenIntro,
  valgaronPrivacyPolicy,
} from '@valgaron/core';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';
import { getMobileRouteHref } from '../navigation/mobileRoutes';
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

export function HelpScreen() {
  const intro = getCodexScreenIntro('help');
  const routeParams = useLocalSearchParams<{ topic?: string }>();
  const helpModel = getCodexHelpScreenModel(
    getMobileRouteParam(routeParams.topic)
  );
  const { focusedTopic } = helpModel;

  return (
    <ScreenScroll>
      <ScreenHeader
        title={helpModel.app.title}
        detail={`${intro.detail} ${helpModel.app.versionText}`}
      />

      {focusedTopic ? (
        <SectionBlock
          title={`${helpModel.sections.focused.title}: ${focusedTopic.title}`}
        >
          <BodyText>{focusedTopic.detail}</BodyText>
        </SectionBlock>
      ) : null}

      <SectionBlock title={helpModel.sections.firstUse.title}>
        <BodyText>{helpModel.firstUse}</BodyText>
      </SectionBlock>

      <SectionBlock title={helpModel.sections.quickActions.title}>
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

      <SectionBlock title={helpModel.sections.focusTopics.title}>
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

      {helpModel.workflowTopics.map((topic) => (
        <SectionBlock key={topic.title} title={topic.title}>
          {topic.items.map((item) => (
            <MutedText key={item}>{item}</MutedText>
          ))}
        </SectionBlock>
      ))}

      <SectionBlock title={helpModel.data.title}>
        <BodyText>{helpModel.data.summary}</BodyText>
        {helpModel.data.details.map((item) => (
          <MutedText key={item.term}>
            {item.term}: {item.detail}
          </MutedText>
        ))}
      </SectionBlock>

      <SectionBlock title={helpModel.offline.title}>
        <MutedText>{helpModel.offline.detail}</MutedText>
      </SectionBlock>

      <SectionBlock title={helpModel.support.title}>
        <MutedText>{helpModel.support.detail}</MutedText>
      </SectionBlock>

      <SectionBlock title={helpModel.privacy.title}>
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

      <SectionBlock title={helpModel.releaseLimits.title}>
        <MutedText>{helpModel.releaseLimits.detail}</MutedText>
      </SectionBlock>
    </ScreenScroll>
  );
}
