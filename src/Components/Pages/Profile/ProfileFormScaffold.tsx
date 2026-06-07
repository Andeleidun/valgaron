import type {
  ChangeEvent,
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
} from 'react';
import { useTheme } from '@mui/material/styles';
import type {
  CommonStringsType,
  ModeType,
  OptionType,
  ProfilePictureFormStateType,
} from '../../../types';
import { Button, Collapse, Grid, GridItem, SaveStatus } from '../../Common';
import type { SaveStatusState } from '../../Common/SaveStatus';
import {
  baseHandleAutocompleteChange,
  baseHandleCheckboxChange,
  baseHandleInputChange,
  type FormDataRecord,
  type FormElementAutocompleteOptionType,
  type FormElementsStringsType,
  type FormStoreType,
} from '../../Common/FormElements';
import { ProfilePicturesField } from './ProfilePicturesField';

type ProfileSaveLabelKey =
  | 'saveSuccess'
  | 'saveDraftSuccess'
  | 'saveError'
  | 'saveInProgress'
  | 'retry'
  | 'dismiss';

type ProfileFormSaveStatusCopyType = {
  successMessage: string;
  errorMessage: string;
  savingMessage: string;
  retryLabel: string;
  dismissLabel: string;
};

type ProfileFormSectionType = {
  key: string;
  title?: string;
  content: ReactNode;
};

/**
 * Build the resolved save-status copy shared by profile form variants.
 */
export const buildProfileSaveStatusCopy = ({
  getLabel,
  lastSaveWasIncomplete,
  saveErrorMessage,
}: {
  getLabel: (key: ProfileSaveLabelKey) => string;
  lastSaveWasIncomplete: boolean;
  saveErrorMessage: string;
}): ProfileFormSaveStatusCopyType => ({
  successMessage: lastSaveWasIncomplete
    ? getLabel('saveDraftSuccess')
    : getLabel('saveSuccess'),
  errorMessage: saveErrorMessage || getLabel('saveError'),
  savingMessage: getLabel('saveInProgress'),
  retryLabel: getLabel('retry'),
  dismissLabel: getLabel('dismiss'),
});

/**
 * Build the shared change handlers used by simpler profile forms whose edits
 * all write into a single form store.
 */
export const useBasicProfileFormHandlers = <T extends FormDataRecord>({
  language,
  saveStatus,
  setSaveStatus,
  store,
}: {
  language: string;
  saveStatus: SaveStatusState;
  setSaveStatus: Dispatch<SetStateAction<SaveStatusState>>;
  store: FormStoreType<T>;
}) => {
  const resetSaveStatus = (): void => {
    if (saveStatus !== 'idle') {
      setSaveStatus('idle');
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    resetSaveStatus();
    const {
      target: { name },
    } = event;
    if (store.getError(name)) {
      store.clearError(name);
    }
    const updatedValues = baseHandleInputChange(event, store.getValues());
    store.setValues(updatedValues as T);
  };

  const handleCheckboxChange = (
    name: string | string[],
    value: OptionType | string
  ): void => {
    resetSaveStatus();
    if (typeof name === 'string') {
      const updatedValues = baseHandleCheckboxChange(
        name,
        value,
        store.getValues(),
        language
      );
      if (store.getError(name)) {
        store.clearError(name);
      }
      store.setValues(updatedValues as T);
      return;
    }

    const updatedValues = name.reduce(
      (accumulator, currentValue) =>
        baseHandleCheckboxChange(currentValue, value, accumulator, language),
      store.getValues()
    );
    store.setValues(updatedValues as T);
  };

  const handleAutocompleteChange = (
    name: string,
    value:
      | FormElementAutocompleteOptionType
      | FormElementAutocompleteOptionType[],
    multi = false
  ): void => {
    resetSaveStatus();
    if (store.getError(name)) {
      store.clearError(name);
    }
    const updatedValues = baseHandleAutocompleteChange({
      name,
      value,
      language,
      formData: store.getValues(),
      multi,
    });
    store.setValues(updatedValues as T);
  };

  return {
    handleAutocompleteChange,
    handleChange,
    handleCheckboxChange,
    resetSaveStatus,
  };
};

/**
 * Render the shared outer shell for profile forms: save feedback, profile
 * pictures, titled collapses, and the primary submit button.
 */
export const ProfileFormScaffold = <
  T extends FormDataRecord & ProfilePictureFormStateType
>({
  formId,
  language,
  modeId,
  onDismissSaveStatus,
  onMutate,
  onRetry,
  onSubmit,
  picturesFieldId,
  picturesFieldLabel,
  saveStatus,
  saveStatusCopy,
  sections,
  store,
  strings,
  submitLabel,
}: {
  formId: string;
  language: string;
  modeId: ModeType['id'];
  onDismissSaveStatus: () => void;
  onMutate: () => void;
  onRetry: () => void;
  onSubmit: (event: FormEvent<HTMLDivElement>) => void;
  picturesFieldId: string;
  picturesFieldLabel: string;
  saveStatus: SaveStatusState;
  saveStatusCopy: ProfileFormSaveStatusCopyType;
  sections: ReadonlyArray<ProfileFormSectionType>;
  store: FormStoreType<T>;
  strings: FormElementsStringsType & CommonStringsType;
  submitLabel: string;
}): JSX.Element => {
  const theme = useTheme();
  const collapseStyles = {
    background: theme.palette.secondary.surfaceStrong,
  };

  return (
    <Grid component="form" onSubmit={onSubmit} spacing={4} id={formId}>
      <GridItem xs={12}>
        <SaveStatus
          status={saveStatus}
          successMessage={saveStatusCopy.successMessage}
          errorMessage={saveStatusCopy.errorMessage}
          savingMessage={saveStatusCopy.savingMessage}
          labels={{
            retry: saveStatusCopy.retryLabel,
            dismiss: saveStatusCopy.dismissLabel,
          }}
          onRetry={onRetry}
          onDismiss={onDismissSaveStatus}
        />
      </GridItem>
      <GridItem xs={12}>
        <ProfilePicturesField
          store={store}
          fieldLabel={picturesFieldLabel}
          language={language}
          strings={strings}
          id={picturesFieldId}
          onMutate={onMutate}
        />
      </GridItem>
      {sections.map((section) =>
        section.title ? (
          <GridItem xs={12} key={section.key}>
            <Collapse
              className={`profile-info ${modeId}`}
              collapsedSize={0}
              title={section.title}
              buttonProps={{ sx: collapseStyles }}
            >
              <GridItem container xs={12} noPadding>
                {section.content}
              </GridItem>
            </Collapse>
          </GridItem>
        ) : (
          <GridItem container xs={12} key={section.key}>
            {section.content}
          </GridItem>
        )
      )}
      <GridItem xs={12}>
        <Button
          type="submit"
          sx={{
            background: theme.palette.primary.main,
            padding: '5px 40px',
          }}
        >
          {submitLabel}
        </Button>
      </GridItem>
    </Grid>
  );
};
