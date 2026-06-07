import { useContext } from 'react';
import { ProfilePageProps } from '../../../types';
import { UserContext } from '../../../Utlilities';
import {
  Box,
  Card,
  CardContent,
  Container,
  ErrorBoundary,
  Grid,
  GridItem,
  PeopleCard,
  EmptyState,
  ErrorState,
  Text,
} from '../../Common';
import { getConnectionStyleProfileSummaryItems } from './ConnectionStyleProfileConfig';

/**
 * Preserve the PeopleCard callback contract without exposing discovery actions
 * on the user's own profile view.
 */
const noopCardAction = (): void => undefined;

export function ProfileView({ mode, strings, language }: ProfilePageProps) {
  const userContext = useContext(UserContext);
  const useProfile = userContext.user[mode.id];
  const connectionStyleSummary = useProfile
    ? getConnectionStyleProfileSummaryItems({
        connectionStyle: useProfile.connectionStyle,
        strings: strings.connectionStyle[mode.id],
        language,
      })
    : [];
  const retryLabel = strings.common.retry?.[language] ?? '';
  const profileUnavailableTitle =
    strings.common.profileUnavailableTitle?.[language] ?? '';
  const profileRefreshMessage =
    strings.common.profileRefreshMessage?.[language] ?? '';
  const profileEmptyTitle = strings.common.profileEmptyTitle?.[language] ?? '';
  const profileEmptyMessage =
    strings.common.profileEmptyMessage?.[language] ?? '';
  return (
    <ErrorBoundary
      resetKeys={[mode.id, useProfile?.id ?? 'no-profile']}
      fallback={({ resetErrorBoundary }) => (
        <ErrorState
          title={profileUnavailableTitle}
          message={profileRefreshMessage}
          actionLabel={retryLabel}
          onAction={resetErrorBoundary}
        />
      )}
    >
      {useProfile ? (
        <Grid>
          <GridItem xs={12} key={useProfile.id}>
            <PeopleCard
              profile={useProfile}
              mode={mode}
              like={noopCardAction}
              message={noopCardAction}
              language={language}
              strings={strings}
              discoveryMode={false}
            />
          </GridItem>
          {connectionStyleSummary.length > 0 ? (
            <GridItem xs={12}>
              <Card id={`${mode.id}-connection-style-summary`}>
                <CardContent>
                  <Text variant="h6">
                    {strings.connectionStyle.common.sectionTitle[language]}
                  </Text>
                  <Text variant="body2" color="text.secondary">
                    {
                      strings.connectionStyle.common.sectionDescription[
                        language
                      ]
                    }
                  </Text>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    {connectionStyleSummary.map((item) => (
                      <Box
                        key={item.id}
                        sx={{
                          display: 'grid',
                          gap: 0.5,
                        }}
                      >
                        <Text variant="caption" color="text.secondary">
                          {item.label}
                        </Text>
                        <Text variant="body2">{item.value}</Text>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </GridItem>
          ) : null}
        </Grid>
      ) : (
        <Container>
          <EmptyState title={profileEmptyTitle} message={profileEmptyMessage} />
        </Container>
      )}
    </ErrorBoundary>
  );
}
