import Container from '@mui/material/Container';
import type { ContainerProps } from '@mui/material/Container';
import './Container.css';

type WhoContainerProps = ContainerProps & {
  component?: 'div' | 'main' | 'section' | 'nav' | 'header';
  ariaLabelledBy?: string;
};

/**
 * Wrapper around MUI Container that standardizes layout styles.
 */
function WhoContainer({
  children,
  fixed,
  className = '',
  component = 'div',
  ariaLabelledBy,
  sx = {},
  ...props
}: WhoContainerProps) {
  const ariaProps = ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {};

  return (
    <Container
      sx={sx}
      className={`container ${className}`}
      fixed={fixed}
      component={component}
      {...props}
      {...ariaProps}
    >
      {children}
    </Container>
  );
}

export default WhoContainer;
