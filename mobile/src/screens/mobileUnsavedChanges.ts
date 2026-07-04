import { Alert } from 'react-native';
import {
  confirmMobileDiscardUnsavedChangesWithPresenter,
  type MobileUnsavedChangesAlertButton,
} from '../state/mobileUnsavedChanges';

export function confirmMobileDiscardUnsavedChanges(
  isDirty: boolean,
  onDiscard: () => void,
  onCancel?: () => void,
  copy?: {
    message?: string;
    title?: string;
  }
) {
  confirmMobileDiscardUnsavedChangesWithPresenter({
    isDirty,
    message: copy?.message,
    onCancel,
    onDiscard,
    presentAlert: (
      title: string,
      message: string,
      buttons: readonly MobileUnsavedChangesAlertButton[]
    ) => Alert.alert(title, message, [...buttons]),
    title: copy?.title,
  });
}
