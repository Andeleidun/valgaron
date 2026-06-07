import { useId, useState } from 'react';
import Collapse, { CollapseProps } from '@mui/material/Collapse';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import { Box } from '../Box/Box';
import { Button } from '../Button';
import type { ButtonProps } from '../Button';
import './Collapse.scss';

type WhoCollapseProps = CollapseProps & {
  initialExpand?: boolean;
  buttonProps?: ButtonProps;
  buttonLabel?: string;
};

/**
 * Renders collapsible content with an accessible toggle button.
 */
function WhoCollapse({
  children,
  component = 'div',
  className = 'collapse',
  initialExpand = false,
  collapsedSize = 100,
  title = '',
  buttonProps,
  buttonLabel,
  ...props
}: WhoCollapseProps) {
  const collapseId = useId();
  const contentId = props.id ?? `who-collapse-content-${collapseId}`;
  const resolvedButtonLabel =
    buttonLabel ?? (typeof title === 'string' ? title : '');
  const [expand, setExpand] = useState(initialExpand);

  /**
   * Toggle collapse visibility.
   */
  const toggleExpandState = () => setExpand(!expand);

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

export default WhoCollapse;
