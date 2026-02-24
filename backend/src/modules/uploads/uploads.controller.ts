import { FastifyRequest, FastifyReply } from 'fastify';
import { cloudinaryService } from '../../services/cloudinary.service';
import { sendSuccess, sendError } from '../../utils/response.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { logger } from '../../utils/logger.util';

interface FileParts {
  filename: string;
  data: Buffer;
}

declare module 'fastify' {
  interface FastifyRequest {
    files?: FileParts[];
    file?: FileParts;
  }
}

export const UploadsController = {
  async uploadSingle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const file = request.file;
      
      if (!file) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'No file provided', 400);
      }

      const folder = (request.query as any).folder || 'hosthaven';
      const resourceType = (request.query as any).resourceType || 'image';

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
    } catch (error: any) {
      logger.error({ error }, 'Upload failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to upload file', 500);
    }
  },

  async uploadMultiple(request: FastifyRequest, reply: FastifyReply) {
    try {
      const files = request.files;
      
      if (!files || files.length === 0) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'No files provided', 400);
      }

      const folder = (request.query as any).folder || 'hosthaven';
      const resourceType = (request.query as any).resourceType || 'image';

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
    } catch (error: any) {
      logger.error({ error }, 'Multiple upload failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to upload files', 500);
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { publicId } = request.body as { publicId: string };

      if (!publicId) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'publicId is required', 400);
      }

      await cloudinaryService.deleteImage(publicId);

      return sendSuccess(reply, { message: 'File deleted successfully' });
    } catch (error: any) {
      logger.error({ error }, 'Delete file failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete file', 500);
    }
  },

  async deleteMultiple(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { publicIds } = request.body as { publicIds: string[] };

      if (!publicIds || publicIds.length === 0) {
        return sendError(reply, ERROR_CODES.VALIDATION_ERROR, 'publicIds array is required', 400);
      }

      await cloudinaryService.deleteMultiple(publicIds);

      return sendSuccess(reply, { message: 'Files deleted successfully' });
    } catch (error: any) {
      logger.error({ error }, 'Delete files failed');
      return sendError(reply, ERROR_CODES.INTERNAL_ERROR, 'Failed to delete files', 500);
    }
  },
};
