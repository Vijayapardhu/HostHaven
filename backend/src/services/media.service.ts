import prisma from "../config/database";
import { logger } from "../utils/logger.util";

type MediaItem = string | { url?: string | null } | null | undefined;

const toUrl = (item: MediaItem): string | null => {
  if (!item) return null;
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof item.url === "string") {
    const trimmed = item.url.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
};

const normalizeUrls = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return Array.from(
    new Set(items.map((item) => toUrl(item as MediaItem)).filter(Boolean) as string[]),
  );
};

const inferType = (url: string, fallback: "image" | "video"): string => {
  const lowered = url.toLowerCase();
  if (lowered.endsWith(".mp4") || lowered.endsWith(".mov") || lowered.endsWith(".webm")) {
    return "video";
  }
  if (lowered.endsWith(".jpg") || lowered.endsWith(".jpeg") || lowered.endsWith(".png") || lowered.endsWith(".webp")) {
    return "image";
  }
  return fallback;
};

export class MediaService {
  async syncEntityMedia(
    entityType: string,
    entityId: string,
    items: unknown,
    fallbackType: "image" | "video" = "image",
  ) {
    const urls = normalizeUrls(items);
    const current = await prisma.media.findMany({
      where: { entityType, entityId },
      select: { id: true, url: true },
    });

    const targetSet = new Set(urls);
    const toDelete = current.filter((record) => !targetSet.has(record.url));
    if (toDelete.length > 0) {
      await prisma.media.deleteMany({
        where: { id: { in: toDelete.map((record) => record.id) } },
      });
    }

    const existingUrls = new Set(current.map((record) => record.url));
    const toCreate = urls.filter((url) => !existingUrls.has(url));
    if (toCreate.length > 0) {
      await prisma.media.createMany({
        data: toCreate.map((url) => ({
          url,
          type: inferType(url, fallbackType),
          entityType,
          entityId,
        })),
      });
    }

    logger.debug(
      { entityType, entityId, created: toCreate.length, deleted: toDelete.length },
      "Entity media synchronized",
    );
  }
}

export const mediaService = new MediaService();
export default mediaService;
