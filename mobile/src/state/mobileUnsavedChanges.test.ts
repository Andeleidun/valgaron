import { describe, expect, it, jest } from '@jest/globals';
import {
  confirmMobileDiscardUnsavedChangesWithPresenter,
  mobileUnsavedChangesMessage,
  mobileUnsavedChangesTitle,
  type MobileUnsavedChangesAlertButton,
} from './mobileUnsavedChanges';

describe('mobile unsaved changes confirmation', () => {
  it('runs the action immediately when the draft is clean', () => {
    const onDiscard = jest.fn();
    const presentAlert = jest.fn();

    confirmMobileDiscardUnsavedChangesWithPresenter({
      isDirty: false,
      onDiscard,
      presentAlert,
    });

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(presentAlert).not.toHaveBeenCalled();
  });

  it('presents cancel and discard actions for dirty drafts', () => {
    const onCancel = jest.fn();
    const onDiscard = jest.fn();
    const alertCalls: Array<{
      title: string;
      message: string;
      buttons: readonly MobileUnsavedChangesAlertButton[];
    }> = [];
    const presentAlert = (
      title: string,
      message: string,
      buttons: readonly MobileUnsavedChangesAlertButton[]
    ) => {
      alertCalls.push({ title, message, buttons });
    };

    confirmMobileDiscardUnsavedChangesWithPresenter({
      isDirty: true,
      onCancel,
      onDiscard,
      presentAlert,
    });

    expect(alertCalls[0]?.title).toBe(mobileUnsavedChangesTitle);
    expect(alertCalls[0]?.message).toBe(mobileUnsavedChangesMessage);
    const buttons = alertCalls[0]?.buttons ?? [];
    expect(buttons.map((button) => [button.text, button.style])).toEqual([
      ['Keep Editing', 'cancel'],
      ['Discard', 'destructive'],
    ]);

    buttons[0]?.onPress?.();
    buttons[1]?.onPress?.();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('allows screen-specific discard wording', () => {
    const alertCalls: Array<{ title: string; message: string }> = [];

    confirmMobileDiscardUnsavedChangesWithPresenter({
      isDirty: true,
      message: 'Discard pasted import text?',
      onDiscard: jest.fn(),
      presentAlert: (title, message) => {
        alertCalls.push({ title, message });
      },
      title: 'Clear import text?',
    });

    expect(alertCalls).toEqual([
      { title: 'Clear import text?', message: 'Discard pasted import text?' },
    ]);
  });
});
