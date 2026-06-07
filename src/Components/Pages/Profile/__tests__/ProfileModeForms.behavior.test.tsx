import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  FormDataRecord,
  FormElementAutocompleteOptionType,
  FormStoreType,
  RenderFormElementsProps,
} from '../../../Common/FormElements';
import type { ProfileFieldPrivacyLevelType } from '../../../../types';
import type {
  ChangeEvent,
  ComponentProps,
  FormEventHandler,
  ReactNode,
} from 'react';
import DatingProfileForm from '../DatingProfileForm';
import FriendsProfileForm from '../FriendsProfileForm';
import NeighborhoodProfileForm from '../NeighborhoodProfileForm';
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

const mockLoadModeFieldPrivacy = jest.fn<
  Record<string, ProfileFieldPrivacyLevelType>,
  [string]
>(() => ({}));
const mockPersistModeFieldPrivacy = jest.fn();
const mockProfilePicturesFieldProps: MockProfilePicturesFieldProps[] = [];
const mockRenderFormElementsCalls: RenderFormElementsProps[] = [];
const mockSaveStatusProps: MockSaveStatusProps[] = [];
let mockValidationErrors: Record<string, string | undefined> = {};

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

jest.mock('../ProfileFormHelper', () => ({
  __esModule: true,
  getHobbiesOptions: () => [],
  getModeHobbyValues: () => [],
}));

jest.mock('../DatingProfileConfig', () => ({
  __esModule: true,
  getDatingBaseFormState: () => ({
    defaultPicture: '',
    name: '',
    pictureVisibility: {},
    pictures: [],
    profileVisibility: 'open',
    seeking: [],
    sharedIntentA: [],
    sharedIntentB: [],
  }),
  getDatingConnectionStyleFormConfig: () => [],
  getDatingProfileAboutFormConfig: () => [],
  getDatingProfileHobbiesFormConfig: () => [],
  getDatingProfileHomeLifeFormConfig: () => [],
  getDatingProfileMainFormConfig: () => [],
  getDatingProfilePreferencesFormConfig: () => [],
  getDatingProfilePromptsFormConfig: () => [],
  getDatingProfileSubmission: ({
    profileFormData,
  }: {
    profileFormData: Record<string, unknown>;
  }) => profileFormData,
}));

jest.mock('../FriendsProfileConfig', () => ({
  __esModule: true,
  getFriendsBaseFormState: () => ({
    defaultPicture: '',
    name: '',
    pictureVisibility: {},
    pictures: [],
    profileVisibility: 'open',
    seeking: [],
    sharedIntentA: [],
    sharedIntentB: [],
  }),
  getFriendsConnectionStyleFormConfig: () => [],
  getFriendsProfileAboutFormConfig: () => [],
  getFriendsProfileHobbiesFormConfig: () => [],
  getFriendsProfileHomeLifeFormConfig: () => [],
  getFriendsProfileMainFormConfig: () => [],
  getFriendsProfilePreferencesFormConfig: () => [],
  getFriendsProfilePromptsFormConfig: () => [],
  getFriendsProfileSubmission: ({
    profileFormData,
  }: {
    profileFormData: Record<string, unknown>;
  }) => profileFormData,
}));

