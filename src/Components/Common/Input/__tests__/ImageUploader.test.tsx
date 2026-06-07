import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUploader from '../ImageUploader';
import { flushReactEffects, runWithReactAct } from '../../../../test/reactAct';

const imageUploaderStrings = {
  invalidFileTypeMessage: 'Only image files are allowed.',
  fileSizeLimitTemplate: 'Image size must be under {{size}}.',
  previewAltTemplate: 'Uploaded preview {{index}}',
  removeLabel: 'Remove',
};

/**
 * Mock object URL lifecycle for image preview tests.
 */
const createObjectUrlMock = jest.fn(() => 'blob:mock-preview');
const revokeObjectUrlMock = jest.fn();

describe('ImageUploader', () => {
  beforeAll(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectUrlMock,
    });
  });

  beforeEach(() => {
    createObjectUrlMock.mockImplementation(() => 'blob:mock-preview');
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();
  });

  test('adds a valid image file and renders preview', async () => {
    const handleChange = jest.fn();
    render(
      <ImageUploader
        value={[]}
        onChange={handleChange}
        label="Pictures"
        strings={imageUploaderStrings}
      />
    );
    await flushReactEffects();

    const fileInput = screen.getByLabelText('Pictures');
    const imageFile = new File(['binary'], 'photo.png', { type: 'image/png' });

    await runWithReactAct(async () => {
      await userEvent.upload(fileInput, imageFile);
    });
    await flushReactEffects();

    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(['blob:mock-preview']);
  });

  test('rejects invalid file types with an error message', async () => {
    const handleChange = jest.fn();
    render(
      <ImageUploader
        value={[]}
        onChange={handleChange}
        label="Pictures"
        strings={imageUploaderStrings}
      />
    );
    await flushReactEffects();

    const fileInput = screen.getByLabelText('Pictures');
    const textFile = new File(['hello'], 'note.txt', { type: 'text/plain' });

    await runWithReactAct(async () => {
      await userEvent.upload(fileInput, textFile);
    });
    await flushReactEffects();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only image files are allowed.'
    );
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  test('rejects oversized images with an error message', async () => {
    const handleChange = jest.fn();
    render(
      <ImageUploader
        value={[]}
        onChange={handleChange}
        label="Pictures"
        maxFileSizeBytes={2}
        strings={imageUploaderStrings}
      />
    );
    await flushReactEffects();

    const fileInput = screen.getByLabelText('Pictures');
    const oversizedFile = new File(['12345'], 'large.png', {
      type: 'image/png',
    });

    await runWithReactAct(async () => {
      await userEvent.upload(fileInput, oversizedFile);
    });
    await flushReactEffects();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Image size must be under 2 B.'
    );
    expect(handleChange).toHaveBeenCalledWith([]);
  });
});
