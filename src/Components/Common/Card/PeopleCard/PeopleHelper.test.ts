import {
  checkShowDemographics,
  checkShowPreferences,
  checkShowHomeLife,
} from './PeopleHelper';

const baseProfile = {
  id: '1',
  pictures: [''],
  name: '',
  main: {
    age: 30,
    location: '',
    seeking: [''],
    pronouns: '',
    gender: '',
    orientation: '',
  },
  hobbies: {},
  demographics: {},
  preferences: {},
  homeLife: {},
  friends: null,
};

describe('checkShowDemographics', () => {
  it('returns true for a profile with demographic data', () => {
    const profile = {
      ...baseProfile,
      demographics: {
        occupation: 'artist',
      },
    };
    const showDemographics = checkShowDemographics(profile);
    expect(showDemographics).toBe(true);
  });
  it('returns false for a profile without demographic data', () => {
    const showDemographics = checkShowDemographics(baseProfile);
    expect(showDemographics).toBe(false);
  });
});

describe('checkShowPreferences', () => {
  it('returns true for a profile with preference data', () => {
    const profile = {
      ...baseProfile,
      preferences: {
        dietary: 'omnivore',
      },
    };
    const showDemographics = checkShowPreferences(profile);
    expect(showDemographics).toBe(true);
  });
  it('returns false for a profile without preference data', () => {
    const showDemographics = checkShowPreferences(baseProfile);
    expect(showDemographics).toBe(false);
  });
});

describe('checkShowHomeLife', () => {
  it('returns true for a profile with preference data', () => {
    const profile = {
      ...baseProfile,
      homeLife: {
        cats: '2',
      },
    };
    const showHomeLife = checkShowHomeLife(profile);
    expect(showHomeLife).toBe(true);
  });
  it('returns false for a profile without preference data', () => {
    const showHomeLife = checkShowHomeLife(baseProfile);
    expect(showHomeLife).toBe(false);
  });
});
