import { fireEvent, render, screen } from '@testing-library/react';
import WhoSwitch from './Switch';

describe('WhoSwitch', () => {
  test('renders a labeled switch and forwards click events', () => {
    const onClick = jest.fn();

    const { container } = render(
      <WhoSwitch
        checked={false}
        label="Dark mode"
        id="dark-mode"
        onClick={onClick}
        className="custom-switch"
        size="small"
      />
    );

    const checkbox = container.querySelector('#dark-mode-switch');
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error('Expected switch input to render with the provided id.');
    }

    expect(checkbox).toHaveAttribute('id', 'dark-mode-switch');
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
    expect(container.querySelector('.custom-switch')).toBeInTheDocument();

    fireEvent.click(checkbox);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('supports the default optional props and disabled state', () => {
    const { container } = render(
      <WhoSwitch checked label="Notifications" id="notifications" disabled />
    );

    const checkbox = container.querySelector('#notifications-switch');
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error('Expected disabled switch input to render.');
    }

    expect(checkbox).toBeDisabled();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
});
