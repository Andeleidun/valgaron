import React, { useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useLocation, useNavigate } from 'react-router-dom';
import type {
  CommonStringsType,
  ConnectionStyleModeStringsType,
  ConnectionStyleStringsType,
  ModeType,
  MultiOptionsType,
  OnboardingCompletionType,
  OnboardingPracticalFitType,
  OnboardingStringsType,
  OptionType,
  TranslationStringType,
  UserType,
} from '../../../types';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  GridItem,
  Heading,
  RadioGroup,
  Select,
  Text,
} from '../../';
import {
  buildOnboardingCompletion,
  getConnectionStylePracticalFitSelection,
  renderValue,
} from '../../../Utlilities';
import { resolveRedirectLocation } from '../../../Utlilities/redirectLocation';

type OnboardingProps = {
  mode: ModeType;
  user: UserType;
  strings: {
    onboarding: OnboardingStringsType;
    connectionStyle: ConnectionStyleStringsType;
    common: CommonStringsType;
  };
  language: string;
  onComplete: (payload: OnboardingCompletionType) => void;
};

type OnboardingSelections = {
  intentId: string;
  practicalFitId: OnboardingPracticalFitType | '';
  practicalFitValue: string;
};

const INTRO_STEP = 0;
const INTENT_STEP = 1;
const PRACTICAL_FIT_STEP = 2;
const SUMMARY_STEP = 3;

/**
 * Read any existing onboarding state for the active mode so the flow can
 * resume cleanly if the user switches modes or returns midstream.
 */
const resolveInitialSelections = ({
  mode,
  user,
}: {
  mode: ModeType;
  user: UserType;
}): OnboardingSelections => {
  const intentId = user.onboardingState?.[mode.id]?.modeIntent?.intentId ?? '';
  const practicalFitSelection = getConnectionStylePracticalFitSelection(
    user[mode.id]?.connectionStyle
  );

  return {
    intentId,
    practicalFitId: practicalFitSelection?.practicalFitId ?? '',
    practicalFitValue: practicalFitSelection?.value ?? '',
  };
};

/**
 * Resolve the translated label for the currently selected option value.
 */
const getSelectedOptionLabel = ({
  options,
  value,
  language,
}: {
  options: MultiOptionsType;
  value: string;
  language: string;
}): string => {
  const selectedOption = options.find((option) => option.value === value);
  return selectedOption ? renderValue(language, selectedOption.label) : value;
};

/**
 * Map onboarding practical-fit categories to the shared connection-style field
 * content and options.
 */
const getPracticalFitFieldContent = ({
  practicalFitId,
  connectionStyleStrings,
}: {
  practicalFitId: OnboardingPracticalFitType | '';
  connectionStyleStrings: ConnectionStyleModeStringsType;
}): {
  label: TranslationStringType;
  description: TranslationStringType;
  options: MultiOptionsType;
} | null => {
  switch (practicalFitId) {
    case 'schedule':
      return {
        label: connectionStyleStrings.availabilityPattern.title,
        description: connectionStyleStrings.availabilityPattern.description,
        options: connectionStyleStrings.availabilityPattern.options ?? [],
      };
    case 'pace':
      return {
        label: connectionStyleStrings.communicationPace.title,
        description: connectionStyleStrings.communicationPace.description,
        options: connectionStyleStrings.communicationPace.options ?? [],
      };
    case 'group_context':
      return {
        label: connectionStyleStrings.introductionPreference.title,
        description: connectionStyleStrings.introductionPreference.description,
        options: connectionStyleStrings.introductionPreference.options ?? [],
      };
    case 'language':
      return {
        label: connectionStyleStrings.languageComfort.title,
        description: connectionStyleStrings.languageComfort.description,
        options: connectionStyleStrings.languageComfort.options ?? [],
      };
    case 'planning':
      return {
        label: connectionStyleStrings.planningStyle.title,
        description: connectionStyleStrings.planningStyle.description,
        options: connectionStyleStrings.planningStyle.options ?? [],
      };
    default:
      return null;
  }
};

/**
 * Balanced onboarding flow for the active mode.
 *
 * The flow intentionally collects one intent and one practical-fit answer, then
 * writes the result into the shared connection-style schema used elsewhere in
 * the app.
 */
