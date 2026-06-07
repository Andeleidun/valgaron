import {
  fetchCommunityData,
  fetchCommunityDataAsync,
  fetchProfileData,
  fetchProfileDataAsync,
} from './DiscoveryHelper';
import {
  datingProfileData,
  friendProfileData,
  academicProfileData,
  professionalProfileData,
  neighborhoodProfileData,
  fetchGroups,
} from '../../../Utlilities/data';
import type { ModeType } from '../../../types';

describe('fetchProfileData', () => {
  it('returns dating profile data for dating mode', () => {
    const mode: ModeType = { id: 'dating' };
    const testData = fetchProfileData(mode);
    expect(testData).toBe(datingProfileData);
  });
  it('returns friends profile data for friends mode', () => {
    const mode: ModeType = { id: 'friends' };
    const testData = fetchProfileData(mode);
    expect(testData).toBe(friendProfileData);
  });
  it('returns academic profile data for academic mode', () => {
    const mode: ModeType = { id: 'academic' };
    const testData = fetchProfileData(mode);
    expect(testData).toBe(academicProfileData);
  });
  it('returns professional profile data for professional mode', () => {
    const mode: ModeType = { id: 'professional' };
    const testData = fetchProfileData(mode);
    expect(testData).toBe(professionalProfileData);
  });
  it('returns neighborhood profile data for neighborhood mode', () => {
    const mode: ModeType = { id: 'neighborhood' };
    const testData = fetchProfileData(mode);
    expect(testData).toBe(neighborhoodProfileData);
  });

  it('returns null for unsupported profile modes', () => {
    const mode = { id: 'unsupported' as ModeType['id'] };
    const testData = fetchProfileData(mode);
    expect(testData).toBeNull();
  });

  it('provides at least ten seeded profiles for every supported mode', () => {
    const seededProfilesByMode = [
      { modeId: 'dating' as const, profiles: datingProfileData },
      { modeId: 'friends' as const, profiles: friendProfileData },
      { modeId: 'academic' as const, profiles: academicProfileData },
      { modeId: 'professional' as const, profiles: professionalProfileData },
      { modeId: 'neighborhood' as const, profiles: neighborhoodProfileData },
    ];

    seededProfilesByMode.forEach(({ modeId, profiles }) => {
      expect(profiles.length).toBeGreaterThanOrEqual(10);
      expect(new Set(profiles.map((profile) => profile.id)).size).toBe(
        profiles.length
      );
      expect(fetchProfileData({ id: modeId })).toBe(profiles);
    });
  });
});

describe('discovery helper async loaders', () => {
  it('resolves seeded profile data asynchronously', async () => {
    const mode: ModeType = { id: 'dating' };

    await expect(fetchProfileDataAsync(mode)).resolves.toBe(datingProfileData);
  });

  it('returns null community data for supported and unsupported modes', () => {
    const supportedModes: ModeType[] = [
      { id: 'friends' },
      { id: 'dating' },
      { id: 'academic' },
      { id: 'professional' },
      { id: 'neighborhood' },
    ];

    supportedModes.forEach((mode) => {
      expect(fetchCommunityData(mode)).toBeNull();
    });

    expect(
      fetchCommunityData({ id: 'unsupported' as ModeType['id'] })
    ).toBeNull();
  });

  it('resolves seeded groups asynchronously', async () => {
    const mode: ModeType = { id: 'friends' };

    await expect(fetchCommunityDataAsync(mode)).resolves.toEqual(
      await fetchGroups('friends')
    );
  });
});
