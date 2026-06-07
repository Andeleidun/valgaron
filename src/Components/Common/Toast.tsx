import { Box } from './Box/Box';
import { Text } from './Text/Text';
import { Button } from './Button';

/**
 * Props for Toast component.
 */
type ToastProps = {
  message: string;
  closeLabel: string;
  onClose: () => void;
};

/**
 * Simple toast notification for CTA feedback.
 */
const Toast = ({ message, closeLabel, onClose }: ToastProps) => {
  return (
    <Box className="who-toast" role="status">
      <Text>{message}</Text>
      <Button onClick={onClose}>{closeLabel}</Button>
    </Box>
  );
};

export default Toast;
