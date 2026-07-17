import { describe, expect, it, jest } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  DocumentPersistenceControls,
  getDocumentPersistenceAnnouncement,
} from './DocumentPersistenceControls';

describe('DocumentPersistenceControls', () => {
  it('renders accessible Undo, Redo, Save controls in that order', () => {
    const markup = renderToStaticMarkup(
      <DocumentPersistenceControls
        canRedo={false}
        canUndo
        hasDirtyDraft
        historyAnnouncement="Undid Update place “Emberfall”."
        onRedo={jest.fn()}
        onSave={jest.fn()}
        onUndo={jest.fn()}
        redoActionLabel={null}
        saveButtonModel={{
          accessibilityLabel: 'Save current document',
          disabled: false,
          label: 'Save',
        }}
        saveState="dirty"
        undoActionLabel={'Update place “Emberfall”'}
      />
    );

    expect(markup).toContain('role="group"');
    expect(markup).toContain('aria-keyshortcuts="Control+Z"');
    expect(markup).toContain('aria-keyshortcuts="Control+Y"');
    expect(markup).toContain('aria-label="Undo Update place “Emberfall”"');
    expect(markup).toContain('aria-label="Nothing to redo"');
    expect(markup).toContain(
      'Nothing to redo" class="vwb-secondary-button" disabled'
    );
    expect(markup.match(/aria-live="polite"/g)).toHaveLength(1);
    expect(markup).toContain('Unapplied draft changes are not included.');
    expect(markup).toContain(
      'Undid Update place “Emberfall”. Unsaved document changes. Unapplied draft changes are not included.'
    );
    expect(markup).not.toContain('Undid Update place “Emberfall”. Save.');
    expect(markup.indexOf('>Undo<')).toBeLessThan(markup.indexOf('>Redo<'));
    expect(markup.indexOf('>Redo<')).toBeLessThan(markup.indexOf('>Save<'));
  });

  it('announces persistence outcomes instead of button commands', () => {
    expect(
      getDocumentPersistenceAnnouncement({
        hasDirtyDraft: false,
        historyAnnouncement: '',
        saveState: 'failed',
      })
    ).toBe('Save failed.');
    expect(
      getDocumentPersistenceAnnouncement({
        hasDirtyDraft: false,
        historyAnnouncement: '',
        saveState: 'saved',
      })
    ).toBe('Document saved.');
  });

  it('disables both history buttons when neither direction is available', () => {
    const markup = renderToStaticMarkup(
      <DocumentPersistenceControls
        canRedo={false}
        canUndo={false}
        hasDirtyDraft={false}
        historyAnnouncement=""
        onRedo={jest.fn()}
        onSave={jest.fn()}
        onUndo={jest.fn()}
        redoActionLabel={null}
        saveButtonModel={{
          accessibilityLabel: 'Document saved',
          disabled: true,
          label: 'Saved',
        }}
        saveState="saved"
        undoActionLabel={null}
      />
    );

    expect(markup).toContain(
      'aria-label="Nothing to undo" class="vwb-secondary-button" disabled'
    );
    expect(markup).toContain(
      'aria-label="Nothing to redo" class="vwb-secondary-button" disabled'
    );
  });
});
