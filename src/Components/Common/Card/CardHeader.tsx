import { ReactNode } from 'react';
import CardHeader from '@mui/material/CardHeader';

type CardHeaderProps = {
  title: string;
  avatar?: ReactNode;
  action?: ReactNode;
  subheader?: string;
};

function WhoCardHeader({ title, avatar, action, subheader }: CardHeaderProps) {
  return (
    <CardHeader
      title={title}
      avatar={avatar}
      action={action}
      subheader={subheader}
    />
  );
}

export default WhoCardHeader;
