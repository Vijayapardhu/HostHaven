import prisma from '../../config/database';
import { cacheService } from '../../services/cache.service';
import { logger } from '../../utils/logger.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { Prisma } from '@prisma/client';

export class TemplesService {
  async getTemples(filters: {
    page?: number;
    limit?: number;
    deity?: string;
    templeType?: string;
    state?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TempleDetailsWhereInput = {};

    if (filters.deity) {
      where.deity = { contains: filters.deity, mode: 'insensitive' };
    }

    if (filters.templeType) {
      where.templeType = filters.templeType;
    }

    if (filters.state) {
      where.property = {
        state: { equals: filters.state, mode: 'insensitive' },
        status: 'ACTIVE',
      };
    }

    const [temples, total] = await Promise.all([
      prisma.templeDetails.findMany({
        where,
        skip,
        take: limit,
        orderBy: { deity: 'asc' },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              slug: true,
              address: true,
              city: true,
              state: true,
              images: true,
              basePrice: true,
              rating: true,
              reviewCount: true,
            },
          },
        },
      }),
      prisma.templeDetails.count({ where }),
    ]);

    return {
      temples: temples.map(this.sanitizeTemple),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const cacheKey = `temple:${id}`;
    const cached = await cacheService.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const temple = await prisma.templeDetails.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            rooms: {
              where: { isActive: true },
            },
            reviews: {
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                user: {
                  select: { id: true, name: true, avatarUrl: true },
                },
              },
            },
            vendor: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
      },
    });

    if (!temple) {
      const error = new Error('Temple details not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const result = this.sanitizeTemple(temple);
    
    await cacheService.set(cacheKey, result, cacheService.getTTL().PROPERTY_DETAIL);

    return result;
  }

  async getByProperty(propertyId: string) {
    const temple = await prisma.templeDetails.findUnique({
      where: { propertyId },
    });

    if (!temple) {
      const error = new Error('Temple details not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return this.sanitizeTemple(temple);
  }

  async create(data: {
    propertyId: string;
    deity: string;
    templeType?: string;
    builtYear?: string;
    architecture?: string;
    darshanTimings: any[];
    aartiTimings?: any[];
    specialEvents?: any[];
    dressCode?: string;
    entryFee?: any[];
    photography?: boolean;
    bestTimeToVisit?: string;
    festivals?: any[];
  }) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property || property.type !== 'TEMPLE') {
      const error = new Error('Property not found or is not a temple');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const existing = await prisma.templeDetails.findUnique({
      where: { propertyId: data.propertyId },
    });

    if (existing) {
      const error = new Error('Temple details already exist for this property');
      (error as any).code = ERROR_CODES.RESOURCE_CONFLICT;
      throw error;
    }

    const temple = await prisma.templeDetails.create({
      data: {
        propertyId: data.propertyId,
        deity: data.deity,
        templeType: data.templeType,
        builtYear: data.builtYear,
        architecture: data.architecture,
        darshanTimings: data.darshanTimings,
        aartiTimings: data.aartiTimings || [],
        specialEvents: data.specialEvents || [],
        dressCode: data.dressCode,
        entryFee: data.entryFee || [],
        photography: data.photography ?? true,
        bestTimeToVisit: data.bestTimeToVisit,
        festivals: data.festivals || [],
      },
    });

    await cacheService.del(cacheService.keys.property(data.propertyId));

    logger.info({ templeId: temple.id }, 'Temple details created');

    return this.sanitizeTemple(temple);
  }

  async update(id: string, data: Partial<{
    deity: string;
    templeType: string;
    builtYear: string;
    architecture: string;
    darshanTimings: any[];
    aartiTimings: any[];
    specialEvents: any[];
    dressCode: string;
    entryFee: any[];
    photography: boolean;
    bestTimeToVisit: string;
    festivals: any[];
  }>) {
    const temple = await prisma.templeDetails.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!temple) {
      const error = new Error('Temple details not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.templeDetails.update({
      where: { id },
      data,
    });

    await cacheService.del(cacheService.keys.property(temple.propertyId));
    await cacheService.del(`temple:${id}`);

    logger.info({ templeId: id }, 'Temple details updated');

    return this.sanitizeTemple(updated);
  }

  async delete(id: string) {
    const temple = await prisma.templeDetails.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!temple) {
      const error = new Error('Temple details not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    await prisma.property.update({
      where: { id: temple.propertyId },
      data: { isDeleted: true, deletedAt: new Date(), status: 'INACTIVE' },
    });

    await cacheService.del(cacheService.keys.property(temple.propertyId));
    await cacheService.del(`temple:${id}`);

    logger.info({ templeId: id }, 'Temple details deleted');

    return { message: 'Temple details deleted successfully' };
  }

  async getUpcomingEvents(templeId: string, days: number = 30) {
    const temple = await prisma.templeDetails.findUnique({
      where: { id: templeId },
      include: { property: true },
    });

    if (!temple) {
      const error = new Error('Temple details not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const upcomingSpecialEvents = (temple.specialEvents as any[]).filter((event: any) => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= endDate;
    });

    const upcomingFestivals = (temple.festivals as any[]).filter((festival: any) => {
      const festivalDate = new Date(festival.date);
      return festivalDate >= now && festivalDate <= endDate;
    });

    return {
      specialEvents: upcomingSpecialEvents,
      festivals: upcomingFestivals,
    };
  }

  private sanitizeTemple(temple: any) {
    return {
      id: temple.id,
      propertyId: temple.propertyId,
      property: temple.property,
      deity: temple.deity,
      templeType: temple.templeType,
      builtYear: temple.builtYear,
      architecture: temple.architecture,
      darshanTimings: temple.darshanTimings,
      aartiTimings: temple.aartiTimings,
      specialEvents: temple.specialEvents,
      dressCode: temple.dressCode,
      entryFee: temple.entryFee,
      photography: temple.photography,
      bestTimeToVisit: temple.bestTimeToVisit,
      festivals: temple.festivals,
      createdAt: temple.createdAt,
      updatedAt: temple.updatedAt,
    };
  }
}

export const templesService = new TemplesService();
export default templesService;