function Onboarding({
  mode,
  user,
  strings,
  language,
  onComplete,
}: OnboardingProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const onboardingStrings = strings.onboarding[mode.id];
  const connectionStyleStrings = strings.connectionStyle[mode.id];
  const initialSelections = resolveInitialSelections({ mode, user });
  const initialIntentId = initialSelections.intentId;
  const initialPracticalFitId = initialSelections.practicalFitId;
  const initialPracticalFitValue = initialSelections.practicalFitValue;
  const [stepIndex, setStepIndex] = useState(INTRO_STEP);
  const [intentId, setIntentId] = useState(initialIntentId);
  const [practicalFitId, setPracticalFitId] = useState<
    OnboardingPracticalFitType | ''
  >(initialPracticalFitId);
  const [practicalFitValue, setPracticalFitValue] = useState(
    initialPracticalFitValue
  );

  useEffect(() => {
    setStepIndex(INTRO_STEP);
    setIntentId(initialIntentId);
    setPracticalFitId(initialPracticalFitId);
    setPracticalFitValue(initialPracticalFitValue);
  }, [
    initialIntentId,
    initialPracticalFitId,
    initialPracticalFitValue,
    mode.id,
  ]);

  const intentOptions = onboardingStrings.intentOptions as OptionType[];
  const practicalFitOptions =
    onboardingStrings.practicalFitOptions as OptionType[];
  const practicalFitFieldContent = useMemo(
    () =>
      getPracticalFitFieldContent({
        practicalFitId,
        connectionStyleStrings,
      }),
    [connectionStyleStrings, practicalFitId]
  );
  const selectedIntentLabel = getSelectedOptionLabel({
    options: onboardingStrings.intentOptions,
    value: intentId,
    language,
  });
  const selectedPracticalFitCategoryLabel = getSelectedOptionLabel({
    options: onboardingStrings.practicalFitOptions,
    value: practicalFitId,
    language,
  });
  const selectedPracticalFitValueLabel = practicalFitFieldContent
    ? getSelectedOptionLabel({
        options: practicalFitFieldContent.options,
        value: practicalFitValue,
        language,
      })
    : '';
  const continueLabel =
    strings.common.continueAction?.[language] ??
    strings.common.continueAction?.en ??
    strings.common.save?.[language] ??
    strings.common.save?.en ??
    '';
  const backLabel =
    strings.common.back?.[language] ?? strings.common.back?.en ?? '';
  const saveLabel =
    strings.common.save?.[language] ?? strings.common.save?.en ?? '';

  const handlePracticalFitCategoryChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const nextPracticalFitId = event.target.value as OnboardingPracticalFitType;
    setPracticalFitId(nextPracticalFitId);
    setPracticalFitValue('');
  };

  const handlePracticalFitValueChange = (event: SelectChangeEvent<unknown>) => {
    setPracticalFitValue(String(event.target.value));
  };

  const handleAdvance = () => {
    if (stepIndex === INTRO_STEP) {
      setStepIndex(INTENT_STEP);
      return;
    }

    if (stepIndex === INTENT_STEP) {
      if (intentId.trim().length === 0) {
        return;
      }

      setStepIndex(PRACTICAL_FIT_STEP);
      return;
    }

    if (stepIndex === PRACTICAL_FIT_STEP) {
      if (
        practicalFitId.length === 0 ||
        practicalFitValue.trim().length === 0
      ) {
        return;
      }

      setStepIndex(SUMMARY_STEP);
      return;
    }

    if (
      stepIndex === SUMMARY_STEP &&
      practicalFitId !== '' &&
      practicalFitValue.trim().length > 0
    ) {
      const redirectLocation = resolveRedirectLocation({
        blockedPathnames: ['/onboarding'],
        fallbackPathname: '/',
        state: location.state,
      });
      onComplete(
        buildOnboardingCompletion({
          modeId: mode.id,
          intentId,
          practicalFitId,
          practicalFitValue,
        })
      );
      navigate(
        {
          pathname: redirectLocation.pathname,
          search: redirectLocation.search,
          hash: redirectLocation.hash,
        },
        {
          replace: true,
          state: redirectLocation.state,
        }
      );
    }
  };

  const handleBack = () => {
    setStepIndex((currentStep) =>
      currentStep > INTRO_STEP ? currentStep - 1 : currentStep
    );
  };

  return (
    <Container
      component="section"
      className={`who-main onboarding ${mode.id}`}
      sx={{ py: 4 }}
    >
      <Grid spacing={2}>
        <GridItem xs={12}>
          <Card
            sx={{
              maxWidth: 960,
              margin: '0 auto',
              borderRadius: 4,
            }}
          >
            <CardContent className="card-content">
              <Box sx={{ display: 'grid', gap: 3 }}>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Heading>
                    {renderValue(language, onboardingStrings.introTitle)}
                  </Heading>
                  <Text color="text.secondary">
                    {renderValue(language, onboardingStrings.introDescription)}
                  </Text>
                </Box>

                <Box
                  aria-hidden="true"
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 1,
                  }}
                >
                  {[
                    INTRO_STEP,
                    INTENT_STEP,
                    PRACTICAL_FIT_STEP,
                    SUMMARY_STEP,
                  ].map((stepValue) => (
                    <Box
                      key={stepValue}
                      sx={{
                        height: 8,
                        borderRadius: 999,
                        bgcolor:
                          stepValue <= stepIndex ? 'secondary.main' : 'divider',
                      }}
                    />
                  ))}
                </Box>

                {stepIndex === INTRO_STEP ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      p: 3,
                      borderRadius: 3,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Text variant="body1">
                      {renderValue(
                        language,
                        onboardingStrings.intentStepDescription
                      )}
                    </Text>
                    <Text variant="body1">
                      {renderValue(
                        language,
                        onboardingStrings.completionSummaryBody
                      )}
                    </Text>
                  </Box>
                ) : null}

                {stepIndex === INTENT_STEP ? (
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Text color="text.secondary">
                      {renderValue(
                        language,
                        onboardingStrings.intentStepDescription
                      )}
                    </Text>
                    <RadioGroup
                      name="onboarding-intent"
                      label={onboardingStrings.intentStepTitle}
                      language={language}
                      value={intentId}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setIntentId(event.target.value)
                      }
                      options={intentOptions}
                    />
                  </Box>
                ) : null}

                {stepIndex === PRACTICAL_FIT_STEP ? (
                  <Box sx={{ display: 'grid', gap: 3 }}>
                    <Text color="text.secondary">
                      {renderValue(
                        language,
                        onboardingStrings.practicalFitStepDescription
                      )}
                    </Text>
                    <RadioGroup
                      name="onboarding-practical-fit"
                      label={onboardingStrings.practicalFitStepTitle}
                      language={language}
                      value={practicalFitId}
                      onChange={handlePracticalFitCategoryChange}
                      options={practicalFitOptions}
                    />
                    {practicalFitFieldContent ? (
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        <Text variant="body2" color="text.secondary">
                          {renderValue(
                            language,
                            practicalFitFieldContent.description
                          )}
                        </Text>
                        <Select
                          name="onboarding-practical-fit-value"
                          language={language}
                          label={renderValue(
                            language,
                            practicalFitFieldContent.label
                          )}
                          value={practicalFitValue}
                          onChange={handlePracticalFitValueChange}
                          options={
                            practicalFitFieldContent.options as OptionType[]
                          }
                        />
                      </Box>
                    ) : null}
                  </Box>
                ) : null}

                {stepIndex === SUMMARY_STEP ? (
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1,
                        p: 3,
                        borderRadius: 3,
                        bgcolor: 'background.default',
                      }}
                    >
                      <Text variant="h6">
                        {renderValue(
                          language,
                          onboardingStrings.completionSummaryTitle
                        )}
                      </Text>
                      <Text color="text.secondary">
                        {renderValue(
                          language,
                          onboardingStrings.completionSummaryBody
                        )}
                      </Text>
                    </Box>
                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      <Text variant="subtitle1">
                        {renderValue(
                          language,
                          onboardingStrings.intentStepTitle
                        )}
                      </Text>
                      <Text color="text.secondary">{selectedIntentLabel}</Text>
                    </Box>
                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      <Text variant="subtitle1">
                        {renderValue(
                          language,
                          onboardingStrings.practicalFitStepTitle
                        )}
                      </Text>
                      <Text color="text.secondary">
                        {selectedPracticalFitCategoryLabel}
                        {selectedPracticalFitValueLabel
                          ? `: ${selectedPracticalFitValueLabel}`
                          : ''}
                      </Text>
                    </Box>
                  </Box>
                ) : null}

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Button
                    className="secondary"
                    onClick={handleBack}
                    disabled={stepIndex === INTRO_STEP}
                  >
                    {backLabel}
                  </Button>
                  <Button
                    onClick={handleAdvance}
                    disabled={
                      (stepIndex === INTENT_STEP &&
                        intentId.trim().length === 0) ||
                      (stepIndex === PRACTICAL_FIT_STEP &&
                        (practicalFitId.length === 0 ||
                          practicalFitValue.trim().length === 0))
                    }
                  >
                    {stepIndex === SUMMARY_STEP ? saveLabel : continueLabel}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Container>
  );
}

export default Onboarding;
