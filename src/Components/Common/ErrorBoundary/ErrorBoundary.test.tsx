import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Controlled child that can throw during render to exercise boundary recovery.
 */
function MaybeCrash({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Boom');
  }
  return <div>Recovered content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('resets when the fallback retry action is triggered', () => {
    const { rerender } = render(
      <ErrorBoundary
        fallback={({ resetErrorBoundary }) => (
          <button type="button" onClick={resetErrorBoundary}>
            Retry
          </button>
        )}
      >
        <MaybeCrash shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();

    rerender(
      <ErrorBoundary
        fallback={({ resetErrorBoundary }) => (
          <button type="button" onClick={resetErrorBoundary}>
            Retry
          </button>
        )}
      >
        <MaybeCrash shouldThrow={false} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  test('resets automatically when reset keys change', () => {
    const { rerender } = render(
      <ErrorBoundary fallback={<div>Fallback</div>} resetKeys={['first']}>
        <MaybeCrash shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Fallback')).toBeInTheDocument();

    rerender(
      <ErrorBoundary fallback={<div>Fallback</div>} resetKeys={['second']}>
        <MaybeCrash shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });
});
