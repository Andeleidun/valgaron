import { Alert } from 'react-native';
import {
  getDiscardUnsavedChangesConfirmation,
  type UnsavedChangesConfirmationAction,
} from '@valgaron/core';

type NativeUnsavedChangesAlertButton = {
  onPress?: () => void;
  style: 'cancel' | 'destructive';
  text: string;
};

function toAlertButton(
  action: UnsavedChangesConfirmationAction,
  callbacks: {
    onCancel?: () => void;
    onDiscard: () => void;
  }
): NativeUnsavedChangesAlertButton {
  return {
    onPress: action.id === 'discard' ? callbacks.onDiscard : callbacks.onCancel,
    style: action.intent,
    text: action.label,
  };
}

export function confirmDiscardUnsavedChangesOnMobile(
  isDirty: boolean,
  onDiscard: () => void,
  onCancel?: () => void,
  copy?: {
    message?: string;
    title?: string;
  }
) {
  const confirmation = getDiscardUnsavedChangesConfirmation({
    isDirty,
    message: copy?.message,
    title: copy?.title,
  });

  if (confirmation.kind === 'clean') {
    onDiscard();
    return;
  }

  Alert.alert(
    confirmation.title,
    confirmation.message,
    confirmation.actions.map((action) =>
      toAlertButton(action, { onCancel, onDiscard })
    )
  );
}
