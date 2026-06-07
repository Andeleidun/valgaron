import Typography from '@mui/material/Typography';
import type { TypographyProps } from '@mui/material/Typography';

type TextProps = TypographyProps & {
  className?: string;
};

function Title({ children, ...props }: TextProps) {
  return (
    <Typography variant="h1" {...props}>
      {children}
    </Typography>
  );
}

function Heading({ children, ...props }: TextProps) {
  return (
    <Typography variant="h2" {...props}>
      {children}
    </Typography>
  );
}

function SubHeading({ children, ...props }: TextProps) {
  return (
    <Typography variant="h3" {...props}>
      {children}
    </Typography>
  );
}

function Text({ children, variant = 'body1', ...props }: TextProps) {
  return (
    <Typography variant={variant} {...props}>
      {children}
    </Typography>
  );
}

export { Title, Heading, SubHeading, Text };
