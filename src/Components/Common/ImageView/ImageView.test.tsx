import { fireEvent, render, screen } from '@testing-library/react';
import ImageView from './ImageView';

const labels = {
  gallery: 'Gallery viewer',
  unavailable: 'Images unavailable',
  close: 'Close gallery',
  previous: 'Previous image',
  next: 'Next image',
};

const images = [
  {
    src: 'https://images.example.com/one.jpg',
  },
  {
    src: 'https://images.example.com/two.jpg',
    alt: 'Second profile image',
    caption: 'Second caption',
  },
];

describe('ImageView', () => {
  beforeEach(() => {
    document.body.style.overflow = 'scroll';
  });

  test('renders the empty state and lets the user close the viewer', () => {
    const onClose = jest.fn();

    render(<ImageView images={[]} onClose={onClose} labels={labels} />);

    expect(
      screen.getByRole('dialog', { name: labels.gallery })
    ).toBeInTheDocument();
    expect(screen.getByText(labels.unavailable)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: labels.close }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('wraps the starting index and updates the visible image through controls', () => {
    const onClose = jest.fn();
    const onIndexChange = jest.fn();
    const { container } = render(
      <ImageView
        images={images}
        initialIndex={5}
        onClose={onClose}
        onIndexChange={onIndexChange}
        ariaLabel="Profile image viewer"
        labels={labels}
      />
    );

    expect(
      screen.getByRole('dialog', { name: 'Profile image viewer' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Second profile image' })
    ).toHaveAttribute('src', images[1]?.src);
    expect(screen.getByText('Second caption')).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: labels.next }));

    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    expect(screen.getByRole('img', { name: 'Image 1 of 2' })).toHaveAttribute(
      'src',
      images[0]?.src
    );
    expect(screen.getByText('Image 1 of 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: labels.previous }));

    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(
      screen.getByRole('img', { name: 'Second profile image' })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('dialog', { name: 'Profile image viewer' })
    );
    expect(onClose).toHaveBeenCalledTimes(1);

    const content = container.querySelector('.who-image-view-content');
    if (!(content instanceof HTMLDivElement)) {
      throw new Error('Expected image viewer content container to render.');
    }

    fireEvent.click(content);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('supports keyboard navigation and restores body overflow on unmount', () => {
    const onClose = jest.fn();
    const { unmount } = render(
      <ImageView
        images={images}
        initialIndex={0}
        onClose={onClose}
        labels={labels}
      />
    );

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(
      screen.getByRole('img', { name: 'Second profile image' })
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(
      screen.getByRole('img', { name: 'Image 1 of 2' })
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(
      screen.getByRole('img', { name: 'Second profile image' })
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowUp' });
    expect(
      screen.getByRole('img', { name: 'Image 1 of 2' })
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    expect(document.body.style.overflow).toBe('scroll');
  });
});
