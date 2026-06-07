import { buildFirstContactGuidance } from './MessageGuidance';
import { blankDatingProfile, fetchTranslations } from '../../../Utlilities';
import { datingProfileData } from '../../../Utlilities/data';
import type { ProfileType } from '../../../types';

const translations = fetchTranslations();

describe('MessageGuidance', () => {
  test('builds first-contact banner messages and prompt items from recipient preferences', () => {
    const viewer = {
      ...blankDatingProfile,
      id: 'viewer-visible',
      name: 'Viewer Visible',
    } as ProfileType;
    const recipient = {
      ...blankDatingProfile,
      id: 'recipient-visible',
      name: 'Recipient Visible',
      profileVisibility: 'open',
      fieldVisibility: {},
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'slow_thoughtful',
        introductionPreference: 'context_before_direct',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en'],
        },
      },
    } as ProfileType;

    const guidance = buildFirstContactGuidance({
      recipient,
      viewer,
      isConnection: false,
      introAllowed: true,
      strings: translations.messagingGuidance.dating,
      language: 'en',
    });

    expect(guidance.bannerMessages).toEqual(
      expect.arrayContaining([
        'Intro allowed',
        'Shared context is preferred before direct contact',
        'A little context first may improve this conversation',
      ])
    );
    expect(guidance.promptItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'shared_interest',
          label: 'Shared interest',
        }),
        expect.objectContaining({
          id: 'respectful_opening',
          label: 'Respectful opening',
        }),
      ])
    );
  });

  test('shows blocked guidance without prompt items when intro is unavailable', () => {
    const viewer = {
      ...blankDatingProfile,
      id: 'viewer-blocked',
      name: 'Viewer Blocked',
    } as ProfileType;
    const recipient = {
      ...blankDatingProfile,
      id: 'recipient-blocked',
      name: 'Recipient Blocked',
      profileVisibility: 'open',
      fieldVisibility: {},
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'balanced',
        introductionPreference: 'direct_intro_ok',
        planningStyle: 'spontaneous',
        languageComfort: {
          preferredLanguages: ['en'],
        },
      },
    } as ProfileType;

    const guidance = buildFirstContactGuidance({
      recipient,
      viewer,
      isConnection: false,
      introAllowed: false,
      strings: translations.messagingGuidance.dating,
      language: 'en',
    });

    expect(guidance.bannerMessages).toContain(
      'Intro messaging is limited here'
    );
    expect(guidance.promptItems).toEqual([]);
  });

  test('hides private connection-style hints from non-connections in first-contact guidance', () => {
    const viewer = {
      ...blankDatingProfile,
      id: 'viewer-hidden',
      name: 'Viewer Hidden',
      verificationTier: 'unverified',
    } as ProfileType;
    const recipient = {
      ...datingProfileData[0],
      id: 'recipient-hidden',
      fieldVisibility: {
        ...datingProfileData[0].fieldVisibility,
        connectionCommunicationPace: 'connections_only' as const,
        connectionIntroductionPreference: 'verified_only' as const,
      },
      connectionStyle: {
        availabilityPattern: 'weekends',
        communicationPace: 'slow_thoughtful',
        introductionPreference: 'context_before_direct',
        planningStyle: 'plan_ahead',
        languageComfort: {
          preferredLanguages: ['en'],
        },
      },
    } as ProfileType;

    const guidance = buildFirstContactGuidance({
      recipient,
      viewer,
      isConnection: false,
      introAllowed: true,
      strings: translations.messagingGuidance.dating,
      language: 'en',
    });

    expect(guidance.bannerMessages).toContain('Intro allowed');
    expect(guidance.bannerMessages).not.toContain(
      'Shared context is preferred before direct contact'
    );
    expect(guidance.bannerMessages).not.toContain(
      'A little context first may improve this conversation'
    );
  });
});
