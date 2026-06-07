import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  ConnectionStyleStringsType,
  ProfileType,
  ModeType,
  CommonStringsType,
  ProfileStringsType,
  ProfileFieldPrivacyLevelType,
  InteractionGateType,
} from '../../../../types';
import {
  ImageView,
  Button,
  Grid,
  GridItem,
  Box,
  Collapse,
  Card,
  CardMedia,
  CardContent,
  CardHeader,
  CardActions,
  Text,
} from '../../..';
import type { ImageViewImage } from '../../..';
import { RenderFormElements } from '../../FormElements';
import InteractionGateNotice from '../../InteractionGateNotice';
import {
  evaluateConnectionRequestGate,
  evaluateFieldVisibilityGate,
  evaluateIntroMessageGate,
  fetchTranslations,
  getDefaultProfilePicture,
  getOrderedProfilePictures,
  isProfileFieldPrivacyLevel,
  renderValue,
  reconcileProfilePrivacySettings,
  resolveProfileFieldPrivacyLevel,
  resolveGateActor,
  UserContext,
} from '../../../../Utlilities';
import { loadModeFieldPrivacy } from '../../../Pages/Profile/ProfileFieldPrivacyStorage';
import { buildReadonlyProfileSections } from '../../../Pages/Profile/ProfileReadonlySections';
import './PeopleCard.css';

type PeopleCardProps = {
  profile: ProfileType;
  mode: ModeType;
  like: () => void;
  message: () => void;
  language: string;
  strings: {
    profile: ProfileStringsType;
    common: CommonStringsType;
    connectionStyle?: ConnectionStyleStringsType;
  };
  discoveryMode?: boolean;
  isConnection?: boolean;
  likeActive?: boolean;
  messageActive?: boolean;
  guidance?: {
    whyShownTitle?: string;
    whyShownReasons?: string[];
    recommendedActionTitle?: string;
    recommendedActionLabel?: string;
    hintMessages?: string[];
    compatibilityBadges?: string[];
  };
  interactionGate?: InteractionGateType;
  secondaryActions?: ReactNode;
  secondaryDetails?: ReactNode;
};

const DEFAULT_CONNECTION_STYLE_STRINGS = fetchTranslations().connectionStyle;

/**
 * Replace `{{token}}` placeholders in shared UI templates.
 */
const formatCommonTemplate = (
  template: string,
  replacements: Record<string, number | string>
): string =>
  Object.entries(replacements).reduce(
    (currentValue, [key, replacement]) =>
      currentValue.replaceAll(`{{${key}}}`, String(replacement)),
    template
  );

type PeopleCardReadonlySectionsType = ReturnType<
  typeof buildReadonlyProfileSections
>;
type PeopleCardReadonlyConfigType =
  PeopleCardReadonlySectionsType[number]['config'];

/**
 * Render a profile card with readonly form elements.
 */
