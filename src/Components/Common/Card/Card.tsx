import type { ReactNode } from 'react';
import Card from '@mui/material/Card';
import type { SxProps } from '@mui/material/styles';
import './Card.css';

type CardProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  sx?: SxProps;
};

function VWorldBuilderCard({
  children,
  className = '',
  id,
  sx = {},
}: CardProps) {
  return (
    <Card id={id} className={`vwb-card fade-in ${className}`.trim()} sx={sx}>
      {children}
    </Card>
  );
}

export default VWorldBuilderCard;
