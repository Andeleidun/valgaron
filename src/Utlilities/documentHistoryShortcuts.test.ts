import { describe, expect, it, jest } from '@jest/globals';
import {
  getDocumentHistoryKeyboardAction,
  runDocumentHistoryKeyboardShortcut,
} from './documentHistoryShortcuts';

const baseShortcut = {
  altKey: false,
  ctrlKey: true,
  isTargetIgnored: false,
  metaKey: false,
  shiftKey: false,
};

function createKeyboardEvent(key: string, defaultPrevented = false) {
  return {
    altKey: false,
    ctrlKey: true,
    defaultPrevented,
    key,
    metaKey: false,
    preventDefault: jest.fn(),
    shiftKey: false,
    target: null,
  };
}

describe('document history shortcuts', () => {
  it('maps only unmodified Ctrl+Z and Ctrl+Y outside ignored targets', () => {
    expect(
      getDocumentHistoryKeyboardAction({ ...baseShortcut, key: 'z' })
    ).toBe('undo');
    expect(
      getDocumentHistoryKeyboardAction({ ...baseShortcut, key: 'Y' })
    ).toBe('redo');
    expect(
      getDocumentHistoryKeyboardAction({
        ...baseShortcut,
        isTargetIgnored: true,
        key: 'z',
      })
    ).toBeNull();
    expect(
      getDocumentHistoryKeyboardAction({
        ...baseShortcut,
        ctrlKey: false,
        key: 'z',
      })
    ).toBeNull();
    expect(
      getDocumentHistoryKeyboardAction({
        ...baseShortcut,
        shiftKey: true,
        key: 'z',
      })
    ).toBeNull();
    expect(
      getDocumentHistoryKeyboardAction({
        ...baseShortcut,
        altKey: true,
        key: 'z',
      })
    ).toBeNull();
    expect(
      getDocumentHistoryKeyboardAction({
        ...baseShortcut,
        metaKey: true,
        key: 'z',
      })
    ).toBeNull();
    expect(
      getDocumentHistoryKeyboardAction({ ...baseShortcut, key: 'x' })
    ).toBeNull();
  });

  it('runs available Undo and Redo actions and prevents browser handling', () => {
    const onRedo = jest.fn();
    const onUndo = jest.fn();
    const undoEvent = createKeyboardEvent('z');
    const redoEvent = createKeyboardEvent('y');

    expect(
      runDocumentHistoryKeyboardShortcut({
        canRedo: true,
        canUndo: true,
        event: undoEvent,
        onRedo,
        onUndo,
      })
    ).toBe('undo');
    expect(
      runDocumentHistoryKeyboardShortcut({
        canRedo: true,
        canUndo: true,
        event: redoEvent,
        onRedo,
        onUndo,
      })
    ).toBe('redo');
    expect(undoEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(redoEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('leaves unavailable and previously handled shortcuts untouched', () => {
    const onRedo = jest.fn();
    const onUndo = jest.fn();
    const unavailableEvent = createKeyboardEvent('z');
    const handledEvent = createKeyboardEvent('y', true);

    expect(
      runDocumentHistoryKeyboardShortcut({
        canRedo: false,
        canUndo: false,
        event: unavailableEvent,
        onRedo,
        onUndo,
      })
    ).toBeNull();
    expect(
      runDocumentHistoryKeyboardShortcut({
        canRedo: true,
        canUndo: true,
        event: handledEvent,
        onRedo,
        onUndo,
      })
    ).toBeNull();
    expect(unavailableEvent.preventDefault).not.toHaveBeenCalled();
    expect(handledEvent.preventDefault).not.toHaveBeenCalled();
    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });
});