function PeopleCard({
  profile,
  mode,
  like,
  message,
  language,
  strings,
  discoveryMode = true,
  isConnection = false,
  likeActive,
  messageActive,
  guidance,
  interactionGate,
  secondaryActions,
  secondaryDetails,
}: PeopleCardProps) {
  const [imageView, setImageView] = useState(false);
  const [index, setIndex] = useState(0);
  const [localLiked, setLocalLiked] = useState(false);
  const [localMessaged, setLocalMessaged] = useState(false);
  const commonStrings = useMemo(() => strings.common, [strings.common]);
  const connectionStyleStrings = useMemo(
    () => strings.connectionStyle ?? DEFAULT_CONNECTION_STYLE_STRINGS,
    [strings.connectionStyle]
  );
  const userContext = useContext(UserContext);
  const profileFieldPrivacy = useMemo(() => {
    const persistedFieldPrivacy = Object.entries(profile.fieldVisibility ?? {})
      .filter(([, level]) => isProfileFieldPrivacyLevel(level))
      .reduce<Record<string, ProfileFieldPrivacyLevelType>>(
        (accumulator, [fieldName, level]) => {
          accumulator[fieldName] = level;
          return accumulator;
        },
        {}
      );

    if (Object.keys(persistedFieldPrivacy).length > 0) {
      return persistedFieldPrivacy;
    }

    return userContext.user[mode.id]?.id === profile.id
      ? loadModeFieldPrivacy(mode.id)
      : {};
  }, [mode.id, profile.fieldVisibility, profile.id, userContext.user]);
  const profilePrivacySettings = useMemo(
    () =>
      reconcileProfilePrivacySettings({
        pictures: profile.pictures ?? [],
        defaultPicture: profile.defaultPicture,
        pictureVisibility: profile.pictureVisibility,
        profileVisibility: profile.profileVisibility,
      }),
    [
      profile.defaultPicture,
      profile.pictureVisibility,
      profile.pictures,
      profile.profileVisibility,
    ]
  );
  const viewerActor = resolveGateActor({
    id: userContext.user[mode.id]?.id,
    verificationTier: userContext.user[mode.id]?.verificationTier,
    restrictionState: userContext.user[mode.id]?.restrictionState,
    lifecycleState: userContext.user[mode.id]?.lifecycleState,
  });
  const ownerActor = resolveGateActor({
    id: profile.id,
    verificationTier: profile.verificationTier,
    restrictionState: profile.restrictionState,
    lifecycleState: profile.lifecycleState,
  });
  const resolveFieldPrivacyLevel = (
    fieldName: string
  ): ProfileFieldPrivacyLevelType =>
    resolveProfileFieldPrivacyLevel({
      fieldName,
      fieldVisibility: profileFieldPrivacy,
      profileVisibility: profilePrivacySettings.profileVisibility,
    });
  const connectionRequestDecision = useMemo(
    () =>
      evaluateConnectionRequestGate({
        sender: viewerActor,
        recipient: ownerActor,
        alreadyConnected: isConnection,
        language,
      }),
    [isConnection, language, ownerActor, viewerActor]
  );
  const introMessageDecision = useMemo(
    () =>
      evaluateIntroMessageGate({
        sender: viewerActor,
        recipient: ownerActor,
        isConnection,
        messagingPrivacy: profile.messagingPrivacy ?? 'open_intro',
        language,
      }),
    [isConnection, language, ownerActor, profile.messagingPrivacy, viewerActor]
  );
  const nameVisibilityDecision = useMemo(
    () =>
      evaluateFieldVisibilityGate({
        viewer: viewerActor,
        owner: ownerActor,
        isConnection,
        fieldPrivacy: resolveFieldPrivacyLevel('name'),
        language,
      }),
    [
      isConnection,
      language,
      ownerActor,
      profilePrivacySettings.profileVisibility,
      viewerActor,
    ]
  );
  const visibleName =
    !discoveryMode || nameVisibilityDecision.allowed ? profile.name : '';
  const orderedPictures = useMemo(
    () =>
      getOrderedProfilePictures({
        pictures: profilePrivacySettings.pictures,
        defaultPicture: profilePrivacySettings.defaultPicture,
      }),
    [profilePrivacySettings.defaultPicture, profilePrivacySettings.pictures]
  );
  const galleryPictures = useMemo(() => {
    if (!profilePrivacySettings.pictures.length) {
      return [];
    }

    if (!discoveryMode) {
      return orderedPictures;
    }

    const resolvedDefaultPicture = getDefaultProfilePicture({
      pictures: profilePrivacySettings.pictures,
      defaultPicture: profilePrivacySettings.defaultPicture,
    });

    return orderedPictures.filter((picture) => {
      const fieldPrivacy =
        picture === resolvedDefaultPicture
          ? profilePrivacySettings.profileVisibility
          : isProfileFieldPrivacyLevel(
              profilePrivacySettings.pictureVisibility[picture]
            )
          ? profilePrivacySettings.pictureVisibility[picture]
          : 'open';

      return evaluateFieldVisibilityGate({
        viewer: viewerActor,
        owner: ownerActor,
        isConnection,
        fieldPrivacy,
        language,
      }).allowed;
    });
  }, [
    discoveryMode,
    isConnection,
    language,
    orderedPictures,
    ownerActor,
    profilePrivacySettings.defaultPicture,
    profilePrivacySettings.pictureVisibility,
    profilePrivacySettings.pictures,
    profilePrivacySettings.profileVisibility,
    viewerActor,
  ]);
  const hasHiddenPictures =
    discoveryMode &&
    profilePrivacySettings.pictures.length > 0 &&
    galleryPictures.length < profilePrivacySettings.pictures.length;
  const canShowPictures = galleryPictures.length > 0;
  const profileTitle =
    visibleName || renderValue(language, commonStrings.profileLabel);
  const imageItems = useMemo<ImageViewImage[]>(
    () =>
      galleryPictures.map((src, imageIndex) => ({
        src: src ?? '',
        alt: visibleName
          ? formatCommonTemplate(
              commonStrings.namedImageTemplate?.[language] ?? '',
              {
                name: visibleName,
                index: imageIndex + 1,
              }
            )
          : formatCommonTemplate(
              commonStrings.profileImageTemplate?.[language] ?? '',
              {
                index: imageIndex + 1,
              }
            ),
        caption: visibleName
          ? formatCommonTemplate(
              commonStrings.namedImageCaptionTemplate?.[language] ?? '',
              {
                name: visibleName,
                index: imageIndex + 1,
                count: galleryPictures.length,
              }
            )
          : formatCommonTemplate(
              commonStrings.imageCaptionTemplate?.[language] ?? '',
              {
                index: imageIndex + 1,
                count: galleryPictures.length,
              }
            ),
      })),
    [commonStrings, galleryPictures, language, visibleName]
  );
  const actionFeedbackMessages = useMemo(() => {
    if (!discoveryMode) {
      return [];
    }

    const feedbackMessages = new Set<string>();
    if (
      !connectionRequestDecision.allowed &&
      connectionRequestDecision.reason
    ) {
      feedbackMessages.add(connectionRequestDecision.reason);
    }
    if (!introMessageDecision.allowed && introMessageDecision.reason) {
      feedbackMessages.add(introMessageDecision.reason);
    }

    return [...feedbackMessages];
  }, [connectionRequestDecision, discoveryMode, introMessageDecision]);
  useEffect(() => {
    setIndex((previous) =>
      previous >= imageItems.length
        ? Math.max(0, imageItems.length - 1)
        : previous
    );
  }, [imageItems.length]);
  const toggleImageView = () => setImageView(!imageView);
  const formSections = useMemo(
    () =>
      buildReadonlyProfileSections({
        profile,
        mode,
        profileStrings: strings.profile,
        commonStrings,
        connectionStyleStrings,
        language,
      }),
    [
      commonStrings,
      connectionStyleStrings,
      language,
      mode,
      profile,
      strings.profile,
    ]
  );
  const privacyFeedback = useMemo(() => {
    if (!discoveryMode) {
      return {
        hiddenCount: 0,
        message: '',
      };
    }

    const hiddenConfigNames = new Set<string>();
    formSections.forEach((section) => {
      section.config.forEach((configItem) => {
        const itemName =
          typeof configItem.name === 'string' ? configItem.name : '';
        if (!itemName || hiddenConfigNames.has(itemName)) return;
        const gateDecision = evaluateFieldVisibilityGate({
          viewer: viewerActor,
          owner: ownerActor,
          isConnection,
          fieldPrivacy: resolveFieldPrivacyLevel(itemName),
          language,
        });
        if (!gateDecision.allowed) {
          hiddenConfigNames.add(itemName);
        }
      });
    });
    const hiddenCount = hiddenConfigNames.size + (hasHiddenPictures ? 1 : 0);
    return {
      hiddenCount,
      message:
        hiddenCount > 0
          ? formatCommonTemplate(
              commonStrings.privacyFieldsHiddenTemplate?.[language] ?? '',
              {
                count: hiddenCount,
              }
            )
          : '',
    };
  }, [
    commonStrings,
    discoveryMode,
    formSections,
    hasHiddenPictures,
    language,
    ownerActor,
    profileFieldPrivacy,
    profilePrivacySettings.profileVisibility,
    viewerActor,
  ]);

  const readonlyChange: (...args: unknown[]) => void = () => undefined;
  const resolvedLikeActive = likeActive ?? localLiked;
  const resolvedMessageActive = messageActive ?? localMessaged;
  const guidanceReasons = guidance?.whyShownReasons ?? [];
  const guidanceHints = guidance?.hintMessages ?? [];
  const compatibilityBadges = guidance?.compatibilityBadges ?? [];
  const isInteractionLocked = interactionGate?.isLocked ?? false;
  const hasGuidanceContent =
    compatibilityBadges.length > 0 ||
    guidanceReasons.length > 0 ||
    Boolean(guidance?.recommendedActionLabel) ||
    guidanceHints.length > 0;
  const renderFormConfig = (config: PeopleCardReadonlyConfigType) => {
    const visibleConfig = config.filter((configItem) => {
      if (!discoveryMode) return true;
      const itemName =
        typeof configItem.name === 'string' ? configItem.name : '';
      if (!itemName) return true;
      const gateDecision = evaluateFieldVisibilityGate({
        viewer: viewerActor,
        owner: ownerActor,
        isConnection,
        fieldPrivacy: resolveFieldPrivacyLevel(itemName),
        language,
      });
      return gateDecision.allowed;
    });
    return RenderFormElements({
      config: visibleConfig,
      handleChange: readonlyChange,
      handleCheckboxChange: readonlyChange,
      handleAutocompleteChange: readonlyChange,
      strings: {
        ...strings.profile.common,
        ...strings.profile[mode.id],
        ...commonStrings,
      },
      language,
    });
  };
  const mainSection = formSections[0];
  const discoveryMainSectionConfig = (mainSection?.config ?? []).filter(
    (configItem) => configItem.name !== 'name'
  );
  const previewConfig = discoveryMode
    ? discoveryMainSectionConfig.slice(0, 4)
    : mainSection?.config ?? [];
  const expandedSections: PeopleCardReadonlySectionsType = discoveryMode
    ? [
        ...(discoveryMainSectionConfig.slice(4).length > 0
          ? [{ config: discoveryMainSectionConfig.slice(4) }]
          : []),
        ...formSections.slice(1),
      ]
    : formSections.slice(1);
  const hasExpandedDetails = expandedSections.some(
    (section) => section.config.length > 0
  );

  /**
   * Handle like action and update UI feedback state.
   */
  const handleLike = () => {
    if (isInteractionLocked) {
      return;
    }
    if (likeActive === undefined) {
      setLocalLiked((prev) => !prev);
    }
    like();
  };

  /**
   * Handle message action and update UI feedback state.
   */
  const handleMessage = () => {
    if (isInteractionLocked) {
      return;
    }
    if (messageActive === undefined) {
      setLocalMessaged(true);
    }
    message();
  };
  const previewImage = imageItems[index] ?? imageItems[0];
  const galleryLabel = visibleName
    ? formatCommonTemplate(commonStrings.avatarForTemplate?.[language] ?? '', {
        name: visibleName,
      })
    : commonStrings.profileImageGallery?.[language] ?? '';
  return (
    <Card className="who-discovery-card">
      {imageView ? (
        canShowPictures && imageItems.length > 0 ? (
          <ImageView
            images={imageItems}
            initialIndex={index}
            onClose={toggleImageView}
            onIndexChange={setIndex}
            ariaLabel={galleryLabel}
            labels={{
              gallery: commonStrings.imageGallery?.[language] ?? '',
              unavailable: commonStrings.imageUnavailable?.[language] ?? '',
              close: commonStrings.closeGallery?.[language] ?? '',
              previous: commonStrings.showPreviousImage?.[language] ?? '',
              next: commonStrings.showNextImage?.[language] ?? '',
            }}
          />
        ) : null
      ) : (
        <Box className="who-discovery-card-shell">
          {canShowPictures && previewImage ? (
            <Button className="image-button" onClick={toggleImageView}>
              <CardMedia
                src={previewImage.src}
                className="profile-picture-preview"
                alt={
                  previewImage.alt ??
                  commonStrings.profilePicturePreview?.[language] ??
                  ''
                }
                height="300px"
              />
            </Button>
          ) : null}
          <CardHeader title={profileTitle} />
          <CardContent className="who-discovery-card-content">
            <Grid className="who-discovery-card-summary-grid">
              {privacyFeedback.hiddenCount > 0 ? (
                <GridItem xs={12}>
                  <Text variant="caption">{privacyFeedback.message}</Text>
                </GridItem>
              ) : null}
              {actionFeedbackMessages.map((message) => (
                <GridItem xs={12} key={message}>
                  <Text variant="caption">{message}</Text>
                </GridItem>
              ))}
              {interactionGate?.isLocked ? (
                <GridItem xs={12}>
                  <InteractionGateNotice gate={interactionGate} />
                </GridItem>
              ) : null}
              {discoveryMode && hasGuidanceContent ? (
                <GridItem xs={12}>
                  <Box className="who-discovery-guidance">
                    {compatibilityBadges.length > 0 ? (
                      <Box className="who-discovery-guidance-badges">
                        {compatibilityBadges.map((badge) => (
                          <Text key={badge} variant="caption">
                            {badge}
                          </Text>
                        ))}
                      </Box>
                    ) : null}
                    {guidance?.whyShownTitle && guidanceReasons.length > 0 ? (
                      <Text variant="caption">
                        {`${guidance.whyShownTitle}: ${guidanceReasons
                          .slice(0, 3)
                          .join(' • ')}`}
                      </Text>
                    ) : null}
                    {guidance?.recommendedActionTitle &&
                    guidance.recommendedActionLabel ? (
                      <Text variant="caption">
                        {`${guidance.recommendedActionTitle}: ${guidance.recommendedActionLabel}`}
                      </Text>
                    ) : null}
                    {guidanceHints.map((message) => (
                      <Text key={message} variant="caption">
                        {message}
                      </Text>
                    ))}
                  </Box>
                </GridItem>
              ) : null}
              {previewConfig.length > 0 ? (
                <Grid spacing={1} noPadding>
                  {renderFormConfig(previewConfig)}
                </Grid>
              ) : null}
              {hasExpandedDetails ? (
                <Collapse
                  className={`profile-info ${mode.id}`}
                  collapsedSize={0}
                  title={strings.common.more && strings.common.more[language]}
                >
                  {expandedSections.map((section, sectionIndex) => (
                    <GridItem xs={12} key={`readonly-section-${sectionIndex}`}>
                      {section.title ? (
                        <CardHeader title={section.title} />
                      ) : null}
                      <Grid spacing={1} noPadding>
                        {renderFormConfig(section.config)}
                      </Grid>
                    </GridItem>
                  ))}
                </Collapse>
              ) : null}
            </Grid>
          </CardContent>
          {discoveryMode || secondaryActions || secondaryDetails ? (
            <Box className="who-discovery-card-footer">
              {discoveryMode ? (
                <CardActions className="profile-main-button-container who-discovery-card-actions">
                  <Grid>
                    <GridItem xs={6}>
                      <Button
                        onClick={handleLike}
                        className="like-button"
                        disabled={isInteractionLocked}
                      >
                        {resolvedLikeActive
                          ? strings.common.liked[language]
                          : strings.common.like[language]}
                      </Button>
                    </GridItem>
                    <GridItem xs={6}>
                      <Button
                        onClick={handleMessage}
                        className="message-button"
                        disabled={isInteractionLocked}
                      >
                        {resolvedMessageActive
                          ? strings.common.messaged[language]
                          : strings.common.message[language]}
                      </Button>
                    </GridItem>
                  </Grid>
                </CardActions>
              ) : null}
              {secondaryActions ? (
                <Box className="who-discovery-card-utility-actions">
                  {secondaryActions}
                </Box>
              ) : null}
              {secondaryDetails ? (
                <Box className="who-discovery-card-utility-details">
                  {secondaryDetails}
                </Box>
              ) : null}
            </Box>
          ) : null}
        </Box>
      )}
    </Card>
  );
}

export default PeopleCard;
