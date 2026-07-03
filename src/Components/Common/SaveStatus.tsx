import { Box } from './Box/Box';
import { Button } from './Button';
import { Text } from './Text/Text';

/**
 * Save status UI state values.
 */
export type SaveStatusState = 'idle' | 'saving' | 'success' | 'error';

/**
 * Labels used by SaveStatus actions.
 */
export type SaveStatusLabels = {
  retry: string;
  dismiss: string;
};

/**
 * Props for SaveStatus component.
 */
type SaveStatusProps = {
  status: SaveStatusState;
  successMessage: string;
  errorMessage: string;
  savingMessage: string;
  labels: SaveStatusLabels;
  onRetry?: () => void;
  onDismiss?: () => void;
};

/**
 * Render save progress and outcomes for reusable forms.
 */
const SaveStatus = ({
  status,
  successMessage,
  errorMessage,
  savingMessage,
  labels,
  onRetry,
  onDismiss,
}: SaveStatusProps) => {
  if (status === 'idle') return null;

  if (status === 'saving') {
    return (
      <Box role="status" aria-live="polite">
        <Text>{savingMessage}</Text>
      </Box>
    );
  }

  if (status === 'success') {
    return (
      <Box role="status" aria-live="polite">
        <Text>{successMessage}</Text>
        {onDismiss ? (
          <Button type="button" onClick={onDismiss}>
            {labels.dismiss}
          </Button>
        ) : null}
      </Box>
    );
  }

  return (
    <Box role="alert">
      <Text>{errorMessage}</Text>
      {onRetry ? (
        <Button type="button" onClick={onRetry}>
          {labels.retry}
        </Button>
      ) : null}
      {onDismiss ? (
        <Button type="button" onClick={onDismiss}>
          {labels.dismiss}
        </Button>
      ) : null}
    </Box>
  );
};

export default SaveStatus;
