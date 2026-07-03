import type { ReactNode } from 'react';
import CardActions from '@mui/material/CardActions';

type CardActionsProps = {
  children: ReactNode;
  disableSpacing?: boolean;
  className?: string;
};

function VWorldBuilderCardActions({
  children,
  className = 'card-actions',
  disableSpacing = false,
}: CardActionsProps) {
  return (
    <CardActions disableSpacing={disableSpacing} className={className}>
      {children}
    </CardActions>
  );
}

export default VWorldBuilderCardActions;
