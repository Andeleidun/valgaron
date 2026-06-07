import { fireEvent, render, screen } from '@testing-library/react';
import GroupDetail from '../GroupDetail';
import { fetchTranslations } from '../../../../Utlilities';
import type { GroupType } from '../../../../types';

/**
 * Build a complete community detail fixture with deterministic defaults.
 */
const buildGroup = (): GroupType => ({
  id: 'group-1',
  groupName: 'Neighborhood Circle',
  groupPicture: '',
  description: 'Shared neighborhood updates and small local plans.',
  category: 'general',
  location: 'Portland, OR',
  groupType: 'public',
  interests: ['community'],
  rules: 'Be respectful.',
  tags: ['neighbors', 'updates'],
  starredTags: ['local'],
  admins: ['admin-user'],
  governance: {
    joinPolicy: 'open',
    postingPolicy: 'all_members',
    moderationSummary:
      'Members can join and participate directly with light moderation.',
  },
  roles: [
    {
      id: 'organizer',
      name: 'Organizer',
      description: 'Keeps plans moving.',
      permissionIds: ['schedule_events'],
    },
  ],
  events: [
    {
      id: 'event-1',
      title: 'Block Party',
      description: 'Bring snacks.',
      location: 'Main Street',
      startsAt: '2026-05-01T18:30:00.000Z',
      createdBy: 'admin-user',
      attendance: {
        going: ['member-1'],
        interested: [],
        cant_make_it: [],
      },
    },
  ],
  availabilityOptions: [
    {
      id: 'availability-1',
      label: 'Saturday morning',
      voterUserIds: ['member-1'],
    },
  ],
  members: [
    {
      groupId: 'group-1',
      userId: 'admin-user',
      userName: 'Admin User',
      joinedAt: '2026-01-01T00:00:00.000Z',
      roleIds: ['organizer'],
    },
    {
      groupId: 'group-1',
      userId: 'member-1',
      userName: 'Taylor Member',
      joinedAt: '2026-01-02T00:00:00.000Z',
      roleIds: [],
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  chatRooms: [],
  mode: 'friends',
});

/**
 * Render GroupDetail with shared test doubles.
 */
const renderGroupDetail = ({
  isAdmin = false,
  joined = true,
}: {
  isAdmin?: boolean;
  joined?: boolean;
} = {}) => {
  const translations = fetchTranslations();

  const props = {
    group: buildGroup(),
    language: 'en',
    joined,
    isAdmin,
    currentUserId: isAdmin ? 'admin-user' : 'member-1',
    onJoinToggle: jest.fn(),
    onBack: jest.fn(),
    onMessageGroup: jest.fn(),
    onEditGroup: jest.fn(),
    onAssignRole: jest.fn(),
    onRemoveRole: jest.fn(),
    onScheduleEvent: jest.fn(),
    onRespondToEvent: jest.fn(),
    onSetAvailabilityOptions: jest.fn(),
    onVoteAvailability: jest.fn(),
    onReportGroup: jest.fn(),
    onBlockGroup: jest.fn(),
    strings: {
      common: translations.common,
      communityGuidance: translations.communityGuidance.friends,
    },
    guidance: {
      whyJoinReasons: ['Shared updates', 'Local coordination'],
      whyJoinRecommendation: 'This is a practical group to join early.',
      organizerCue: 'Responsive host',
      normsCue: 'Be respectful',
      activityCue: 'Weekly plans',
    },
  };

  return {
    ...render(<GroupDetail {...props} />),
    props,
    translations,
  };
};

const getCommonTestLabel = (
  translations: ReturnType<typeof fetchTranslations>
): Record<
  | 'adminTools'
  | 'availability'
  | 'availabilityOptions'
  | 'communityDetails'
  | 'edit'
  | 'eventDescription'
  | 'eventLocation'
  | 'eventStartsAt'
  | 'eventTitle'
  | 'events'
  | 'going'
  | 'members'
  | 'message'
  | 'saveAvailability'
  | 'scheduleEvent',
  string
> => ({
  adminTools: translations.common.adminToolsLabel?.en ?? 'Admin tools',
  availability: translations.common.availabilityLabel?.en ?? 'Availability',
  availabilityOptions:
    translations.common.availabilityOptionsLabel?.en ?? 'Availability options',
  communityDetails:
    translations.common.communityDetailsLabel?.en ?? 'Community details',
  edit: translations.common.edit?.en ?? 'Edit',
  eventDescription:
    translations.common.eventDescriptionLabel?.en ?? 'Event description',
  eventLocation: translations.common.eventLocationLabel?.en ?? 'Event location',
  eventStartsAt: translations.common.eventStartsAtLabel?.en ?? 'Starts at',
  eventTitle: translations.common.eventTitleLabel?.en ?? 'Event title',
  events: translations.common.eventsLabel?.en ?? 'Events',
  going: translations.common.goingLabel?.en ?? 'Going',
  members: translations.common.membersLabel?.en ?? 'Members',
  message: translations.common.message.en,
  saveAvailability:
    translations.common.saveAvailabilityLabel?.en ??
    'Save availability options',
  scheduleEvent: translations.common.scheduleEventLabel?.en ?? 'Schedule event',
});

describe('GroupDetail', () => {
  test('keeps member-facing sections visible while hiding admin tools for non-admins', () => {
    const { translations } = renderGroupDetail();
    const labels = getCommonTestLabel(translations);

    expect(screen.getByText(labels.communityDetails)).toBeInTheDocument();
    expect(screen.getByText(labels.events)).toBeInTheDocument();
    expect(screen.getByText(labels.availability)).toBeInTheDocument();
    expect(screen.getByText(labels.members)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: labels.message })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: labels.going })
    ).toBeInTheDocument();

    expect(screen.queryByText(labels.adminTools)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: labels.edit })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(labels.eventTitle)).not.toBeInTheDocument();
  });

  test('surfaces dedicated admin tools and routes edits through isolated controls', () => {
    const { props, translations } = renderGroupDetail({ isAdmin: true });
    const labels = getCommonTestLabel(translations);

    expect(screen.getByText(labels.adminTools)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: labels.edit })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(labels.eventTitle), {
      target: { value: 'Planning Night' },
    });
    fireEvent.change(screen.getByLabelText(labels.eventLocation), {
      target: { value: 'Community Hall' },
    });
    fireEvent.change(screen.getByLabelText(labels.eventDescription), {
      target: { value: 'Plan the next meetup.' },
    });
    fireEvent.change(screen.getByLabelText(labels.eventStartsAt), {
      target: { value: '2026-05-01T18:30' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: labels.scheduleEvent,
      })
    );

    expect(props.onScheduleEvent).toHaveBeenCalledWith(
      'group-1',
      'Planning Night',
      'Plan the next meetup.',
      'Community Hall',
      '2026-05-01T18:30'
    );

    fireEvent.change(screen.getByLabelText(labels.availabilityOptions), {
      target: { value: 'Saturday morning, Sunday afternoon' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: labels.saveAvailability,
      })
    );

    expect(props.onSetAvailabilityOptions).toHaveBeenCalledWith('group-1', [
      'Saturday morning',
      'Sunday afternoon',
    ]);

    fireEvent.click(
      screen.getByRole('button', { name: 'Assign role: Taylor Member' })
    );

    expect(props.onAssignRole).toHaveBeenCalledWith(
      'group-1',
      'member-1',
      'organizer'
    );
  });
});
