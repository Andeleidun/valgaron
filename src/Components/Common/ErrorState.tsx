import Container from './Container/Container';
import Stack from './Stack/Stack';
import { Button } from './Button';
import { Heading, Text } from './Text/Text';

/**
 * Props for the ErrorState component.
 */
type ErrorStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Renders an error state message with an optional recovery action.
 */
const ErrorState = ({
  title,
  message,
  actionLabel,
  onAction,
}: ErrorStateProps) => {
  return (
    <Container className="who-error-state" role="alert">
      <Stack spacing={2}>
        <Heading>{title}</Heading>
        <Text>{message}</Text>
        {actionLabel && onAction ? (
          <Button onClick={onAction}>{actionLabel}</Button>
        ) : null}
      </Stack>
    </Container>
  );
};

export default ErrorState;
