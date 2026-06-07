import { fetchTranslations } from '../../../Utlilities';
import type { GroupType } from '../../../types';
import { buildCommunitySurfaceGuidance } from './communityGuidance';

const translations = fetchTranslations();

/**
 * Build a deterministic community fixture for guidance tests.
 */
const buildGroup = (): GroupType => ({
  id: 'community-group-1',
  groupName: 'Community Group',
  groupPicture: '',
  description: 'Shared community context',
  category: 'book club',
  location: 'Portland, OR',
  groupType: 'public',
  interests: ['reading'],
  rules: 'Be respectful.',
  tags: ['conversation'],
  starredTags: ['books'],
  admins: ['host-1'],
  members: [
    {
      groupId: 'community-group-1',
      userId: 'host-1',
      userName: 'Morgan Host',
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  chatRooms: [],
  governance: {
    joinPolicy: 'open',
    postingPolicy: 'all_members',
    moderationSummary: 'Clear moderation and respectful participation.',
  },
  events: [
    {
      id: 'event-1',
      title: 'Sunday reading circle',
      description: 'Bring a favorite passage.',
      location: 'Library Annex',
      startsAt: '2026-05-01T18:00:00.000Z',
      createdBy: 'host-1',
      attendance: {
        going: [],
        interested: [],
        cant_make_it: [],
      },
    },
  ],
  availabilityOptions: [],
  mode: 'friends',
});

describe('communityGuidance', () => {
  test('builds why-join, organizer, norms, and activity guidance for unjoined groups', () => {
    const guidance = buildCommunitySurfaceGuidance({
      group: buildGroup(),
      joined: false,
      strings: translations.communityGuidance.friends,
      commonStrings: translations.common,
      language: 'en',
    });

    expect(guidance.whyJoinReasons).toEqual([
      'books',
      'Sunday reading circle',
      'Portland, OR',
    ]);
    expect(guidance.whyJoinRecommendation).toBe(
      'Joining first may make new friendship easier here.'
    );
    expect(guidance.organizerCue).toBe('Morgan Host');
    expect(guidance.normsCue).toBe(
      'Clear moderation and respectful participation.'
    );
    expect(guidance.activityCue).toBe('Sunday reading circle');
  });

  test('omits join-first recommendation for joined groups and falls back to chat activity', () => {
    const group = buildGroup();
    group.events = [];
    group.chatRooms = [
      {
        roomId: 'room-1',
        groupId: group.id,
        roomName: 'General chat',
        createdAt: '2026-01-01T00:00:00.000Z',
        members: group.members,
        messages: [
          {
            groupId: group.id,
            messageId: 'message-1',
            senderId: 'host-1',
            content: 'See you next week.',
            sentAt: '2026-04-10T12:00:00.000Z',
          },
        ],
      },
    ];

    const guidance = buildCommunitySurfaceGuidance({
      group,
      joined: true,
      strings: translations.communityGuidance.friends,
      commonStrings: translations.common,
      language: 'en',
    });

    expect(guidance.whyJoinRecommendation).toBeUndefined();
    expect(guidance.activityCue).toBe('General chat');
  });
});
