import { FastifyRequest, FastifyReply } from "fastify";
import { cloudinaryService } from "../../services/cloudinary.service";
import { r2StorageService } from "../../services/r2.service";
import { imageCompressService } from "../../services/image-compress.service";
import { config } from "../../config";
import { sendSuccess, sendError } from "../../utils/response.util";
import { ERROR_CODES } from "../../constants/error-codes";
import { logger } from "../../utils/logger.util";

const hasCloudinaryConfig = () =>
  Boolean(
    config.cloudinary.cloudName &&
      config.cloudinary.apiKey &&
      config.cloudinary.apiSecret,
  );

const hasR2Config = () =>
  Boolean(
    config.r2.accountId &&
      config.r2.accessKeyId &&
      config.r2.secretAccessKey &&
      config.r2.bucketName &&
      config.r2.publicUrl,
  );

const getPreferredProvider = (): "r2" | "cloudinary" => {
  if (hasR2Config()) return "r2";
  return "cloudinary";
};

const getFallbackProvider = (
  provider: "r2" | "cloudinary",
): "r2" | "cloudinary" | null => {
  if (provider === "r2" && hasCloudinaryConfig()) return "cloudinary";
  if (provider === "cloudinary" && hasR2Config()) return "r2";
  return null;
};

const uploadWithProvider = async (
  provider: "r2" | "cloudinary",
  fileBuffer: Buffer,
  options: {
    folder: string;
    filename?: string;
    contentType?: string;
    resourceType?: "image" | "video" | "raw" | "auto";
  },
) => {
  if (provider === "r2") {
    const result = await r2StorageService.upload(fileBuffer, {
      folder: options.folder,
      filename: options.filename,
      contentType: options.contentType,
    });

    return {
      url: result.url,
      key: result.key,
      format: result.format,
      bytes: result.bytes,
    };
  }

  const result = await cloudinaryService.uploadImage(fileBuffer, {
    folder: options.folder,
    resourceType: options.resourceType,
  });

  return {
    url: result.url,
    publicId: result.publicId,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
};

const uploadWithFallback = async (
  fileBuffer: Buffer,
  options: {
    folder: string;
    filename?: string;
    contentType?: string;
    resourceType?: "image" | "video" | "raw" | "auto";
  },
) => {
  const preferredProvider = getPreferredProvider();

  try {
    return await uploadWithProvider(preferredProvider, fileBuffer, options);
  } catch (error) {
    const fallbackProvider = getFallbackProvider(preferredProvider);

    logger.error(
      {
        error,
        preferredProvider,
        fallbackProvider,
        folder: options.folder,
        filename: options.filename,
      },
      "Primary upload provider failed",
    );

    if (!fallbackProvider) {
      throw error;
    }

    return uploadWithProvider(fallbackProvider, fileBuffer, options);
  }
};

const isImageMimeType = (mimetype: string) => 
  mimetype.startsWith('image/');

export const UploadsController = {
  async uploadSingle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await request.file();

      if (!data) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "No file provided",
          400,
        );
      }

      const query = request.query as { folder?: string; resourceType?: string; compress?: string };
      const folder = query.folder || "hosthaven";
      const shouldCompress = query.compress !== 'false';

      let fileBuffer = await data.toBuffer();

      if (shouldCompress && isImageMimeType(data.mimetype || '')) {
        try {
          fileBuffer = await imageCompressService.compress(fileBuffer);
        } catch (compressError) {
          logger.warn({ error: compressError }, 'Image compression failed, using original');
        }
      }

      const resourceType = (query.resourceType || "image") as
        | "image"
        | "video"
        | "raw"
        | "auto";
      const result = await uploadWithFallback(fileBuffer, {
        folder,
        filename: data.filename,
        contentType: data.mimetype || "application/octet-stream",
        resourceType,
      });

      return sendSuccess(reply, result, 201);
    } catch (error: any) {
      logger.error({ error, headers: request.headers }, "Upload failed");
      if (error?.statusCode === 406 || error?.code === "FST_INVALID_MULTIPART_CONTENT_TYPE") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Upload request must be sent as multipart/form-data",
          400,
        );
      }
      if (error?.statusCode === 413) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "File too large. Maximum file size is 500MB.",
          413,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        error?.message || "Failed to upload file",
        500,
      );
    }
  },

  async uploadMultiple(request: FastifyRequest, reply: FastifyReply) {
    try {
      const files = await request.files();

      const fileArray: any[] = [];
      for await (const file of files) {
        fileArray.push({
          filename: file.filename,
          mimetype: file.mimetype,
          data: await file.toBuffer(),
        });
      }

      if (fileArray.length === 0) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "No files provided",
          400,
        );
      }

      const query = request.query as { folder?: string; resourceType?: string; compress?: string };
      const folder = query.folder || "hosthaven";
      const shouldCompress = query.compress !== 'false';

      const resourceType = (query.resourceType || "image") as
        | "image"
        | "video"
        | "raw"
        | "auto";

      const results = await Promise.all(
        fileArray.map(async (file) => {
          let fileBuffer = file.data;
          
          if (shouldCompress && isImageMimeType(file.mimetype || '')) {
            try {
              fileBuffer = await imageCompressService.compress(fileBuffer);
            } catch (compressError) {
              logger.warn({ error: compressError }, 'Image compression failed, using original');
            }
          }
          
          return uploadWithFallback(fileBuffer, {
            folder,
            filename: file.filename,
            contentType: file.mimetype || "application/octet-stream",
            resourceType,
          });
        }),
      );

      return sendSuccess(reply, results, 201);
    } catch (error: any) {
      logger.error({ error }, "Multiple upload failed");
      if (error?.statusCode === 406 || error?.code === "FST_INVALID_MULTIPART_CONTENT_TYPE") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Upload request must be sent as multipart/form-data",
          400,
        );
      }
      if (error?.statusCode === 413) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "File too large. Maximum file size is 500MB.",
          413,
        );
      }
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        error?.message || "Failed to upload files",
        500,
      );
    }
  },

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as { publicId?: string; key?: string };
      const publicId = body.publicId;
      const key = body.key;

      if (!publicId && !key) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "publicId or key is required",
          400,
        );
      }

      if (getPreferredProvider() === "r2" && key) {
        await r2StorageService.delete(key);
      } else if (publicId) {
        await cloudinaryService.deleteImage(publicId);
      }

      return sendSuccess(reply, { message: "File deleted successfully" });
    } catch (error: any) {
      logger.error({ error }, "Delete file failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to delete file",
        500,
      );
    }
  },

  async deleteMultiple(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as { publicIds?: string[]; keys?: string[] };
      const publicIds = body.publicIds;
      const keys = body.keys;

      if (
        (!publicIds || publicIds.length === 0) &&
        (!keys || keys.length === 0)
      ) {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "publicIds or keys array is required",
          400,
        );
      }

      if (getPreferredProvider() === "r2" && keys && keys.length > 0) {
        await r2StorageService.deleteMultiple(keys);
      } else if (publicIds && publicIds.length > 0) {
        await cloudinaryService.deleteMultiple(publicIds);
      }

      return sendSuccess(reply, { message: "Files deleted successfully" });
    } catch (error: any) {
      logger.error({ error }, "Delete files failed");
      return sendError(
        reply,
        ERROR_CODES.INTERNAL_ERROR,
        "Failed to delete files",
        500,
      );
    }
  },
};
