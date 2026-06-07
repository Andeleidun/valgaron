import { ReactNode } from 'react';
import Card from '@mui/material/Card';
import { SxProps } from '@mui/material/styles';
import './Card.scss';

type CardProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  sx?: SxProps;
};

function WhoCard({ children, className = '', id, sx = {} }: CardProps) {
  return (
    <Card id={id} className={className + ' who-card fade-in'} sx={sx}>
      {children}
    </Card>
  );
}

export default WhoCard;
