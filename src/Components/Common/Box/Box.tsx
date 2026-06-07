import BaseBox from '@mui/material/Box';
import type { BoxProps as BaseBoxProps } from '@mui/material/Box';

type BoxProps = BaseBoxProps & {
  ariaLabelledBy?: string;
};

export function Box({ children, ariaLabelledBy = '', ...props }: BoxProps) {
  return (
    <BaseBox aria-labelledby={ariaLabelledBy} {...props}>
      {children}
    </BaseBox>
  );
}
