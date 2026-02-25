import { FastifyRequest, FastifyReply } from 'fastify';
import { cloudinaryService } from '../../services/cloudinary.service';
import { r2StorageService } from '../../services/r2.service';
import { config } from '../../config';
import { sendSuccess, sendError } from '../../utils/response.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { logger } from '../../utils/logger.util';
import { FileUpload } from '../../types';

// Determine which storage service to use
const useR2 = (): boolean => {
  return !!(config.r2.accountId && config.r2.accessKeyId && config.r2.bucketName);
};

export const UploadsController = {
  async uploadSingle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const file = (request as any).file as FileUpload | undefined;
      
      if (!file) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'No file provided', 400);
      }

      const query = request.query as { folder?: string; resourceType?: string };
      const folder = query.folder || 'hosthaven';
      
      // Use R2 if configured, otherwise fallback to Cloudinary
      if (useR2()) {
        const contentType = file.mimetype || 'application/octet-stream';
        const result = await r2StorageService.upload(file.data, {
          folder,
          filename: file.filename,
          contentType,
        });

        return sendSuccess(reply, {
          url: result.url,
          key: result.key,
          format: result.format,
          bytes: result.bytes,
        }, 201);
      } else {
        const resourceType = query.resourceType || 'image';
        const result = await cloudinaryService.uploadImage(file.data, {
          folder,
          resourceType: resourceType as any,
        });

        return sendSuccess(reply, {
          url: result.url,
          publicId: result.publicId,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        }, 201);
      }
    } catch (error: any) {
      logger.error({ error }, 'Upload failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to upload file', 500);
    }
  },

  async uploadMultiple(request: FastifyRequest, reply: FastifyReply) {
    try {
      const files = (request as any).files as FileUpload[] | undefined;
      
      if (!files || files.length === 0) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'No files provided', 400);
      }

      const query = request.query as { folder?: string; resourceType?: string };
      const folder = query.folder || 'hosthaven';
      
      // Use R2 if configured, otherwise fallback to Cloudinary
      if (useR2()) {
        const contentTypes = files.map(f => f.mimetype || 'application/octet-stream');
        const filenames = files.map(f => f.filename);
        
        const results = await r2StorageService.uploadMultiple(files.map(f => f.data), {
          folder,
          filenames,
          contentTypes,
        });

        const formattedResults = results.map(result => ({
          url: result.url,
          key: result.key,
          format: result.format,
          bytes: result.bytes,
        }));

        return sendSuccess(reply, formattedResults, 201);
      } else {
        const resourceType = query.resourceType || 'image';

        const uploadPromises = files.map(async (file) => {
          const result = await cloudinaryService.uploadImage(file.data, {
            folder,
            resourceType: resourceType as any,
          });
          return {
            url: result.url,
            publicId: result.publicId,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          };
        });

        const results = await Promise.all(uploadPromises);

        return sendSuccess(reply, results, 201);
      }
    } catch (error: any) {
      logger.error({ error }, 'Multiple upload failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to upload files', 500);
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Support both R2 key and Cloudinary publicId
      const body = request.body as { publicId?: string; key?: string };
      const publicId = body.publicId;
      const key = body.key;

      if (!publicId && !key) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'publicId or key is required', 400);
      }

      if (useR2() && key) {
        await r2StorageService.delete(key);
      } else if (publicId) {
        await cloudinaryService.deleteImage(publicId);
      }

      return sendSuccess(reply, { message: 'File deleted successfully' });
    } catch (error: any) {
      logger.error({ error }, 'Delete file failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete file', 500);
    }
  },

  async deleteMultiple(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Support both R2 keys and Cloudinary publicIds
      const body = request.body as { publicIds?: string[]; keys?: string[] };
      const publicIds = body.publicIds;
      const keys = body.keys;

      if ((!publicIds || publicIds.length === 0) && (!keys || keys.length === 0)) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'publicIds or keys array is required', 400);
      }

      if (useR2() && keys && keys.length > 0) {
        await r2StorageService.deleteMultiple(keys);
      } else if (publicIds && publicIds.length > 0) {
        await cloudinaryService.deleteMultiple(publicIds);
      }

      return sendSuccess(reply, { message: 'Files deleted successfully' });
    } catch (error: any) {
      logger.error({ error }, 'Delete files failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete files', 500);
    }
  },
};
