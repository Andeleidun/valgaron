import {
  act,
  type ChangeEvent,
  type ComponentProps,
  type FormEventHandler,
  type ReactNode,
} from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  FormDataRecord,
  FormElementAutocompleteOptionType,
  FormStoreType,
  RenderFormElementsProps,
} from '../../../Common/FormElements';
import type { ProfileFieldPrivacyLevelType } from '../../../../types';
import AcademicProfileForm from '../AcademicProfileForm';
import ProfessionalProfileForm from '../ProfessionalProfileForm';
import { User, UserContext, fetchTranslations } from '../../../../Utlilities';

type MockSaveStatusProps = {
  errorMessage: string;
  labels: {
    dismiss: string;
    retry: string;
  };
  onDismiss?: () => void;
  onRetry?: () => void;
  savingMessage: string;
  status: 'idle' | 'saving' | 'success' | 'error';
  successMessage: string;
};

type MockProfilePicturesFieldProps = {
  onMutate?: () => void;
};

type MockEducationConfigArgs = {
  addEducationData: () => void;
  clearEducationData: () => void;
  deleteEducationData: (id: number) => void;
  educationFormData: Record<string, unknown>;
  profileFormData: {
    education: Array<Record<string, unknown>>;
  };
  saveEducationData: (id: number) => void;
  setEducationFormData: (item: Record<string, unknown>) => void;
};

type MockJobHistoryConfigArgs = {
  addJobHistoryData: () => void;
  clearJobHistoryData: () => void;
  deleteJobHistoryData: (id: number) => void;
  jobHistoryFormData: Record<string, unknown>;
  profileFormData: {
    jobHistory: Array<Record<string, unknown>>;
  };
  saveJobHistoryData: (id: number) => void;
  setJobHistoryFormData: (item: Record<string, unknown>) => void;
};

const mockAcademicEducationConfigArgs: MockEducationConfigArgs[] = [];
const mockAcademicJobHistoryConfigArgs: MockJobHistoryConfigArgs[] = [];
const mockProfessionalEducationConfigArgs: MockEducationConfigArgs[] = [];
const mockProfessionalJobHistoryConfigArgs: MockJobHistoryConfigArgs[] = [];
const mockLoadModeFieldPrivacy = jest.fn<
  Record<string, ProfileFieldPrivacyLevelType>,
  [string]
>(() => ({}));
const mockPersistModeFieldPrivacy = jest.fn();
const mockProfilePicturesFieldProps: MockProfilePicturesFieldProps[] = [];
const mockRenderFormElementsCalls: RenderFormElementsProps[] = [];
const mockSaveStatusProps: MockSaveStatusProps[] = [];
let mockValidationErrors: Record<string, string | undefined> = {};

const mockAcademicEducationConfigToken: Array<undefined> = [];
const mockAcademicJobHistoryConfigToken: Array<undefined> = [];
const mockProfessionalEducationConfigToken: Array<undefined> = [];
const mockProfessionalJobHistoryConfigToken: Array<undefined> = [];

jest.mock('../../../Common', () => ({
  __esModule: true,
  Button: ({
    children,
    onClick,
    type = 'button',
  }: {
    children: ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
  }) => (
    <button type={type} onClick={onClick}>
      {children}
    </button>
  ),
  Collapse: ({ children, title }: { children: ReactNode; title?: string }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  ),
  Grid: ({
    children,
    component,
    id,
    onSubmit,
  }: {
    children: ReactNode;
    component?: 'form' | 'div';
    id?: string;
    onSubmit?: FormEventHandler<HTMLFormElement | HTMLDivElement>;
  }) => {
    if (component === 'form') {
      return (
        <form id={id} onSubmit={onSubmit as FormEventHandler<HTMLFormElement>}>
          {children}
        </form>
      );
    }

    return (
      <div id={id} onSubmit={onSubmit as FormEventHandler<HTMLDivElement>}>
        {children}
      </div>
    );
  },
  GridItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SaveStatus: (props: MockSaveStatusProps) => {
    mockSaveStatusProps.push(props);

    if (props.status === 'idle') {
      return null;
    }

    return (
      <div data-testid="mock-save-status">
        <span>{props.status}</span>
        <span>
          {props.errorMessage || props.successMessage || props.savingMessage}
        </span>
        {props.onRetry ? (
          <button type="button" onClick={props.onRetry}>
            {props.labels.retry}
          </button>
        ) : null}
        {props.onDismiss ? (
          <button type="button" onClick={props.onDismiss}>
            {props.labels.dismiss}
          </button>
        ) : null}
      </div>
    );
  },
}));

