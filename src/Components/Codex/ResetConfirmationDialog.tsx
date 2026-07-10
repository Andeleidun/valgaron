import {
  dataResetCopy,
  destructiveActionDialogCopy,
  formatDestructiveActionTitle,
  getDestructiveActionCopy,
} from '@valgaron/core';
import { useDialogFocus } from '../../Utlilities/dialogFocus';

export function ResetConfirmationDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(true, onCancel);
  const copy = getDestructiveActionCopy('reset-document');

  return (
    <div className="vwb-dialog-backdrop" role="presentation">
      <section
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
        className="vwb-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <p className="vwb-kicker">{dataResetCopy.title}</p>
        <h2 id="reset-dialog-title">
          {formatDestructiveActionTitle('reset-document', 'workspace')}
        </h2>
        <p id="reset-dialog-description">{copy.message}</p>
        <div className="vwb-form-actions">
          <button
            className="vwb-secondary-button"
            type="button"
            onClick={onCancel}
          >
            {destructiveActionDialogCopy.cancelLabel}
          </button>
          <button
            className="vwb-primary-button vwb-danger-confirm-button"
            type="button"
            onClick={onConfirm}
          >
            {copy.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
