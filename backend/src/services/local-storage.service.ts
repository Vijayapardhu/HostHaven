import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger.util';

/**
 * Primary media storage: the VPS filesystem, served from /uploads/* by the
 * API process (see app.ts). Replaces Cloudinary/R2 as the default provider —
 * those remain only as legacy fallbacks while historical URLs still point at
 * them.
 *
 * Keys look like `hosthaven/properties/<uuid>.<ext>` and every path is
 * resolved and verified to stay inside the upload root, so a crafted key can
 * never read or delete outside it.
 */

const UPLOAD_ROOT = path.resolve(config.storage.uploadDir);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
};

const extensionFor = (filename?: string, contentType?: string): string => {
  const fromName = filename ? path.extname(filename).slice(1).toLowerCase() : '';
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  return (contentType && EXTENSION_BY_MIME[contentType]) || 'bin';
};

/** Resolves a stored key to an absolute path, refusing anything that escapes the root. */
const resolveInsideRoot = (key: string): string => {
  const resolved = path.resolve(UPLOAD_ROOT, key);
  if (resolved !== UPLOAD_ROOT && !resolved.startsWith(UPLOAD_ROOT + path.sep)) {
    throw new Error('Storage key resolves outside the upload directory');
  }
  return resolved;
};

export const localStorageService = {
  async upload(
    fileBuffer: Buffer,
    options: { folder: string; filename?: string; contentType?: string },
  ) {
    const extension = extensionFor(options.filename, options.contentType);
    // The stored name is a fresh UUID: user-supplied filenames never reach the
    // filesystem, which sidesteps traversal and collision issues entirely.
    const key = `${options.folder}/${randomUUID()}.${extension}`;
    const absolutePath = resolveInsideRoot(key);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, fileBuffer);

    logger.info({ key, bytes: fileBuffer.length }, 'File stored locally');

    return {
      url: `${config.app.appUrl}/uploads/${key}`,
      key,
      format: extension,
      bytes: fileBuffer.length,
      provider: 'local' as const,
    };
  },

  async delete(key: string) {
    const absolutePath = resolveInsideRoot(key);
    try {
      await fs.unlink(absolutePath);
      logger.info({ key }, 'Local file deleted');
      return true;
    } catch (error: any) {
      if (error?.code === 'ENOENT') return false;
      throw error;
    }
  },

  async exists(key: string) {
    try {
      await fs.access(resolveInsideRoot(key));
      return true;
    } catch {
      return false;
    }
  },
};

export default localStorageService;