jest.mock('../../../Common/FormElements', () => {
  const actual = jest.requireActual(
    '../../../Common/FormElements'
  ) as typeof import('../../../Common/FormElements');

  return {
    __esModule: true,
    ...actual,
    RenderFormElements: (props: RenderFormElementsProps) => {
      mockRenderFormElementsCalls.push(props);
      return (
        <div
          data-testid={`mock-render-form-elements-${mockRenderFormElementsCalls.length}`}
        />
      );
    },
  };
});

jest.mock('../ProfilePicturesField', () => ({
  __esModule: true,
  ProfilePicturesField: (props: MockProfilePicturesFieldProps) => {
    mockProfilePicturesFieldProps.push(props);
    return (
      <button type="button" onClick={() => props.onMutate?.()}>
        Mutate pictures
      </button>
    );
  },
}));

jest.mock('../ProfileFieldPrivacyStorage', () => ({
  __esModule: true,
  loadModeFieldPrivacy: (modeId: string) => mockLoadModeFieldPrivacy(modeId),
  persistModeFieldPrivacy: (args: {
    fieldName: string;
    level: ProfileFieldPrivacyLevelType;
    modeId: string;
  }) => mockPersistModeFieldPrivacy(args),
}));

jest.mock('../ProfileValidation', () => ({
  __esModule: true,
  hasProfileValidationErrors: (errors: Record<string, string | undefined>) =>
    Object.values(errors).some(Boolean),
  validateProfileFormData: () => mockValidationErrors,
}));

jest.mock('../AcademicProfileConfig', () => ({
  __esModule: true,
  getAcademicBaseFormState: () => ({
    defaultPicture: '',
    education: [],
    jobHistory: [],
    name: '',
    papers: [],
    pictureVisibility: {},
    pictures: [],
    profileVisibility: 'open',
    seeking: [],
    sharedIntentA: [],
    sharedIntentB: [],
  }),
  getAcademicConnectionStyleFormConfig: () => [],
  getAcademicProfileAboutFormConfig: () => [],
  getAcademicProfileConferencesFormConfig: () => [],
  getAcademicProfileEducationFormConfig: (args: MockEducationConfigArgs) => {
    mockAcademicEducationConfigArgs.push(args);
    return mockAcademicEducationConfigToken;
  },
  getAcademicProfileHighlightsFormConfig: () => [],
  getAcademicProfileJobHistoryFormConfig: (args: MockJobHistoryConfigArgs) => {
    mockAcademicJobHistoryConfigArgs.push(args);
    return mockAcademicJobHistoryConfigToken;
  },
  getAcademicProfileMainFormConfig: () => [],
  getAcademicProfileSubmission: ({
    profileFormData,
  }: {
    profileFormData: Record<string, unknown>;
  }) => profileFormData,
}));

jest.mock('../ProfessionalProfileConfig', () => ({
  __esModule: true,
  getProfessionalBaseFormState: () => ({
    defaultPicture: '',
    education: [],
    jobHistory: [],
    name: '',
    papers: [],
    pictureVisibility: {},
    pictures: [],
    profileVisibility: 'open',
    seeking: [],
    sharedIntentA: [],
    sharedIntentB: [],
  }),
  getProfessionalConnectionStyleFormConfig: () => [],
  getProfessionalProfileAboutFormConfig: () => [],
  getProfessionalProfileEducationFormConfig: (
    args: MockEducationConfigArgs
  ) => {
    mockProfessionalEducationConfigArgs.push(args);
    return mockProfessionalEducationConfigToken;
  },
  getProfessionalProfileHighlightsFormConfig: () => [],
  getProfessionalProfileJobHistoryFormConfig: (
    args: MockJobHistoryConfigArgs
  ) => {
    mockProfessionalJobHistoryConfigArgs.push(args);
    return mockProfessionalJobHistoryConfigToken;
  },
  getProfessionalProfileMainFormConfig: () => [],
  getProfessionalProfileSubmission: ({
    profileFormData,
  }: {
    profileFormData: Record<string, unknown>;
  }) => profileFormData,
}));

