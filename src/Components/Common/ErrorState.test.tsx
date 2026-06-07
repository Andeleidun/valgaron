import { fireEvent, render, screen } from '@testing-library/react';
import ErrorState from './ErrorState';

describe('ErrorState', () => {
  test('renders an alert without an action when none is provided', () => {
    render(
      <ErrorState
        title="Something went wrong"
        message="Please try again in a moment."
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please try again in a moment.'
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('renders a recovery action when both label and handler are provided', () => {
    const onAction = jest.fn();

    render(
      <ErrorState
        title="Retry failed"
        message="The latest sync did not complete."
        actionLabel="Try again"
        onAction={onAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
