import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, Button, Grid, GridItem, Input, Text } from '..';
import { formatTemplate } from '../../../Utlilities';

/**
 * Translation-driven strings for the reusable image uploader.
 */
export type ImageUploaderStringsType = {
  invalidFileTypeMessage: string;
  fileSizeLimitTemplate: string;
  previewAltTemplate: string;
  removeLabel: string;
};

/**
 * Props for reusable image uploader input.
 */
export type ImageUploaderProps = {
  value: string[];
  onChange: (nextImages: string[]) => void;
  label: string;
  errorMessage?: string;
  maxFiles?: number;
  maxFileSizeBytes?: number;
  accept?: string;
  id?: string;
  strings: ImageUploaderStringsType;
  previewRenderer?: (args: {
    value: string[];
    removeImage: (index: number) => void;
  }) => ReactNode;
};

/**
 * Create a user-facing file size label.
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

/**
 * Reusable image uploader with preview, validation, and remove support.
 */
const ImageUploader = ({
  value,
  onChange,
  label,
  errorMessage: externalErrorMessage,
  maxFiles = 6,
  maxFileSizeBytes = 5 * 1024 * 1024,
  accept = 'image/*',
  id = 'profile-image-uploader',
  strings,
  previewRenderer,
}: ImageUploaderProps) => {
  const [inputErrorMessage, setInputErrorMessage] = useState<string | null>(
    null
  );
  const generatedUrlsRef = useRef<Set<string>>(new Set());

  /**
   * Revoke generated object URLs on unmount.
   */
  useEffect(() => {
    return () => {
      generatedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      generatedUrlsRef.current.clear();
    };
  }, []);

  /**
   * Handle file input changes and append valid previews.
   */
  const handleFileSelection = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!('files' in e.target)) return;
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const nextUrls: string[] = [];
    let nextError: string | null = null;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        nextError = strings.invalidFileTypeMessage;
        continue;
      }
      if (file.size > maxFileSizeBytes) {
        nextError = formatTemplate(strings.fileSizeLimitTemplate, {
          size: formatFileSize(maxFileSizeBytes),
        });
        continue;
      }
      const objectUrl = URL.createObjectURL(file);
      generatedUrlsRef.current.add(objectUrl);
      nextUrls.push(objectUrl);
    }

    const combined = [...value, ...nextUrls].slice(0, maxFiles);
    onChange(combined);
    setInputErrorMessage(nextError);

    // Reset file input so selecting the same file still triggers change.
    e.target.value = '';
  };

  /**
   * Remove one image by index and cleanup generated URL if applicable.
   */
  const removeImage = (index: number) => {
    const target = value[index];
    if (target && generatedUrlsRef.current.has(target)) {
      URL.revokeObjectURL(target);
      generatedUrlsRef.current.delete(target);
    }
    const filtered = value.filter((_, currentIndex) => currentIndex !== index);
    onChange(filtered);
  };

  return (
    <Grid spacing={2}>
      <GridItem xs={12}>
        <Text>{label}</Text>
      </GridItem>
      <GridItem xs={12}>
        <Input
          id={id}
          type="file"
          inputProps={{ accept, multiple: true }}
          handleChange={handleFileSelection}
          label={label}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </GridItem>
      {inputErrorMessage || externalErrorMessage ? (
        <GridItem xs={12}>
          <Text role="alert">{inputErrorMessage || externalErrorMessage}</Text>
        </GridItem>
      ) : null}
      {value.length > 0 ? (
        <GridItem xs={12}>
          {previewRenderer ? (
            previewRenderer({ value, removeImage })
          ) : (
            <Grid spacing={2}>
              {value.map((src, index) => (
                <GridItem xs={12} sm={6} md={4} key={`${src}-${index}`}>
                  <Box>
                    <img
                      src={src}
                      alt={
                        formatTemplate(strings.previewAltTemplate, {
                          index: index + 1,
                          label,
                        }) || label
                      }
                      style={{
                        width: '100%',
                        maxHeight: '220px',
                        objectFit: 'cover',
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => removeImage(index)}
                      sx={{ marginTop: '8px' }}
                    >
                      {strings.removeLabel}
                    </Button>
                  </Box>
                </GridItem>
              ))}
            </Grid>
          )}
        </GridItem>
      ) : null}
    </Grid>
  );
};

export default ImageUploader;
