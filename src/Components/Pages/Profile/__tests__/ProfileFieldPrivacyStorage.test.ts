import {
  loadModeFieldPrivacy,
  persistModeFieldPrivacy,
} from '../ProfileFieldPrivacyStorage';

describe('ProfileFieldPrivacyStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('returns empty state when no data exists', () => {
    expect(loadModeFieldPrivacy('friends')).toEqual({});
  });

  test('filters invalid privacy levels from persisted storage', () => {
    window.localStorage.setItem(
      'whoProfileFieldPrivacy',
      JSON.stringify({
        friends: {
          bio: 'open',
          phone: 'invalid',
        },
        dating: {
          bio: 'verified_only',
        },
      })
    );

    expect(loadModeFieldPrivacy('friends')).toEqual({ bio: 'open' });
    expect(loadModeFieldPrivacy('dating')).toEqual({ bio: 'verified_only' });
  });

  test('persists and merges field privacy by mode', () => {
    persistModeFieldPrivacy({
      modeId: 'friends',
      fieldName: 'bio',
      level: 'open',
    });
    persistModeFieldPrivacy({
      modeId: 'friends',
      fieldName: 'age',
      level: 'connections_only',
    });
    persistModeFieldPrivacy({
      modeId: 'dating',
      fieldName: 'bio',
      level: 'verified_only',
    });

    expect(loadModeFieldPrivacy('friends')).toEqual({
      bio: 'open',
      age: 'connections_only',
    });
    expect(loadModeFieldPrivacy('dating')).toEqual({
      bio: 'verified_only',
    });
  });
});
