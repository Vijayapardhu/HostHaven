import sharp from 'sharp';
import { logger } from '../utils/logger.util';

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
  format: 'jpeg',
};

export class ImageCompressService {
  async compress(
    buffer: Buffer,
    options: CompressOptions = {}
  ): Promise<Buffer> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        logger.warn('Could not get image metadata, returning original');
        return buffer;
      }

      let processedImage = image;

      if (metadata.width > opts.maxWidth || metadata.height > opts.maxHeight) {
        processedImage = processedImage.resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      processedImage = processedImage.grayscale(false);

      switch (opts.format) {
        case 'png':
          processedImage = processedImage.png({
            quality: opts.quality,
            compressionLevel: 9,
          });
          break;
        case 'webp':
          processedImage = processedImage.webp({
            quality: opts.quality,
          });
          break;
        case 'jpeg':
        default:
          processedImage = processedImage.jpeg({
            quality: opts.quality,
            progressive: true,
          });
          break;
      }

      return await processedImage.toBuffer();
    } catch (error) {
      logger.error({ error }, 'Image compression failed, returning original');
      return buffer;
    }
  }

  async compressToWebp(buffer: Buffer, options: CompressOptions = {}): Promise<Buffer> {
    return this.compress(buffer, { ...options, format: 'webp' });
  }

  async getMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    return sharp(buffer).metadata();
  }
}

export const imageCompressService = new ImageCompressService();
export default imageCompressService;