jest.mock('../NeighborhoodProfileConfig', () => ({
  __esModule: true,
  getNeighborhoodBaseFormState: () => ({
    defaultPicture: '',
    name: '',
    pictureVisibility: {},
    pictures: [],
    profileVisibility: 'open',
    seeking: [],
    sharedIntentA: [],
    sharedIntentB: [],
  }),
  getNeighborhoodConnectionStyleFormConfig: () => [],
  getNeighborhoodProfileAboutFormConfig: () => [],
  getNeighborhoodProfileHobbiesFormConfig: () => [],
  getNeighborhoodProfileHomeLifeFormConfig: () => [],
  getNeighborhoodProfileMainFormConfig: () => [],
  getNeighborhoodProfilePreferencesFormConfig: () => [],
  getNeighborhoodProfileSubmission: ({
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

type SimpleModeCase = {
  FormComponent:
    | typeof DatingProfileForm
    | typeof FriendsProfileForm
    | typeof NeighborhoodProfileForm;
  formId: string;
  modeId: 'dating' | 'friends' | 'neighborhood';
  profileKey: 'dating' | 'friends' | 'neighborhood';
  strings:
    | ComponentProps<typeof DatingProfileForm>['strings']
    | ComponentProps<typeof FriendsProfileForm>['strings']
    | ComponentProps<typeof NeighborhoodProfileForm>['strings'];
};

const simpleModes: SimpleModeCase[] = [
  {
    FormComponent: DatingProfileForm,
    formId: 'dating-profile-form',
    modeId: 'dating',
    profileKey: 'dating',
    strings: {
      ...translations.profile.common,
      ...translations.profile.dating,
      connectionStyle: translations.connectionStyle.dating,
      connectionStyleCommon: translations.connectionStyle.common,
      ...translations.common,
    } as unknown as ComponentProps<typeof DatingProfileForm>['strings'],
  },
  {
    FormComponent: FriendsProfileForm,
    formId: 'friends-profile-form',
    modeId: 'friends',
    profileKey: 'friends',
    strings: {
      ...translations.profile.common,
      ...translations.profile.friends,
      connectionStyle: translations.connectionStyle.friends,
      connectionStyleCommon: translations.connectionStyle.common,
      ...translations.common,
    } as unknown as ComponentProps<typeof FriendsProfileForm>['strings'],
  },
  {
    FormComponent: NeighborhoodProfileForm,
    formId: 'neighborhood-profile-form',
    modeId: 'neighborhood',
    profileKey: 'neighborhood',
    strings: {
      ...translations.profile.common,
      ...translations.profile.neighborhood,
      connectionStyle: translations.connectionStyle.neighborhood,
      connectionStyleCommon: translations.connectionStyle.common,
      ...translations.common,
    } as unknown as ComponentProps<typeof NeighborhoodProfileForm>['strings'],
  },
];

const clearCaptures = () => {
  mockProfilePicturesFieldProps.length = 0;
  mockRenderFormElementsCalls.length = 0;
  mockSaveStatusProps.length = 0;
  mockValidationErrors = {};
  mockLoadModeFieldPrivacy.mockClear();
  mockPersistModeFieldPrivacy.mockClear();
};

const renderSimpleModeForm = ({
  FormComponent,
  modeId,
  profileKey,
  strings,
  setUserProfile = jest.fn(),
}: SimpleModeCase & {
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

  return {
    getRenderProps: () => {
      const props = mockRenderFormElementsCalls[0];
      expect(props).toBeDefined();
      return props;
    },
    setUserProfile,
  };
};

describe('Simple profile form wrapper behavior', () => {
  beforeEach(() => {
    clearCaptures();
  });

  test.each(simpleModes)(
    '$modeId mode clears field errors, updates shared stores, and persists field privacy',
    async ({ FormComponent, formId, modeId, profileKey, strings }) => {
      mockValidationErrors = {
        name: 'Name is required.',
        seeking: 'Add at least one seeking intent.',
      };

      const { getRenderProps } = renderSimpleModeForm({
        FormComponent,
        formId,
        modeId,
        profileKey,
        strings,
      });

      const form = document.getElementById(formId) as HTMLFormElement | null;
      expect(form).not.toBeNull();

      fireEvent.submit(form as HTMLFormElement);

      const renderProps = getRenderProps();
      const store = renderProps.store as
        | FormStoreType<FormDataRecord>
        | undefined;
      expect(store?.getError('name')).toBe('Name is required.');
      expect(store?.getError('seeking')).toBe(
        'Add at least one seeking intent.'
      );

      renderProps.handleChange({
        target: { name: 'name', value: 'Taylor' },
      } as ChangeEvent<HTMLInputElement>);

      expect(store?.getError('name')).toBeUndefined();
      expect(store?.getValues()).toMatchObject({ name: 'Taylor' });

      renderProps.handleAutocompleteChange(
        'seeking',
        {
          label: 'Long-term relationship',
          value: 'long_term_relationship',
        } satisfies FormElementAutocompleteOptionType,
        true
      );

      expect(store?.getError('seeking')).toBeUndefined();
      expect(store?.getValues()).toMatchObject({
        seeking: [
          {
            label: 'Long-term relationship',
            value: 'long_term_relationship',
          },
        ],
      });

      renderProps.handleCheckboxChange('sharedIntentA', 'Mentorship');
      renderProps.handleCheckboxChange(
        ['sharedIntentA', 'sharedIntentB'],
        'Mutual aid'
      );

      expect(store?.getValues()).toMatchObject({
        sharedIntentA: ['Mentorship', 'Mutual aid'],
        sharedIntentB: ['Mutual aid'],
      });

      renderProps.handleFieldPrivacyChange?.('name', 'connections_only');

      expect(store?.getFieldSnapshot('name').privacyLevel).toBe(
        'connections_only'
      );
      expect(mockPersistModeFieldPrivacy).toHaveBeenCalledWith({
        fieldName: 'name',
        level: 'connections_only',
        modeId,
      });
    }
  );

  test.each(simpleModes)(
    '$modeId mode retries, dismisses, and clears save status after picture mutation',
    async ({ FormComponent, formId, modeId, profileKey, strings }) => {
      const setUserProfile = jest.fn(() => {
        throw new Error('save failed');
      });

      renderSimpleModeForm({
        FormComponent,
        formId,
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
      expect(screen.getByTestId('mock-save-status')).toHaveTextContent('error');

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
