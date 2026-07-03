import type { ReactNode } from 'react';
import CardContent from '@mui/material/CardContent';

type CardContentProps = {
  children: ReactNode;
  maxWidth?: string;
  className?: string;
};

function VWorldBuilderCardContent({
  children,
  className = 'card-content',
  maxWidth = '100%',
}: CardContentProps) {
  return (
    <CardContent className={className} sx={{ maxWidth: maxWidth }}>
      {children}
    </CardContent>
  );
}

export default VWorldBuilderCardContent;
