import { useEffect, useState } from 'react';
import {
  Button,
  Grid,
  GridItem,
  ImageUploader,
  Select,
  Text,
} from '../../Common';
import {
  type FormDataRecord,
  getProfilePrivacyOptions,
  type FormStoreType,
  useFormFieldSnapshot,
} from '../../Common/FormElements';
import type { FormElementsStringsType } from '../../Common/FormElements/FormElements';
import type {
  CommonStringsType,
  ProfileFieldPrivacyLevelType,
  ProfilePictureFormStateType,
} from '../../../types';
import {
  getDefaultProfilePicture,
  isProfileFieldPrivacyLevel,
  reconcileProfilePrivacySettings,
  renderValue,
} from '../../../Utlilities';

type ProfilePicturesFieldProps<
  T extends FormDataRecord & ProfilePictureFormStateType
> = {
  fieldLabel: string;
  id: string;
  language: string;
  onMutate?: () => void;
  store: FormStoreType<T>;
  strings: FormElementsStringsType & CommonStringsType;
};

/**
 * Build a privacy label from the shared visibility label and local field label.
 */
const getVisibilityLabel = ({
  fieldLabel,
  fallbackLabel,
  language,
  strings,
}: {
  fieldLabel?: string;
  fallbackLabel?: string;
  language: string;
  strings: FormElementsStringsType & CommonStringsType;
}): string => {
  const visibilityLabel = renderValue(
    language,
    strings.privacyVisibility
  ).trim();
  const resolvedFieldLabel = (fieldLabel ?? fallbackLabel ?? '').trim();

  if (!resolvedFieldLabel) {
    return visibilityLabel;
  }

  if (!visibilityLabel) {
    return resolvedFieldLabel;
  }

  return `${visibilityLabel}: ${resolvedFieldLabel}`;
};

/**
 * Render the profile picture uploader with carousel-style picture controls and
 * store-backed metadata.
 */
export const ProfilePicturesField = <
  T extends FormDataRecord & ProfilePictureFormStateType
