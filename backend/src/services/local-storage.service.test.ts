import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Point the service at a throwaway directory before it is imported.
const TEST_ROOT = path.join(os.tmpdir(), `hh-uploads-test-${process.pid}`);
process.env.UPLOAD_DIR = TEST_ROOT;

jest.mock('../utils/logger.util', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { localStorageService } = require('./local-storage.service');

describe('localStorageService', () => {
  afterAll(async () => {
    await fs.rm(TEST_ROOT, { recursive: true, force: true });
  });

  it('stores a file under the folder with a UUID name and correct extension', async () => {
    const result = await localStorageService.upload(Buffer.from('image-bytes'), {
      folder: 'hosthaven/properties',
      filename: 'photo.JPG',
      contentType: 'image/jpeg',
    });

    expect(result.provider).toBe('local');
    expect(result.key).toMatch(
      /^hosthaven\/properties\/[0-9a-f-]{36}\.jpg$/,
    );
    expect(result.url).toContain(`/uploads/${result.key}`);

    const onDisk = await fs.readFile(path.join(TEST_ROOT, result.key));
    expect(onDisk.toString()).toBe('image-bytes');
  });

  it('derives the extension from the content type when the filename is unsafe', async () => {
    const result = await localStorageService.upload(Buffer.from('x'), {
      folder: 'hosthaven',
      filename: '../../etc/passwd',
      contentType: 'image/png',
    });

    // The user-supplied name never reaches the filesystem.
    expect(result.key).toMatch(/^hosthaven\/[0-9a-f-]{36}\.png$/);
  });

  it('refuses to delete outside the upload root', async () => {
    await expect(
      localStorageService.delete('../outside-secret.txt'),
    ).rejects.toThrow('outside the upload directory');
  });

  it('deletes stored files and reports missing ones as false', async () => {
    const stored = await localStorageService.upload(Buffer.from('bye'), {
      folder: 'hosthaven',
      contentType: 'image/webp',
    });

    await expect(localStorageService.delete(stored.key)).resolves.toBe(true);
    await expect(localStorageService.delete(stored.key)).resolves.toBe(false);
    await expect(localStorageService.exists(stored.key)).resolves.toBe(false);
  });
});
