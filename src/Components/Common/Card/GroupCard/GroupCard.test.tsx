import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCard from './GroupCard';
import { fetchTranslations } from '../../../../Utlilities';
import type { GroupType } from '../../../../types';
import { flushReactEffects, runWithReactAct } from '../../../../test/reactAct';

/**
 * Build a minimal group fixture for GroupCard tests.
 */
const buildGroup = (): GroupType => ({
  id: 'group-1',
  groupName: 'Test Group',
  description: 'Group description',
  category: 'Social',
  location: 'Seattle',
  groupType: 'Meetup',
  interests: ['Testing'],
  rules: 'Be kind',
  groupPicture: '',
  tags: ['test'],
  members: [],
  createdAt: '2024-01-01',
  chatRooms: [],
  mode: 'friends',
});

describe('GroupCard', () => {
  test('invokes join toggle handler', async () => {
    const translations = fetchTranslations();
    const handleJoinToggle = jest.fn();
    render(
      <GroupCard
        group={buildGroup()}
        language="en"
        mode={{ id: 'friends' }}
        joined={false}
        onJoinToggle={handleJoinToggle}
        strings={{ common: translations.common }}
      />
    );
    await flushReactEffects();

    await runWithReactAct(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    });
    await flushReactEffects();
    expect(handleJoinToggle).toHaveBeenCalledTimes(1);
  });

  test('renders optional action buttons when provided', () => {
    const translations = fetchTranslations();
    render(
      <GroupCard
        group={buildGroup()}
        language="en"
        mode={{ id: 'friends' }}
        joined={true}
        onJoinToggle={jest.fn()}
        onViewDetails={jest.fn()}
        onMessageGroup={jest.fn()}
        isAdmin={true}
        onEditGroup={jest.fn()}
        strings={{ common: translations.common }}
      />
    );

    expect(
      screen.getByRole('button', { name: 'View Details' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Message' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  test('renders community rationale and trust cues when discovery guidance is provided', () => {
    const translations = fetchTranslations();
    render(
      <GroupCard
        group={buildGroup()}
        language="en"
        mode={{ id: 'friends' }}
        joined={false}
        onJoinToggle={jest.fn()}
        strings={{
          common: translations.common,
          communityGuidance: translations.communityGuidance.friends,
        }}
        guidance={{
          whyJoinReasons: ['Shared interests', 'Helpful community context'],
          whyJoinRecommendation:
            'Joining first may make new friendship easier here.',
          organizerCue: 'Host Name',
          normsCue: 'Be kind',
          activityCue: 'Coffee walk',
        }}
      />
    );

    expect(
      screen.getByText(
        'Why join this community: Shared interests • Helpful community context'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Joining first may make new friendship easier here.')
    ).toBeInTheDocument();
    expect(screen.getByText('Organizer: Host Name')).toBeInTheDocument();
    expect(screen.getByText('Community norms: Be kind')).toBeInTheDocument();
    expect(screen.getByText('Activity level: Coffee walk')).toBeInTheDocument();
  });

  test('disables join and management actions when the activation interaction gate is locked', () => {
    const translations = fetchTranslations();
    render(
      <GroupCard
        group={buildGroup()}
        language="en"
        mode={{ id: 'friends' }}
        joined={false}
        onJoinToggle={jest.fn()}
        onViewDetails={jest.fn()}
        onMessageGroup={jest.fn()}
        isAdmin={true}
        onEditGroup={jest.fn()}
        strings={{ common: translations.common }}
        interactionGate={{
          isLocked: true,
          message: 'Complete your profile to interact with people and groups.',
        }}
      />
    );

    expect(
      screen.getByText(/Complete your profile to interact/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Message' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'View Details' })).toBeEnabled();
  });
});
