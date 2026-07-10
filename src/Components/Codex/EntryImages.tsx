import { useState, type ChangeEvent } from 'react';
import {
  createImageReference,
  getUploadedAssetIdFromUri,
  isRemoteImageUri,
  MAX_IMAGES_PER_ENTRY,
  moveImageReference,
  removeImageReference,
  type WorldImageAsset,
  type WorldImageReference,
} from '@valgaron/core';
import { browserImageAssetRepository } from '../../Utlilities/imageAssetStorage';
import { prepareAndStoreImageFile } from '../../Utlilities/imageFilePreparation';
import { useResolvedImageUri } from '../../Utlilities/useResolvedImageUri';

function ImagePreview({ image }: { image: WorldImageReference }) {
  const resolved = useResolvedImageUri(image.uri);
  const [failed, setFailed] = useState(false);
  if (resolved.state === 'loading') {
    return <div className="vwb-image-placeholder">Loading image…</div>;
  }
  if (!resolved.src || failed) {
    return (
      <div className="vwb-image-placeholder" role="status">
        Image unavailable. The saved source was kept.
      </div>
    );
  }
  return (
    <img
      alt={image.decorative ? '' : image.altText}
      className="vwb-entry-image"
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
      src={resolved.src}
    />
  );
}

export function EntryImageGallery({
  images,
}: {
  images: readonly WorldImageReference[];
}) {
  if (images.length === 0) return null;
  return (
    <section className="vwb-entry-gallery" aria-label="Images">
      <h3>Images</h3>
      <div className="vwb-entry-gallery-grid">
        {images.map((image, index) => (
          <figure key={image.id}>
            <ImagePreview image={image} />
            <figcaption>
              {index === 0 ? <strong>Cover</strong> : null}
              {image.caption ? <span>{image.caption}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function EntryImagesEditor({
  images,
  onChange,
  stagedAssets = [],
}: {
  images: readonly WorldImageReference[];
  stagedAssets?: readonly WorldImageAsset[];
  onChange: (
    images: WorldImageReference[],
    stagedAssets: WorldImageAsset[]
  ) => void;
}) {
  const [webUri, setWebUri] = useState('');
  const [webAltText, setWebAltText] = useState('');
  const [message, setMessage] = useState('');
  const atLimit = images.length >= MAX_IMAGES_PER_ENTRY;

  const addWebImage = () => {
    const uri = webUri.trim();
    if (!isRemoteImageUri(uri)) {
      setMessage('Enter a complete HTTPS image URI.');
      return;
    }
    if (atLimit) {
      setMessage(`Entries can contain up to ${MAX_IMAGES_PER_ENTRY} images.`);
      return;
    }
    onChange(
      [
        ...images,
        createImageReference({
          uri,
          altText: webAltText.trim(),
          caption: '',
          decorative: false,
        }),
      ],
      [...stagedAssets]
    );
    setWebUri('');
    setWebAltText('');
    setMessage('Web image added. Its host is contacted only when it is shown.');
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (atLimit) {
      setMessage(`Entries can contain up to ${MAX_IMAGES_PER_ENTRY} images.`);
      return;
    }
    setMessage('Checking and saving image…');
    const result = await prepareAndStoreImageFile(file);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    onChange(
      [
        ...images,
        createImageReference({
          uri: result.asset.uri,
          altText: '',
          caption: '',
          decorative: false,
        }),
      ],
      [...stagedAssets, result.asset]
    );
    setMessage(
      'Uploaded image saved locally. Add alternative text before saving.'
    );
  };

  const updateImage = (
    imageId: string,
    update: (image: WorldImageReference) => WorldImageReference
  ) => {
    onChange(
      images.map((image) => (image.id === imageId ? update(image) : image)),
      [...stagedAssets]
    );
  };

  const removeImage = (image: WorldImageReference) => {
    const nextImages = removeImageReference(images, image.id);
    const stagedAsset = stagedAssets.find((asset) => asset.uri === image.uri);
    const nextAssets = stagedAssets.filter((asset) => asset.uri !== image.uri);
    onChange(nextImages, nextAssets);
    if (stagedAsset && !nextImages.some((item) => item.uri === image.uri)) {
      void browserImageAssetRepository.remove(stagedAsset.id);
    }
  };

  return (
    <section className="vwb-entry-images-editor" aria-label="Images">
      <div className="vwb-section-heading">
        <div>
          <p className="vwb-kicker">Entry media</p>
          <h3>Images</h3>
          <p>
            The first image is the cover. Web images remain links; uploads are
            included in ZIP backups.
          </p>
        </div>
        <span className="vwb-status-pill">
          {images.length} of {MAX_IMAGES_PER_ENTRY}
        </span>
      </div>

      <div className="vwb-form-grid">
        <label className="vwb-wide-field">
          Web image URI
          <input
            disabled={atLimit}
            onChange={(event) => setWebUri(event.target.value)}
            placeholder="https://example.com/map.png"
            type="url"
            value={webUri}
          />
          <small className="vwb-field-help">
            Showing this image contacts its third-party host. Remote bytes are
            not copied into ZIP backups.
          </small>
        </label>
        <label>
          Alternative text
          <input
            disabled={atLimit}
            onChange={(event) => setWebAltText(event.target.value)}
            value={webAltText}
          />
        </label>
        <div className="vwb-form-actions">
          <button
            className="vwb-secondary-button"
            disabled={atLimit || !webUri.trim()}
            onClick={addWebImage}
            type="button"
          >
            Add web image
          </button>
          <label className="vwb-secondary-button vwb-file-button">
            Upload image
            <input
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={atLimit}
              onChange={(event) => void uploadImage(event)}
              type="file"
            />
          </label>
        </div>
      </div>
      {message ? (
        <p className="vwb-inline-status" role="status">
          {message}
        </p>
      ) : null}

      {images.length > 0 ? (
        <div className="vwb-entry-image-list">
          {images.map((image, index) => (
            <article className="vwb-entry-image-row" key={image.id}>
              <div className="vwb-entry-image-thumbnail">
                <ImagePreview image={image} />
              </div>
              <div className="vwb-entry-image-fields">
                <strong>
                  {index === 0 ? 'Cover · ' : ''}
                  {getUploadedAssetIdFromUri(image.uri) ? 'Uploaded' : 'Web'}
                </strong>
                <label>
                  Alternative text
                  <input
                    disabled={image.decorative}
                    onChange={(event) =>
                      updateImage(image.id, (current) => ({
                        ...current,
                        altText: event.target.value,
                      }))
                    }
                    value={image.altText}
                  />
                </label>
                <label className="vwb-checkbox-field">
                  <input
                    checked={image.decorative}
                    onChange={(event) =>
                      updateImage(image.id, (current) => ({
                        ...current,
                        decorative: event.target.checked,
                        altText: event.target.checked ? '' : current.altText,
                      }))
                    }
                    type="checkbox"
                  />
                  Decorative image
                </label>
                <label>
                  Caption
                  <input
                    onChange={(event) =>
                      updateImage(image.id, (current) => ({
                        ...current,
                        caption: event.target.value,
                      }))
                    }
                    value={image.caption}
                  />
                </label>
              </div>
              <div className="vwb-entry-image-actions">
                <button
                  aria-label={`Move image ${index + 1} earlier`}
                  className="vwb-secondary-button"
                  disabled={index === 0}
                  onClick={() =>
                    onChange(moveImageReference(images, image.id, -1), [
                      ...stagedAssets,
                    ])
                  }
                  type="button"
                >
                  Move earlier
                </button>
                <button
                  aria-label={`Move image ${index + 1} later`}
                  className="vwb-secondary-button"
                  disabled={index === images.length - 1}
                  onClick={() =>
                    onChange(moveImageReference(images, image.id, 1), [
                      ...stagedAssets,
                    ])
                  }
                  type="button"
                >
                  Move later
                </button>
                <button
                  aria-label={`Remove image ${index + 1}`}
                  className="vwb-secondary-button vwb-danger-button"
                  onClick={() => removeImage(image)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