>({
  fieldLabel,
  id,
  language,
  onMutate,
  store,
  strings,
}: ProfilePicturesFieldProps<T>): JSX.Element => {
  const picturesField = useFormFieldSnapshot(store, 'pictures');
  const profileVisibilityField = useFormFieldSnapshot(
    store,
    'profileVisibility'
  );
  const defaultPictureField = useFormFieldSnapshot(store, 'defaultPicture');
  const pictureVisibilityField = useFormFieldSnapshot(
    store,
    'pictureVisibility'
  );
  const pictureValues = Array.isArray(picturesField.value)
    ? (picturesField.value as string[])
    : [];
  const resolvedProfileVisibility = isProfileFieldPrivacyLevel(
    profileVisibilityField.value
  )
    ? profileVisibilityField.value
    : 'open';
  const resolvedDefaultPicture =
    typeof defaultPictureField.value === 'string'
      ? defaultPictureField.value
      : '';
  const resolvedPictureVisibility =
    pictureVisibilityField.value &&
    typeof pictureVisibilityField.value === 'object' &&
    !Array.isArray(pictureVisibilityField.value)
      ? (pictureVisibilityField.value as T['pictureVisibility'])
      : ({} as T['pictureVisibility']);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((currentValue) =>
      pictureValues.length === 0
        ? 0
        : Math.min(currentValue, pictureValues.length - 1)
    );
  }, [pictureValues.length]);

  const activePicture = pictureValues[activeIndex] ?? null;
  const activePictureIsDefault =
    Boolean(activePicture) &&
    activePicture ===
      getDefaultProfilePicture({
        pictures: pictureValues,
        defaultPicture: resolvedDefaultPicture,
      });

  /**
   * Persist a normalized picture state update back into the shared form store.
   */
  const updatePictureState = ({
    pictures,
    defaultPicture,
    pictureVisibility,
    profileVisibility,
  }: {
    pictures: string[];
    defaultPicture?: string;
    pictureVisibility?: T['pictureVisibility'];
    profileVisibility?: ProfileFieldPrivacyLevelType;
  }): void => {
    onMutate?.();
    const nextState = reconcileProfilePrivacySettings({
      pictures,
      defaultPicture,
      pictureVisibility,
      profileVisibility,
    });
    store.setValues(
      (currentValue) =>
        ({
          ...currentValue,
          pictures: nextState.pictures as T['pictures'],
          profileVisibility:
            nextState.profileVisibility as T['profileVisibility'],
          defaultPicture: nextState.defaultPicture as T['defaultPicture'],
          pictureVisibility:
            nextState.pictureVisibility as T['pictureVisibility'],
        } as T)
    );
  };

  /**
   * Update picture previews in form state and clear stale validation errors.
   */
  const handlePicturesChange = (pictures: string[]) => {
    if (store.getError('pictures')) {
      store.clearError('pictures');
    }
    updatePictureState({
      pictures,
      defaultPicture: resolvedDefaultPicture,
      pictureVisibility: resolvedPictureVisibility,
      profileVisibility: resolvedProfileVisibility,
    });
  };

  /**
   * Cycle backward through uploaded pictures.
   */
  const showPreviousPicture = (): void => {
    if (pictureValues.length <= 1) {
      return;
    }
    setActiveIndex(
      (currentValue) =>
        (currentValue - 1 + pictureValues.length) % pictureValues.length
    );
  };

  /**
   * Cycle forward through uploaded pictures.
   */
  const showNextPicture = (): void => {
    if (pictureValues.length <= 1) {
      return;
    }
    setActiveIndex((currentValue) => (currentValue + 1) % pictureValues.length);
  };

  return (
    <Grid spacing={2} data-testid="profile-pictures-field">
      <GridItem xs={12}>
        <Select
          id="profile-visibility-select"
          name="profileVisibility"
          language={language}
          label={getVisibilityLabel({
            fieldLabel: renderValue(language, strings.profileLabel),
            fallbackLabel: renderValue(language, strings.profileLabel),
            language,
            strings,
          })}
          value={resolvedProfileVisibility}
          options={getProfilePrivacyOptions(strings)}
          onChange={(event) =>
            updatePictureState({
              pictures: pictureValues,
              defaultPicture: resolvedDefaultPicture,
              pictureVisibility: resolvedPictureVisibility,
              profileVisibility: event.target
                .value as ProfileFieldPrivacyLevelType,
            })
          }
        />
      </GridItem>
      <GridItem xs={12}>
        <ImageUploader
          value={pictureValues}
          onChange={handlePicturesChange}
          label={fieldLabel}
          id={id}
          errorMessage={picturesField.error}
          strings={{
            invalidFileTypeMessage: renderValue(
              language,
              strings.imageFileTypeError
            ),
            fileSizeLimitTemplate: renderValue(
              language,
              strings.imageFileSizeLimitTemplate
            ),
            previewAltTemplate: renderValue(
              language,
              strings.uploadedPreviewTemplate
            ),
            removeLabel: renderValue(language, strings.delete),
          }}
          previewRenderer={({ removeImage }) =>
            activePicture ? (
              <Grid spacing={2}>
                {pictureValues.length > 1 ? (
                  <GridItem xs={12}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Button type="button" onClick={showPreviousPicture}>
                        {renderValue(language, strings.showPreviousImage)}
                      </Button>
                      <Button type="button" onClick={showNextPicture}>
                        {renderValue(language, strings.showNextImage)}
                      </Button>
                    </div>
                  </GridItem>
                ) : null}
                <GridItem xs={12}>
                  <img
                    src={activePicture}
                    alt={fieldLabel}
                    style={{
                      width: '100%',
                      maxHeight: '320px',
                      objectFit: 'cover',
                      borderRadius: 12,
                    }}
                  />
                </GridItem>
                <GridItem xs={12}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    {activePictureIsDefault ? (
                      <Text variant="caption">
                        {renderValue(language, strings.defaultProfilePicture)}
                      </Text>
                    ) : (
                      <Button
                        type="button"
                        onClick={() =>
                          updatePictureState({
                            pictures: pictureValues,
                            defaultPicture: activePicture,
                            pictureVisibility: resolvedPictureVisibility,
                            profileVisibility: resolvedProfileVisibility,
                          })
                        }
                      >
                        {renderValue(
                          language,
                          strings.setDefaultProfilePicture
                        )}
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={() =>
                        removeImage(
                          pictureValues.findIndex(
                            (picture) => picture === activePicture
                          )
                        )
                      }
                    >
                      {renderValue(language, strings.delete)}
                    </Button>
                  </div>
                </GridItem>
                <GridItem xs={12}>
                  {activePictureIsDefault ? (
                    <Text variant="caption">
                      {renderValue(
                        language,
                        strings.defaultProfilePictureVisibilityHelper
                      )}
                    </Text>
                  ) : (
                    <Select
                      id="current-picture-visibility-select"
                      name="currentPictureVisibility"
                      language={language}
                      label={getVisibilityLabel({
                        fieldLabel,
                        language,
                        strings,
                      })}
                      value={resolvedPictureVisibility[activePicture] ?? 'open'}
                      options={getProfilePrivacyOptions(strings)}
                      onChange={(event) =>
                        updatePictureState({
                          pictures: pictureValues,
                          defaultPicture: resolvedDefaultPicture,
                          pictureVisibility: {
                            ...resolvedPictureVisibility,
                            [activePicture]: event.target
                              .value as ProfileFieldPrivacyLevelType,
                          } as T['pictureVisibility'],
                          profileVisibility: resolvedProfileVisibility,
                        })
                      }
                    />
                  )}
                </GridItem>
              </Grid>
            ) : null
          }
        />
      </GridItem>
    </Grid>
  );
};
