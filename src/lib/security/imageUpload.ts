export type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';
export type SupportedImageExt = 'jpg' | 'png' | 'webp';

type ImageFormat = {
  mime: SupportedImageMime;
  ext: SupportedImageExt;
};

const DEFAULT_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

function detectImageFormat(buffer: Buffer): ImageFormat | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  return null;
}

type ValidationSuccess = {
  ok: true;
  buffer: Buffer;
  format: ImageFormat;
};

type ValidationFailure = {
  ok: false;
  error: string;
};

export type ImageUploadValidationResult = ValidationSuccess | ValidationFailure;

export async function validateImageUpload(
  file: File | null,
  options?: { maxSizeBytes?: number },
): Promise<ImageUploadValidationResult> {
  if (!file) {
    return { ok: false, error: 'No file uploaded.' };
  }

  const maxSizeBytes = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  if (file.size > maxSizeBytes) {
    return { ok: false, error: 'File is too large. Maximum size is 2MB.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const format = detectImageFormat(buffer);
  if (!format) {
    return { ok: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
  }

  return {
    ok: true,
    buffer,
    format,
  };
}
