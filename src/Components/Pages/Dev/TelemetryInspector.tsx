import { useMemo, useState } from 'react';
import fetchTranslations from '../../../Utlilities/translations';
import {
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  GridItem,
  Text,
} from '../../';
import {
  clearStoredWhoTelemetryEvents,
  getStoredWhoTelemetryEvents,
} from '../../../Utlilities/telemetry';

/**
 * Resolve the current UI language from persisted user settings.
 */
const getTelemetryInspectorLanguage = (): string => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'en';
  }
  const rawUserProfile = window.localStorage.getItem('userProfile');
  if (!rawUserProfile) {
    return 'en';
  }
  try {
    const parsedProfile = JSON.parse(rawUserProfile) as {
      userSettings?: { language?: string };
    };
    return parsedProfile.userSettings?.language === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
};

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

/**
 * Development-only telemetry inspector for quick local debugging.
 */
function TelemetryInspector() {
  const translations = fetchTranslations();
  const language = getTelemetryInspectorLanguage();
  const commonStrings = translations.common;
  const [refreshKey, setRefreshKey] = useState(0);

  const events = useMemo(() => getStoredWhoTelemetryEvents(), [refreshKey]);

  const handleRefresh = () => setRefreshKey((value) => value + 1);
  const handleClear = () => {
    clearStoredWhoTelemetryEvents();
    handleRefresh();
  };

  return (
    <Container component="main" className="who-main telemetry-inspector">
      <Grid spacing={2}>
        <GridItem xs={12}>
          <Text variant="h4">
            {commonStrings.telemetryInspectorTitle?.[language]}
          </Text>
          <Text variant="body1">
            {commonStrings.telemetryInspectorSubtitle?.[language]}
          </Text>
        </GridItem>
        <GridItem xs={12}>
          <Button onClick={handleRefresh}>
            {commonStrings.refresh?.[language]}
          </Button>{' '}
          <Button onClick={handleClear}>
            {commonStrings.clear?.[language]}
          </Button>
        </GridItem>
        <GridItem xs={12}>
          <Card>
            <CardContent>
              <Text variant="h6">
                {formatCommonTemplate(
                  commonStrings.storedEventsTemplate?.[language] ?? '',
                  {
                    count: events.length,
                  }
                )}
              </Text>
              {events.length === 0 ? (
                <Text variant="body2">
                  {commonStrings.noTelemetryEvents?.[language]}
                </Text>
              ) : (
                events
                  .slice()
                  .reverse()
                  .map((event, index) => (
                    <Text variant="body2" key={`${event.recordedAt}-${index}`}>
                      {`${event.recordedAt} · ${event.type} · ${event.modeId}${
                        'destination' in event
                          ? ` · ${event.destination}`
                          : 'completion' in event
                          ? ` · ${event.completion}%`
                          : ''
                      }`}
                    </Text>
                  ))
              )}
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </Container>
  );
}

export default TelemetryInspector;
