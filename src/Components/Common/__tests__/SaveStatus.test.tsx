import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import SaveStatus from '../SaveStatus';
import { flushReactEffects, runWithReactAct } from '../../../test/reactAct';

describe('SaveStatus', () => {
  const labels = {
    retry: 'Retry',
    dismiss: 'Dismiss',
  };
  const theme = createTheme({
    components: {
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
      },
    },
  });

  /**
   * Render SaveStatus with a test theme that disables MUI ripple side effects.
   */
  const renderSaveStatus = (props: React.ComponentProps<typeof SaveStatus>) =>
    render(
      <ThemeProvider theme={theme}>
        <SaveStatus {...props} />
      </ThemeProvider>
    );

  test('renders saving state', () => {
    renderSaveStatus({
      status: 'saving',
      successMessage: 'Saved',
      errorMessage: 'Failed',
      savingMessage: 'Saving profile...',
      labels,
    });

    expect(screen.getByRole('status')).toHaveTextContent('Saving profile...');
  });

  test('renders success state and allows dismiss', async () => {
    const onDismiss = jest.fn();
    renderSaveStatus({
      status: 'success',
      successMessage: 'Profile saved successfully.',
      errorMessage: 'Failed',
      savingMessage: 'Saving profile...',
      labels,
      onDismiss,
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Profile saved successfully.'
    );
    await flushReactEffects();
    await runWithReactAct(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    });
    await flushReactEffects();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('renders error state and allows retry', async () => {
    const onRetry = jest.fn();
    renderSaveStatus({
      status: 'error',
      successMessage: 'Saved',
      errorMessage: 'Unable to save profile.',
      savingMessage: 'Saving profile...',
      labels,
      onRetry,
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to save profile.'
    );
    await flushReactEffects();
    await runWithReactAct(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    await flushReactEffects();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
