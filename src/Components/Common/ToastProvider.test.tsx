import { fireEvent, render, screen } from '@testing-library/react';
import ToastProvider, { useToast } from './ToastProvider';

const ToastTrigger = () => {
  const { pushToast } = useToast();

  return (
    <>
      <button onClick={() => pushToast('Saved profile')}>Toast one</button>
      <button onClick={() => pushToast('Joined group')}>Toast two</button>
    </>
  );
};

const OutsideProviderConsumer = () => {
  useToast();
  return null;
};

describe('ToastProvider', () => {
  test('renders and dismisses queued toasts', () => {
    render(
      <ToastProvider dismissLabel="Dismiss">
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toast one' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toast two' }));

    expect(screen.getByText('Saved profile')).toBeInTheDocument();
    expect(screen.getByText('Joined group')).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss' })[0]);

    expect(screen.queryByText('Saved profile')).not.toBeInTheDocument();
    expect(screen.getByText('Joined group')).toBeInTheDocument();
  });

  test('throws when used outside the provider', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() => render(<OutsideProviderConsumer />)).toThrow(
      'useToast must be used within a ToastProvider.'
    );

    consoleErrorSpy.mockRestore();
  });
});
