import { fireEvent, render, screen } from '@testing-library/react';
import WhoCollapse from '../Collapse';

describe('WhoCollapse accessibility', () => {
  test('exposes aria-expanded state on the toggle button', () => {
    render(
      <WhoCollapse title="More details">
        <div>Body content</div>
      </WhoCollapse>
    );

    const toggleButton = screen.getByRole('button', { name: /more details/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('connects toggle button and collapsible content with aria-controls', () => {
    render(
      <WhoCollapse title="More details">
        <div>Body content</div>
      </WhoCollapse>
    );

    const toggleButton = screen.getByRole('button', { name: /more details/i });
    const controlsId = toggleButton.getAttribute('aria-controls');

    expect(controlsId).toBeTruthy();
    expect(document.getElementById(controlsId ?? '')).toBeInTheDocument();
  });
});
