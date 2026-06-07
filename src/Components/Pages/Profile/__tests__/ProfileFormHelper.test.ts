import {
  baseAddEducationData,
  baseAddJobHistoryData,
  baseDeleteEducationData,
  baseDeleteJobHistoryData,
  baseSaveEducationData,
  baseSaveJobHistoryData,
  getHobbiesOptions,
  getModeHobbyValues,
} from '../ProfileFormHelper';
import { getAcademicBaseFormState } from '../AcademicProfileConfig';
import { getProfessionalBaseFormState } from '../ProfessionalProfileConfig';
import {
  blankAcademicProfile,
  blankProfessionalProfile,
} from '../../../../Utlilities';

/**
 * Build academic form data from the seeded blank profile fixture.
 */
const buildAcademicFormData = () =>
  getAcademicBaseFormState({ useProfile: blankAcademicProfile });

/**
 * Build professional form data from the seeded blank profile fixture.
 */
const buildProfessionalFormData = () =>
  getProfessionalBaseFormState({ useProfile: blankProfessionalProfile });

describe('ProfileFormHelper', () => {
  test('defaults missing academic career sections when hydrating base form state', () => {
    const formData = getAcademicBaseFormState({
      useProfile: {
        ...blankAcademicProfile,
        about: undefined,
        highlights: undefined,
        education: undefined,
        jobHistory: undefined,
        conferences: undefined,
        professionalMemberships: undefined,
      } as unknown as typeof blankAcademicProfile,
    });

    expect(formData.email).toBe('');
    expect(formData.languages).toEqual([]);
    expect(formData.summary).toBe('');
    expect(formData.education).toEqual([]);
    expect(formData.memberships).toEqual([]);
  });

  test('defaults missing professional career sections when hydrating base form state', () => {
    const formData = getProfessionalBaseFormState({
      useProfile: {
        ...blankProfessionalProfile,
        about: undefined,
        highlights: undefined,
        education: undefined,
        jobHistory: undefined,
        conferences: undefined,
        professionalMemberships: undefined,
      } as unknown as typeof blankProfessionalProfile,
    });

    expect(formData.email).toBe('');
    expect(formData.languages).toEqual([]);
    expect(formData.summary).toBe('');
    expect(formData.education).toEqual([]);
    expect(formData.memberships).toEqual([]);
  });

  test('returns curated hobby values for every supported mode', () => {
    expect(getModeHobbyValues('friends')).toContain('board_games');
    expect(getModeHobbyValues('dating')).toContain('traveling');
    expect(getModeHobbyValues('academic')).toContain('reading');
    expect(getModeHobbyValues('professional')).toContain('fitness');
    expect(getModeHobbyValues('neighborhood')).toContain('gardening');
  });

  test('adds education data with filtered fields and the next sequential id', () => {
    const result = baseAddEducationData({
      profileFormData: {
        ...buildAcademicFormData(),
        education: [],
      },
      educationFormData: {
        educationSchool: 'UCLA',
        educationDegree: '',
        educationStartDate: '2020',
        educationEndDate: '',
        id: 999,
      },
      language: 'en',
    });

    expect(result).toEqual([
      {
        id: 1,
        educationSchool: 'UCLA',
        educationStartDate: '2020',
      },
    ]);
  });

  test('saves and deletes education items by id', () => {
    const profileFormData = {
      ...buildAcademicFormData(),
      education: [
        {
          id: 2,
          educationSchool: 'State University',
          educationDegree: 'BS',
        },
      ],
    };

    const addedEducation = baseAddEducationData({
      profileFormData,
      educationFormData: {
        educationSchool: 'MIT',
        educationDegree: 'MS',
        educationStartDate: '2021',
        educationEndDate: '2023',
      },
      language: 'en',
    });

    expect(addedEducation[1]).toMatchObject({
      id: 3,
      educationSchool: 'MIT',
      educationDegree: 'MS',
      educationStartDate: '2021',
      educationEndDate: '2023',
    });

    const savedEducation = baseSaveEducationData({
      profileFormData: {
        ...profileFormData,
        education: addedEducation,
      },
      educationFormData: {
        educationSchool: 'Stanford',
        educationDegree: 'PhD',
      },
      id: 3,
    });

    expect(savedEducation).toEqual(
      expect.arrayContaining([
        {
          id: 3,
          educationSchool: 'Stanford',
          educationDegree: 'PhD',
        },
      ])
    );

    const deletedEducation = baseDeleteEducationData({
      profileFormData: {
        ...profileFormData,
        education: savedEducation,
      },
      id: 2,
    });

    expect(deletedEducation).toEqual([
      {
        id: 3,
        educationSchool: 'Stanford',
        educationDegree: 'PhD',
      },
    ]);
  });

  test('adds, saves, and deletes job history items by id', () => {
    const profileFormData = {
      ...buildProfessionalFormData(),
      jobHistory: [
        {
          id: 4,
          jobHistoryEmployer: 'OpenAI',
          jobHistoryTitle: 'Engineer',
        },
      ],
    };

    const addedJobHistory = baseAddJobHistoryData({
      profileFormData,
      jobHistoryFormData: {
        jobHistoryEmployer: 'Example Corp',
        jobHistoryTitle: 'Lead',
        jobHistoryStartDate: '2022',
        jobHistoryEndDate: '',
      },
      language: 'en',
    });

    expect(addedJobHistory[1]).toMatchObject({
      id: 5,
      jobHistoryEmployer: 'Example Corp',
      jobHistoryTitle: 'Lead',
      jobHistoryStartDate: '2022',
    });

    const savedJobHistory = baseSaveJobHistoryData({
      profileFormData: {
        ...profileFormData,
        jobHistory: addedJobHistory,
      },
      jobHistoryFormData: {
        jobHistoryEmployer: 'Example Corp',
        jobHistoryTitle: 'Director',
        jobHistoryKeyPoints: ['Managed launches'],
      },
      id: 5,
    });

    expect(savedJobHistory).toEqual(
      expect.arrayContaining([
        {
          id: 5,
          jobHistoryEmployer: 'Example Corp',
          jobHistoryTitle: 'Director',
          jobHistoryKeyPoints: ['Managed launches'],
        },
      ])
    );

    const deletedJobHistory = baseDeleteJobHistoryData({
      profileFormData: {
        ...profileFormData,
        jobHistory: savedJobHistory,
      },
      id: 4,
    });

    expect(deletedJobHistory).toEqual([
      {
        id: 5,
        jobHistoryEmployer: 'Example Corp',
        jobHistoryTitle: 'Director',
        jobHistoryKeyPoints: ['Managed launches'],
      },
    ]);
  });

  test('filters base hobby options when allowed values are provided', () => {
    const result = getHobbiesOptions({
      strings: {
        hobbiesOptions: [
          {
            value: 'music',
            label: { en: 'Music', es: 'Musica', de: 'Musik' },
          },
          {
            value: 'reading',
            label: { en: 'Reading', es: 'Lectura', de: 'Lesen' },
          },
        ],
      },
      fullHobbies: ['pottery'],
      language: 'en',
      allowedValues: ['reading'],
    });

    expect(result).toEqual([
      {
        value: 'reading',
        label: 'Reading',
      },
      {
        value: 'pottery',
        label: 'pottery',
      },
    ]);
  });

  test('does not duplicate custom hobbies that already match a curated option', () => {
    const result = getHobbiesOptions({
      strings: {
        hobbiesOptions: [
          {
            value: 'music',
            label: { en: 'Music', es: 'Musica', de: 'Musik' },
          },
          {
            value: 'reading',
            label: { en: 'Reading', es: 'Lectura', de: 'Lesen' },
          },
        ],
      },
      fullHobbies: ['Music', 'reading', 'pottery'],
      language: 'en',
    });

    expect(result).toEqual([
      {
        value: 'music',
        label: 'Music',
      },
      {
        value: 'reading',
        label: 'Reading',
      },
      {
        value: 'pottery',
        label: 'pottery',
      },
    ]);
  });
});
