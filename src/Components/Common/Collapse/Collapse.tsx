import { useId, useState } from 'react';
import Collapse from '@mui/material/Collapse';
import type { CollapseProps } from '@mui/material/Collapse';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import { Box } from '../Box/Box';
import { Button } from '../Button';
import type { ButtonProps } from '../Button';
import './Collapse.css';

type VWorldBuilderCollapseProps = CollapseProps & {
  initialExpand?: boolean;
  buttonProps?: ButtonProps;
  buttonLabel?: string;
};

/**
 * Renders collapsible content with an accessible toggle button.
 */
function VWorldBuilderCollapse({
  children,
  component = 'div',
  className = 'collapse',
  initialExpand = false,
  collapsedSize = 100,
  title = '',
  buttonProps,
  buttonLabel,
  ...props
}: VWorldBuilderCollapseProps) {
  const collapseId = useId();
  const contentId = props.id ?? `vwb-collapse-content-${collapseId}`;
  const resolvedButtonLabel =
    buttonLabel ?? (typeof title === 'string' ? title : '');
  const [expand, setExpand] = useState(initialExpand);

  /**
   * Toggle collapse visibility.
   */
  const toggleExpandState = () => setExpand((currentValue) => !currentValue);

  return (
    <Box className="collapse-container">
      <Collapse
        id={contentId}
        className={className}
        in={expand}
        collapsedSize={collapsedSize}
        component={component}
        timeout={'auto'}
        {...props}
      >
        {children}
      </Collapse>
      <Button
        onClick={toggleExpandState}
        className="expand-button"
        {...buttonProps}
        aria-controls={contentId}
        aria-expanded={expand}
        aria-label={resolvedButtonLabel}
      >
        {title}
        {expand ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
      </Button>
    </Box>
  );
}

export default VWorldBuilderCollapse;
