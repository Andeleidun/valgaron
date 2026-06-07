import type { InteractionGateType } from '../../types';
import { Box } from './Box/Box';
import { Text } from './Text/Text';

type InteractionGateNoticeProps = {
  gate: InteractionGateType;
  variant?: 'body2' | 'caption';
};

/**
 * Render a concise explanation for disabled interaction surfaces.
 */
const InteractionGateNotice = ({
  gate,
  variant = 'caption',
}: InteractionGateNoticeProps) => {
  if (!gate.isLocked) {
    return null;
  }

  return (
    <Box sx={{ display: 'grid', gap: 0.5 }}>
      <Text variant={variant} color="text.secondary">
        {gate.message}
      </Text>
    </Box>
  );
};

export default InteractionGateNotice;