jest.mock('@mui/material/styles', () => ({
  __esModule: true,
  useTheme: () => ({
    palette: {
      primary: {
        main: '#222222',
      },
      secondary: {
        surfaceStrong: '#f4f4f4',
      },
      text: {
        primary: '#111111',
      },
    },
  }),
}));

const translations = fetchTranslations();

type CareerModeCase = {
  educationConfigArgs: MockEducationConfigArgs[];
  educationConfigToken: Array<undefined>;
  FormComponent: typeof AcademicProfileForm | typeof ProfessionalProfileForm;
  formId: string;
  jobHistoryConfigArgs: MockJobHistoryConfigArgs[];
  jobHistoryConfigToken: Array<undefined>;
  modeId: 'academic' | 'professional';
  profileKey: 'academic' | 'professional';
  strings:
    | ComponentProps<typeof AcademicProfileForm>['strings']
    | ComponentProps<typeof ProfessionalProfileForm>['strings'];
};

const careerModes: CareerModeCase[] = [
  {
    educationConfigArgs: mockAcademicEducationConfigArgs,
    educationConfigToken: mockAcademicEducationConfigToken,
    FormComponent: AcademicProfileForm,
    formId: 'academic-profile-form',
    jobHistoryConfigArgs: mockAcademicJobHistoryConfigArgs,
    jobHistoryConfigToken: mockAcademicJobHistoryConfigToken,
    modeId: 'academic',
    profileKey: 'academic',
    strings: {
      ...translations.profile.common,
      ...translations.profile.academic,
      connectionStyle: translations.connectionStyle.academic,
      connectionStyleCommon: translations.connectionStyle.common,
      ...translations.common,
    } as unknown as ComponentProps<typeof AcademicProfileForm>['strings'],
  },
  {
    educationConfigArgs: mockProfessionalEducationConfigArgs,
    educationConfigToken: mockProfessionalEducationConfigToken,
    FormComponent: ProfessionalProfileForm,
    formId: 'professional-profile-form',
    jobHistoryConfigArgs: mockProfessionalJobHistoryConfigArgs,
    jobHistoryConfigToken: mockProfessionalJobHistoryConfigToken,
    modeId: 'professional',
    profileKey: 'professional',
    strings: {
      ...translations.profile.common,
      ...translations.profile.professional,
      connectionStyle: translations.connectionStyle.professional,
      connectionStyleCommon: translations.connectionStyle.common,
      ...translations.common,
    } as unknown as ComponentProps<typeof ProfessionalProfileForm>['strings'],
  },
];

const clearCaptures = () => {
  mockAcademicEducationConfigArgs.length = 0;
  mockAcademicJobHistoryConfigArgs.length = 0;
  mockProfessionalEducationConfigArgs.length = 0;
  mockProfessionalJobHistoryConfigArgs.length = 0;
  mockProfilePicturesFieldProps.length = 0;
  mockRenderFormElementsCalls.length = 0;
  mockSaveStatusProps.length = 0;
  mockValidationErrors = {};
  mockLoadModeFieldPrivacy.mockClear();
  mockPersistModeFieldPrivacy.mockClear();
};

const renderCareerModeForm = ({
  FormComponent,
  modeId,
  profileKey,
  setUserProfile = jest.fn(),
  strings,
}: Pick<
  CareerModeCase,
  'FormComponent' | 'modeId' | 'profileKey' | 'strings'
> & {
  setUserProfile?: jest.Mock;
}) => {
  const user = new User();
  void profileKey;

  render(
    <UserContext.Provider
      value={{
        user,
        setUserGroupMemberships: jest.fn(),
        setUserProfile,
        setUserSettings: jest.fn(),
      }}
    >
      <FormComponent
        language="en"
        mode={{ id: modeId }}
        strings={strings as never}
      />
    </UserContext.Provider>
  );

  return { setUserProfile };
};

const getLatestItem = <T,>(items: T[]): T => {
  const item = items.at(-1);
  expect(item).toBeDefined();
  return item as T;
};

const getRenderPropsForConfig = (
  config: Array<undefined>
): RenderFormElementsProps => {
  const renderProps = mockRenderFormElementsCalls.find(
    (call) => call.config === config
  );
  expect(renderProps).toBeDefined();
  return renderProps as RenderFormElementsProps;
};

