export type MobileUnsavedChangesAlertButton = {
  text: string;
  style: 'cancel' | 'destructive';
  onPress?: () => void;
};

export type MobileUnsavedChangesAlertPresenter = (
  title: string,
  message: string,
  buttons: readonly MobileUnsavedChangesAlertButton[]
) => void;

export const mobileUnsavedChangesTitle = 'Discard unsaved changes?';

export const mobileUnsavedChangesMessage =
  'This draft has local edits that have not been saved.';

export function confirmMobileDiscardUnsavedChangesWithPresenter({
  isDirty,
  message = mobileUnsavedChangesMessage,
  onCancel,
  onDiscard,
  presentAlert,
  title = mobileUnsavedChangesTitle,
}: {
  isDirty: boolean;
  message?: string;
  onCancel?: () => void;
  onDiscard: () => void;
  presentAlert: MobileUnsavedChangesAlertPresenter;
  title?: string;
}) {
  if (!isDirty) {
    onDiscard();
    return;
  }
  presentAlert(title, message, [
    { text: 'Keep Editing', style: 'cancel', onPress: onCancel },
    {
      text: 'Discard',
      style: 'destructive',
      onPress: onDiscard,
    },
  ]);
}
