import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import './ImageView.css';

/**
 * Metadata for a single image inside the gallery viewer.
 */
export type ImageViewImage = {
  src: string;
  alt?: string;
  caption?: string;
};

type ImageViewProps = {
  images: ImageViewImage[];
  initialIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  ariaLabel?: string;
  labels: {
    gallery: string;
    unavailable: string;
    close: string;
    previous: string;
    next: string;
  };
};

/**
 * Wraps an arbitrary index value so it always lands within the gallery bounds.
 */
const wrapIndex = (value: number, length: number): number => {
  if (length <= 0) {
    return 0;
  }
  const modulo = value % length;
  return modulo < 0 ? modulo + length : modulo;
};

/**
 * Modal image viewer that presents a focused gallery experience with keyboard support.
 */
function ImageView({
  images,
  initialIndex = 0,
  onClose,
  onIndexChange,
  ariaLabel,
  labels,
}: ImageViewProps) {
  const captionId = `${useId()}-image-caption`;
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const imageCount = images.length;
  const normalizedInitialIndex = wrapIndex(initialIndex, imageCount);
  const [currentIndex, setCurrentIndex] = useState(normalizedInitialIndex);
  const label = ariaLabel ?? labels.gallery;

  useEffect(() => {
    setCurrentIndex(normalizedInitialIndex);
  }, [normalizedInitialIndex]);

  useEffect(() => {
    backdropRef.current?.focus();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    setCurrentIndex((previous) => wrapIndex(previous, imageCount));
  }, [imageCount]);

  const handleIndexChange = useCallback(
    (nextIndex: number) => {
      if (imageCount === 0) {
        return;
      }
      const normalized = wrapIndex(nextIndex, imageCount);
      setCurrentIndex(normalized);
      onIndexChange?.(normalized);
    },
    [imageCount, onIndexChange]
  );

  const handleNext = useCallback(
    () => handleIndexChange(currentIndex + 1),
    [currentIndex, handleIndexChange]
  );

  const handlePrevious = useCallback(
    () => handleIndexChange(currentIndex - 1),
    [currentIndex, handleIndexChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        handleNext();
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        handlePrevious();
      }
    },
    [handleNext, handlePrevious, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  if (imageCount === 0) {
    return (
      <div
        ref={backdropRef}
        className="vwb-image-view-backdrop vwb-image-view-backdrop--empty"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-describedby={captionId}
        onClick={handleBackdropClick}
        tabIndex={-1}
      >
        <div
          className="vwb-image-view-content vwb-image-view-content--empty"
          onClick={stopPropagation}
        >
          <p
            id={captionId}
            className="vwb-image-view-caption"
            aria-live="polite"
          >
            {labels.unavailable}
          </p>
          <div className="vwb-image-view-controls vwb-image-view-controls--single">
            <button
              type="button"
              className="vwb-image-view-close-button"
              aria-label={labels.close}
              onClick={onClose}
            >
              {labels.close}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const positionLabel = `${currentIndex + 1} of ${imageCount}`;
  const displayCaption = currentImage?.caption ?? `Image ${positionLabel}`;
  const displayAlt = currentImage?.alt ?? displayCaption;

  return (
    <div
      ref={backdropRef}
      className="vwb-image-view-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-describedby={captionId}
      onClick={handleBackdropClick}
      tabIndex={-1}
    >
      <div className="vwb-image-view-content" onClick={stopPropagation}>
        <div className="vwb-image-view-frame">
          <img
            src={currentImage.src}
            alt={displayAlt}
            className="vwb-image-view-image"
          />
        </div>
        <p id={captionId} className="vwb-image-view-caption" aria-live="polite">
          {displayCaption}
        </p>
        <div className="vwb-image-view-footer">
          <div className="vwb-image-view-counter" aria-live="polite">
            {positionLabel}
          </div>
          <div className="vwb-image-view-controls">
            <button
              type="button"
              className="vwb-image-view-nav-button"
              onClick={handlePrevious}
              aria-label={labels.previous}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="vwb-image-view-close-button"
              onClick={onClose}
              aria-label={labels.close}
            >
              {labels.close}
            </button>
            <button
              type="button"
              className="vwb-image-view-nav-button"
              onClick={handleNext}
              aria-label={labels.next}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageView;
