import Container from './Container/Container';
import Stack from './Stack/Stack';
import { Button } from './Button';
import { Heading, Text } from './Text/Text';

/**
 * Props for the EmptyState component.
 */
type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Renders a friendly empty state with an optional action.
 */
const EmptyState = ({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <Container className="vwb-empty-state">
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

export default EmptyState;
