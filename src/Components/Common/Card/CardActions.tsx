import { ReactNode } from 'react';
import CardActions from '@mui/material/CardActions';

type CardActionsProps = {
  children: ReactNode;
  disableSpacing?: boolean;
  className?: string;
};

function WhoCardActions({
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

export default WhoCardActions;