describe('Academic and professional profile form wrapper behavior', () => {
  beforeEach(() => {
    clearCaptures();
  });

  test.each(careerModes)(
    '$modeId mode manages history sections, repeating lists, and privacy state',
    async ({
      educationConfigArgs,
      educationConfigToken,
      FormComponent,
      formId,
      jobHistoryConfigArgs,
      jobHistoryConfigToken,
      modeId,
      profileKey,
      strings,
    }) => {
      mockValidationErrors = {
        name: 'Name is required.',
        seeking: 'Add at least one seeking intent.',
      };

      renderCareerModeForm({
        FormComponent,
        modeId,
        profileKey,
        strings,
      });

      const form = document.getElementById(formId) as HTMLFormElement | null;
      expect(form).not.toBeNull();
      fireEvent.submit(form as HTMLFormElement);

      const mainRenderProps = mockRenderFormElementsCalls[0];
      const mainStore = mainRenderProps.store as
        | FormStoreType<FormDataRecord>
        | undefined;
      expect(mainStore?.getError('name')).toBe('Name is required.');
      expect(mainStore?.getError('seeking')).toBe(
        'Add at least one seeking intent.'
      );

      await act(async () => {
        mainRenderProps.handleChange({
          target: { name: 'name', value: 'Dr. Ada' },
        } as ChangeEvent<HTMLInputElement>);

        mainRenderProps.handleAutocompleteChange(
          'seeking',
          {
            label: 'Research collaborators',
            value: 'research_collaborators',
          } satisfies FormElementAutocompleteOptionType,
          true
        );

        mainRenderProps.handleCheckboxChange('sharedIntentA', 'Mentorship');
        mainRenderProps.handleCheckboxChange(
          ['sharedIntentA', 'sharedIntentB'],
          'Mutual aid',
          mainStore?.getValues() as never
        );
        mainRenderProps.handleRepeatingListChange?.('papers', ['Paper 1']);
        mainRenderProps.handleFieldPrivacyChange?.('name', 'connections_only');
      });

      expect(mainStore?.getValues()).toMatchObject({
        name: 'Dr. Ada',
        papers: ['Paper 1'],
        seeking: [
          {
            label: 'Research collaborators',
            value: 'research_collaborators',
          },
        ],
        sharedIntentA: ['Mentorship', 'Mutual aid'],
        sharedIntentB: ['Mutual aid'],
      });
      expect(mainStore?.getFieldSnapshot('name').privacyLevel).toBe(
        'connections_only'
      );
      expect(mockPersistModeFieldPrivacy).toHaveBeenCalledWith({
        fieldName: 'name',
        level: 'connections_only',
        modeId,
      });

      const educationRenderProps =
        getRenderPropsForConfig(educationConfigToken);
      const educationStore = educationRenderProps.store as
        | FormStoreType<FormDataRecord>
        | undefined;
      const latestEducationArgs = () => getLatestItem(educationConfigArgs);

      await act(async () => {
        educationRenderProps.handleChange({
          target: { name: 'educationSchool', value: 'Community University' },
        } as ChangeEvent<HTMLInputElement>);
        educationRenderProps.handleChange({
          target: { name: 'educationDegree', value: 'MS' },
        } as ChangeEvent<HTMLInputElement>);
        latestEducationArgs().addEducationData();
      });

      await waitFor(() => {
        expect(latestEducationArgs().profileFormData.education).toHaveLength(1);
      });

      const addedEducation = latestEducationArgs().profileFormData.education[0];
      await act(async () => {
        latestEducationArgs().setEducationFormData(addedEducation);
        latestEducationArgs().setEducationFormData(addedEducation);
        educationRenderProps.handleChange({
          target: { name: 'educationSchool', value: 'Updated University' },
        } as ChangeEvent<HTMLInputElement>);
        latestEducationArgs().saveEducationData(addedEducation.id as number);
      });

      await waitFor(() => {
        expect(
          getLatestItem(educationConfigArgs).profileFormData.education[0]
            ?.educationSchool
        ).toBe('Updated University');
      });

      await act(async () => {
        latestEducationArgs().deleteEducationData(addedEducation.id as number);
      });

      await waitFor(() => {
        expect(
          getLatestItem(educationConfigArgs).profileFormData.education
        ).toHaveLength(0);
      });

      await act(async () => {
        educationRenderProps.handleChange({
          target: { name: 'educationSchool', value: 'Temporary School' },
        } as ChangeEvent<HTMLInputElement>);
        latestEducationArgs().clearEducationData();
      });

      await waitFor(() => {
        expect(educationStore?.getValues()).toMatchObject({
          educationSchool: '',
        });
      });

      const jobHistoryRenderProps = getRenderPropsForConfig(
        jobHistoryConfigToken
      );
      const jobHistoryStore = jobHistoryRenderProps.store as
        | FormStoreType<FormDataRecord>
        | undefined;
      const latestJobHistoryArgs = () => getLatestItem(jobHistoryConfigArgs);

      await act(async () => {
        jobHistoryRenderProps.handleChange({
          target: { name: 'jobHistoryEmployer', value: 'Practical Labs' },
        } as ChangeEvent<HTMLInputElement>);
        jobHistoryRenderProps.handleChange({
          target: { name: 'jobHistoryTitle', value: 'Lead Researcher' },
        } as ChangeEvent<HTMLInputElement>);
        latestJobHistoryArgs().addJobHistoryData();
      });

      await waitFor(() => {
        expect(latestJobHistoryArgs().profileFormData.jobHistory).toHaveLength(
          1
        );
      });

      const addedJobHistory =
        latestJobHistoryArgs().profileFormData.jobHistory[0];
      await act(async () => {
        latestJobHistoryArgs().setJobHistoryFormData(addedJobHistory);
        latestJobHistoryArgs().setJobHistoryFormData(addedJobHistory);
        jobHistoryRenderProps.handleChange({
          target: { name: 'jobHistoryEmployer', value: 'Updated Labs' },
        } as ChangeEvent<HTMLInputElement>);
        jobHistoryRenderProps.handleAutocompleteChange(
          'jobHistorySkills',
          {
            label: 'Leadership',
            value: 'leadership',
          } satisfies FormElementAutocompleteOptionType,
          true
        );
        latestJobHistoryArgs().saveJobHistoryData(addedJobHistory.id as number);
      });

      await waitFor(() => {
        expect(
          getLatestItem(jobHistoryConfigArgs).profileFormData.jobHistory[0]
            ?.jobHistoryEmployer
        ).toBe('Updated Labs');
      });

      await act(async () => {
        latestJobHistoryArgs().deleteJobHistoryData(
          addedJobHistory.id as number
        );
      });

      await waitFor(() => {
        expect(
          getLatestItem(jobHistoryConfigArgs).profileFormData.jobHistory
        ).toHaveLength(0);
      });

      await act(async () => {
        jobHistoryRenderProps.handleChange({
          target: { name: 'jobHistoryEmployer', value: 'Temporary Employer' },
        } as ChangeEvent<HTMLInputElement>);
        latestJobHistoryArgs().clearJobHistoryData();
      });

      await waitFor(() => {
        expect(jobHistoryStore?.getValues()).toMatchObject({
          jobHistoryEmployer: '',
        });
      });
    }
  );

  test.each(careerModes)(
    '$modeId mode retries, dismisses, and clears save status after picture mutation',
    async ({ FormComponent, formId, modeId, profileKey, strings }) => {
      const setUserProfile = jest.fn(() => {
        throw new Error('save failed');
      });

      renderCareerModeForm({
        FormComponent,
        modeId,
        profileKey,
        setUserProfile,
        strings,
      });

      const form = document.getElementById(formId) as HTMLFormElement | null;
      expect(form).not.toBeNull();

      fireEvent.submit(form as HTMLFormElement);

      await waitFor(() => {
        expect(screen.getByTestId('mock-save-status')).toHaveTextContent(
          'error'
        );
      });
      expect(setUserProfile).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

      await waitFor(() => {
        expect(setUserProfile).toHaveBeenCalledTimes(2);
      });

      fireEvent.click(screen.getByRole('button', { name: 'Mutate pictures' }));

      await waitFor(() => {
        expect(screen.queryByTestId('mock-save-status')).toBeNull();
      });

      fireEvent.submit(form as HTMLFormElement);

      await waitFor(() => {
        expect(screen.getByTestId('mock-save-status')).toHaveTextContent(
          'error'
        );
      });

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      await waitFor(() => {
        expect(screen.queryByTestId('mock-save-status')).toBeNull();
      });
      expect(setUserProfile).toHaveBeenCalledTimes(3);
    }
  );
});
