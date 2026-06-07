import {
  blankAcademicProfile,
  blankDatingProfile,
  blankFriendProfile,
  blankNeighborhoodProfile,
  blankProfessionalProfile,
} from '../../../../Utlilities';
import { calculateDashboardCompletion } from '../dashboardCompletion';

type DashboardCompletionProfileArg = Parameters<
  typeof calculateDashboardCompletion
>[0]['profile'];

describe('calculateDashboardCompletion', () => {
  test('returns 0 for an empty friends profile', () => {
    const completion = calculateDashboardCompletion({
      modeId: 'friends',
      profile: blankFriendProfile,
    });

    expect(completion.percentage).toBe(0);
    expect(completion.missingTaskIds[0]).toBe('addPhoto');
  });

  test('tracks missing activation requirements for a partially complete friends profile', () => {
    const profile = {
      ...blankFriendProfile,
      pictures: ['https://example.com/photo.jpg'],
      name: 'Casey',
      main: {
        ...blankFriendProfile.main,
        seeking: ['friends'],
        pronouns: 'they/them',
      },
    };
    const completion = calculateDashboardCompletion({
      modeId: 'friends',
      profile,
    });

    expect(completion.percentage).toBe(50);
    expect(completion.missingTaskIds).toContain('addAge');
    expect(completion.missingTaskIds).toContain('addLocation');
  });

  test('returns 100 for a fully complete professional profile', () => {
    const profile = {
      ...blankProfessionalProfile,
      pictures: ['https://example.com/photo.jpg'],
      name: 'Jordan',
      main: {
        ...blankProfessionalProfile.main,
        location: 'Portland',
        pronouns: 'they/them',
        seeking: ['networking'],
        tagline: 'Product engineer building thoughtful systems.',
      },
      highlights: {
        ...blankProfessionalProfile.highlights,
        summary: 'Product engineer focused on collaboration.',
        skills: ['TypeScript'],
      },
    };
    const completion = calculateDashboardCompletion({
      modeId: 'professional',
      profile,
    });

    expect(completion.percentage).toBe(100);
    expect(completion.missingTaskIds).toHaveLength(0);
  });

  test('requires academic primary affiliation for full completion', () => {
    const profile = {
      ...blankAcademicProfile,
      pictures: ['https://example.com/photo.jpg'],
      name: 'Riley',
      main: {
        ...blankAcademicProfile.main,
        location: 'Boston',
        pronouns: 'she/her',
        seeking: ['collaboration'],
        tagline: 'Researching trust in social systems.',
      },
      highlights: {
        ...blankAcademicProfile.highlights,
        summary: 'Published work on healthy online communities.',
      },
    };
    const completion = calculateDashboardCompletion({
      modeId: 'academic',
      profile,
    });

    expect(completion.percentage).toBe(88);
    expect(completion.missingTaskIds).toContain('addPrimaryAffiliation');
    expect(completion.missingTaskIds).not.toContain('addContact');
  });

  test('counts autocomplete-backed values as complete', () => {
    const profile = {
      ...blankFriendProfile,
      pictures: ['https://example.com/photo.jpg'],
      name: 'Casey',
      main: {
        ...blankFriendProfile.main,
        age: 29,
        location: 'Seattle',
        seeking: [
          {
            value: 'new_friends',
            label: 'New friends',
          },
        ],
        pronouns: {
          value: 'they_them',
          label: 'they/them',
        },
      },
      hobbies: {
        ...blankFriendProfile.hobbies,
        full: [
          {
            value: 'live_music',
            label: 'Live music',
          },
        ],
      },
      prompts: {
        ...blankFriendProfile.prompts,
        selfSummary: 'Always up for coffee and concerts.',
      },
    };
    const completion = calculateDashboardCompletion({
      modeId: 'friends',
      profile,
    });

    expect(completion.percentage).toBe(100);
    expect(completion.missingTaskIds).toHaveLength(0);
  });

  test.each([
    {
      modeId: 'friends' as const,
      profile: {
        ...blankFriendProfile,
        pictures: ['https://example.com/photo.jpg'],
        name: 'Casey',
        main: {
          ...blankFriendProfile.main,
          age: '29',
          location: 'Seattle',
          pronouns: 'they/them',
          seeking: ['new_friends'],
        },
        hobbies: {
          ...blankFriendProfile.hobbies,
          full: ['Live music'],
        },
        prompts: {
          ...blankFriendProfile.prompts,
          selfSummary: 'Always up for coffee and concerts.',
        },
      } as unknown as DashboardCompletionProfileArg,
    },
    {
      modeId: 'dating' as const,
      profile: {
        ...blankDatingProfile,
        pictures: ['https://example.com/photo.jpg'],
        name: 'Jordan',
        main: {
          ...blankDatingProfile.main,
          age: '34',
          location: 'Portland',
          pronouns: 'they/them',
          seeking: ['long_term_relationship'],
        },
        hobbies: {
          ...blankDatingProfile.hobbies,
          full: ['Cooking'],
        },
        prompts: {
          ...blankDatingProfile.prompts,
          currentGoal: 'Looking for a grounded relationship.',
        },
      } as unknown as DashboardCompletionProfileArg,
    },
    {
      modeId: 'neighborhood' as const,
      profile: {
        ...blankNeighborhoodProfile,
        pictures: ['https://example.com/photo.jpg'],
        name: 'Alex',
        main: {
          ...blankNeighborhoodProfile.main,
          age: '41',
          location: 'Oakland',
          pronouns: 'she/her',
          seeking: ['community'],
        },
        hobbies: {
          ...blankNeighborhoodProfile.hobbies,
          full: ['Gardening'],
        },
      } as unknown as DashboardCompletionProfileArg,
    },
  ])(
    'treats persisted string ages as complete for $modeId profiles',
    ({ modeId, profile }) => {
      const completion = calculateDashboardCompletion({
        modeId,
        profile,
      });

      expect(completion.missingTaskIds).not.toContain('addAge');
    }
  );
});
