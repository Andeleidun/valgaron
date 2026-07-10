import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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
import {
  getMobileImageAssetUri,
  mobileImageAssetRepository,
  pickAndStoreMobileImage,
} from '../storage/mobileImageAssetStorage';
import {
  ActionButton,
  ButtonRow,
  CheckboxField,
  Field,
  MutedText,
  StatusText,
} from './screenPrimitives';

function resolvedUri(image: WorldImageReference): string | null {
  if (isRemoteImageUri(image.uri)) return image.uri;
  const assetId = getUploadedAssetIdFromUri(image.uri);
  return assetId ? getMobileImageAssetUri(assetId) : null;
}

function MobileImagePreview({ image }: { image: WorldImageReference }) {
  const [failed, setFailed] = useState(false);
  const uri = resolvedUri(image);
  useEffect(() => setFailed(false), [image.uri]);
  if (!uri || failed) {
    return <MutedText>Image unavailable. The saved source was kept.</MutedText>;
  }
  return (
    <Image
      accessibilityLabel={image.decorative ? undefined : image.altText}
      accessible={!image.decorative}
      onError={() => setFailed(true)}
      resizeMode="contain"
      source={{ uri }}
      style={styles.image}
    />
  );
}

export function MobileEntryImageGallery({
  images,
}: {
  images: readonly WorldImageReference[];
}) {
  if (images.length === 0) return null;
  return (
    <View accessibilityLabel="Images" style={styles.gallery}>
      <Text accessibilityRole="header" style={styles.heading}>
        Images
      </Text>
      {images.map((image, index) => {
        return (
          <View key={image.id} style={styles.card}>
            <MobileImagePreview image={image} />
            {index === 0 ? <Text style={styles.cover}>Cover</Text> : null}
            {image.caption ? <MutedText>{image.caption}</MutedText> : null}
          </View>
        );
      })}
    </View>
  );
}

export function MobileEntryImagesEditor({
  images,
  stagedAssets = [],
  onChange,
}: {
  images: readonly WorldImageReference[];
  stagedAssets?: readonly WorldImageAsset[];
  onChange: (
    images: WorldImageReference[],
    stagedAssets: WorldImageAsset[]
  ) => void;
}) {
  const [webUri, setWebUri] = useState('');
  const [webAlt, setWebAlt] = useState('');
  const [message, setMessage] = useState('');
  const atLimit = images.length >= MAX_IMAGES_PER_ENTRY;

  function addWebImage() {
    const uri = webUri.trim();
    if (!isRemoteImageUri(uri)) {
      setMessage('Enter a complete HTTPS image URI.');
      return;
    }
    onChange(
      [
        ...images,
        createImageReference({
          uri,
          altText: webAlt.trim(),
          caption: '',
          decorative: false,
        }),
      ],
      [...stagedAssets]
    );
    setWebUri('');
    setWebAlt('');
    setMessage(
      'Web image added. Its host is contacted when the image is shown.'
    );
  }

  async function uploadImage() {
    setMessage('Checking and copying image…');
    const result = await pickAndStoreMobileImage();
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
      'Uploaded image copied locally. Add alternative text before saving.'
    );
  }

  function updateImage(
    id: string,
    update: (image: WorldImageReference) => WorldImageReference
  ) {
    onChange(
      images.map((image) => (image.id === id ? update(image) : image)),
      [...stagedAssets]
    );
  }

  function removeImage(image: WorldImageReference) {
    const nextImages = removeImageReference(images, image.id);
    const staged = stagedAssets.find((asset) => asset.uri === image.uri);
    onChange(
      nextImages,
      stagedAssets.filter((asset) => asset.uri !== image.uri)
    );
    if (staged && !nextImages.some((item) => item.uri === image.uri)) {
      void mobileImageAssetRepository.remove(staged.id);
    }
  }

  return (
    <View accessibilityLabel="Images editor" style={styles.editor}>
      <Text accessibilityRole="header" style={styles.heading}>
        Images
      </Text>
      <MutedText>
        The first image is the cover. Web images remain links; uploads are
        included in ZIP backups.
      </MutedText>
      <Field
        autoCapitalize="none"
        autoCorrect={false}
        label="Web image URI"
        onChangeText={setWebUri}
        placeholder="https://example.com/map.png"
        value={webUri}
      />
      <Field label="Alternative text" onChangeText={setWebAlt} value={webAlt} />
      <ButtonRow>
        <ActionButton
          disabled={atLimit || !webUri.trim()}
          label="Add web image"
          onPress={addWebImage}
        />
        <ActionButton
          disabled={atLimit}
          label="Upload image"
          onPress={() => void uploadImage()}
        />
      </ButtonRow>
      <MutedText>
        {images.length} of {MAX_IMAGES_PER_ENTRY} images
      </MutedText>
      {message ? <StatusText>{message}</StatusText> : null}
      {images.map((image, index) => {
        return (
          <View key={image.id} style={styles.card}>
            <MobileImagePreview image={image} />
            <Text style={styles.cover}>
              {index === 0 ? 'Cover · ' : ''}
              {getUploadedAssetIdFromUri(image.uri) ? 'Uploaded' : 'Web'}
            </Text>
            <Field
              editable={!image.decorative}
              label="Alternative text"
              onChangeText={(value) =>
                updateImage(image.id, (current) => ({
                  ...current,
                  altText: value,
                }))
              }
              value={image.altText}
            />
            <CheckboxField
              checked={image.decorative}
              label="Decorative image"
              onChange={(decorative) =>
                updateImage(image.id, (current) => ({
                  ...current,
                  decorative,
                  altText: decorative ? '' : current.altText,
                }))
              }
            />
            <Field
              label="Caption"
              onChangeText={(value) =>
                updateImage(image.id, (current) => ({
                  ...current,
                  caption: value,
                }))
              }
              value={image.caption}
            />
            <ButtonRow>
              <ActionButton
                disabled={index === 0}
                label="Move earlier"
                onPress={() =>
                  onChange(moveImageReference(images, image.id, -1), [
                    ...stagedAssets,
                  ])
                }
              />
              <ActionButton
                disabled={index === images.length - 1}
                label="Move later"
                onPress={() =>
                  onChange(moveImageReference(images, image.id, 1), [
                    ...stagedAssets,
                  ])
                }
              />
              <ActionButton
                label="Remove"
                tone="danger"
                onPress={() => removeImage(image)}
              />
            </ButtonRow>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  editor: { gap: 12 },
  gallery: { gap: 10 },
  heading: { fontSize: 18, fontWeight: '700' },
  card: {
    borderWidth: 1,
    borderColor: '#c8c0b4',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee9e1',
    borderRadius: 8,
  },
  cover: { fontWeight: '700' },
});
