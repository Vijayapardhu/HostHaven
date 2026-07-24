import { FastifyRequest, FastifyReply } from "fastify";
import { cloudinaryService } from "../../services/cloudinary.service";
import { r2StorageService } from "../../services/r2.service";
import { localStorageService } from "../../services/local-storage.service";
import {
  uploadQuerySchema,
  deleteFileSchema,
  deleteFilesSchema,
} from "./uploads.schema";
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

type StorageProvider = "local" | "r2" | "cloudinary";

// Media is stored on the VPS filesystem. The cloud providers remain only as a
// legacy fallback while historical URLs still point at them — new uploads
// never go there unless the local disk write itself fails.
const getPreferredProvider = (): StorageProvider => "local";

const getLegacyFallbackProvider = (): "r2" | "cloudinary" | null => {
  if (hasR2Config()) return "r2";
  if (hasCloudinaryConfig()) return "cloudinary";
  return null;
};

// Destination folders are an allowlist, not free text: it previously came
// straight off the query string, letting any authenticated caller write into
// the operational folders the admin panel reads from.
const SHARED_UPLOAD_FOLDERS = [
  "hosthaven",
  "hosthaven/avatars",
  "hosthaven/properties",
  "hosthaven/properties/videos",
  "hosthaven/services",
  "hosthaven/temples/images",
  "hosthaven/temples/videos",
  "hosthaven/vendors/logo",
  "hosthaven/vendors/passport",
  "rooms",
] as const;

const ADMIN_ONLY_UPLOAD_FOLDERS = ["payouts", "notifications"] as const;

const DEFAULT_UPLOAD_FOLDER = "hosthaven";

/**
 * Resolves the destination folder for an upload, or null if the caller may not
 * write there. Falls back to the default folder when none is supplied.
 */
const resolveUploadFolder = (
  requested: string | undefined,
  role: string | undefined,
): string | null => {
  if (!requested) return DEFAULT_UPLOAD_FOLDER;

  if ((SHARED_UPLOAD_FOLDERS as readonly string[]).includes(requested)) {
    return requested;
  }

  if (
    role === "ADMIN" &&
    (ADMIN_ONLY_UPLOAD_FOLDERS as readonly string[]).includes(requested)
  ) {
    return requested;
  }

  return null;
};

const uploadWithProvider = async (
  provider: StorageProvider,
  fileBuffer: Buffer,
  options: {
    folder: string;
    filename?: string;
    contentType?: string;
    resourceType?: "image" | "video" | "raw" | "auto";
  },
) => {
  if (provider === "local") {
    return localStorageService.upload(fileBuffer, {
      folder: options.folder,
      filename: options.filename,
      contentType: options.contentType,
    });
  }

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
    // A local disk write should not fail; if it does (disk full, permissions),
    // fall back to a configured legacy cloud provider rather than losing the
    // upload entirely.
    const fallbackProvider = getLegacyFallbackProvider();

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

      const query = uploadQuerySchema.parse(request.query);
      const folder = resolveUploadFolder(query.folder, request.user?.role);
      if (!folder) {
        return sendError(
          reply,
          ERROR_CODES.FORBIDDEN,
          "Uploads to this folder are not permitted",
          403,
        );
      }
      const shouldCompress = query.compress !== 'false';

      let fileBuffer = await data.toBuffer();

      if (shouldCompress && isImageMimeType(data.mimetype || '')) {
        try {
          fileBuffer = await imageCompressService.compress(fileBuffer);
        } catch (compressError) {
          logger.warn({ error: compressError }, 'Image compression failed, using original');
        }
      }

      // Already narrowed by the schema — no cast needed.
      const resourceType = query.resourceType;
      const result = await uploadWithFallback(fileBuffer, {
        folder,
        filename: data.filename,
        contentType: data.mimetype || "application/octet-stream",
        resourceType,
      });

      return sendSuccess(reply, result, 201);
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid upload parameters",
          400,
        );
      }
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

      const query = uploadQuerySchema.parse(request.query);
      const folder = resolveUploadFolder(query.folder, request.user?.role);
      if (!folder) {
        return sendError(
          reply,
          ERROR_CODES.FORBIDDEN,
          "Uploads to this folder are not permitted",
          403,
        );
      }
      const shouldCompress = query.compress !== 'false';

      // Already narrowed by the schema — no cast needed.
      const resourceType = query.resourceType;

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
      if (error?.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid upload parameters",
          400,
        );
      }
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
      const { publicId, key } = deleteFileSchema.parse(request.body ?? {});

      // Keys refer to local files first; anything not found locally is a
      // legacy cloud object.
      if (key) {
        const removedLocally = await localStorageService.delete(key);
        if (!removedLocally && hasR2Config()) {
          await r2StorageService.delete(key);
        }
      } else if (publicId) {
        await cloudinaryService.deleteImage(publicId);
      }

      return sendSuccess(reply, { message: "File deleted successfully" });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "publicId or key is required",
          400,
        );
      }
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
      const { publicIds, keys } = deleteFilesSchema.parse(request.body ?? {});

      if (keys && keys.length > 0) {
        const leftovers: string[] = [];
        for (const key of keys) {
          const removedLocally = await localStorageService.delete(key);
          if (!removedLocally) leftovers.push(key);
        }
        if (leftovers.length > 0 && hasR2Config()) {
          await r2StorageService.deleteMultiple(leftovers);
        }
      } else if (publicIds && publicIds.length > 0) {
        await cloudinaryService.deleteMultiple(publicIds);
      }

      return sendSuccess(reply, { message: "Files deleted successfully" });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return sendError(
          reply,
          ERROR_CODES.VALIDATION_ERROR,
          "publicIds or keys array is required",
          400,
        );
      }
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
