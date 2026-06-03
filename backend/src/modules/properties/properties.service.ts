import prisma from '../../config/database';
import { cacheService } from '../../services/cache.service';
import { mediaService } from '../../services/media.service';
import { logger } from '../../utils/logger.util';
import { generateSlug } from '../../utils/crypto.util';
import { ERROR_CODES } from '../../constants/error-codes';
import { Prisma } from '@prisma/client';
import { getAmenityNamesFromJson, normalizeAmenityName, syncAmenityCatalog } from '../../utils/amenities.util';
import { getActiveCities } from '../../utils/cities.util';

export class PropertiesService {
  async getAll(filters: {
    page?: number;
    limit?: number;
    type?: string;
    city?: string;
    state?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    rating?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    lat?: number;
    lng?: number;
    radius?: number;
    vendorId?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // For public listing: only ACTIVE properties
    // For vendor/admin: can see their own properties including PENDING/DRAFT
    let statusFilter: string | string[] | undefined = 'ACTIVE';
    if (filters.vendorId) {
      // Vendor viewing their own properties - show all statuses
      statusFilter = undefined;
    }

    const where: Prisma.PropertyWhereInput = {
      status: statusFilter as any,
      isDeleted: false,
    };

    if (filters.vendorId) {
      where.vendorId = filters.vendorId;
      // If vendorId is provided, allow all statuses (ACTIVE, PENDING, DRAFT, etc.)
      delete where.status;
    }

    if (filters.type) {
      where.type = filters.type as any;
    }

    if (filters.city) {
      const requestedCity = filters.city.trim().toUpperCase();
      // Normalize common typo for Vetapalem
      const normalizedCity = requestedCity === 'VETAPALEM' ? 'VETLAPALEM' : requestedCity;

      // Only apply city filter if it exists in platform cities to avoid enum mismatch errors
try {
        const activeCities = await getActiveCities();
        if (activeCities.length > 0) {
          if (activeCities.includes(normalizedCity)) {
            where.city = normalizedCity as any;
          } else {
            logger.warn({ requestedCity, normalizedCity, activeCities }, 'Skipping city filter because it is not in active cities');
          }
        }
      } catch (err) {
        logger.warn({ err, requestedCity }, 'Failed to load active cities, skipping city filter');
      }
    }

    if (filters.state) {
      where.state = { equals: filters.state, mode: 'insensitive' };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.basePrice = {};
      if (filters.minPrice !== undefined) {
        where.basePrice.gte = new Prisma.Decimal(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        where.basePrice.lte = new Prisma.Decimal(filters.maxPrice);
      }
    }

    if (filters.amenities && filters.amenities.length > 0) {
      where.amenities = {
        array_contains: filters.amenities,
      } as any;
    }

    if (filters.rating) {
      where.rating = { gte: new Prisma.Decimal(filters.rating) };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.PropertyOrderByWithRelationInput = { createdAt: 'desc' };

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          orderBy = { basePrice: 'asc' };
          break;
        case 'price_desc':
          orderBy = { basePrice: 'desc' };
          break;
        case 'rating':
          orderBy = { rating: 'desc' };
          break;
        case 'popularity':
          orderBy = { bookingCount: 'desc' };
          break;
        default:
          orderBy = { createdAt: filters.sortOrder || 'desc' };
      }
    }

    const cacheKey = cacheService.keys.propertyList(JSON.stringify(filters));
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          rooms: {
            where: { isActive: true, isDeleted: false },
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
              pricePerNight: true,
              weekendPrice: true,
              capacity: true,
              extraBedCapacity: true,
              amenities: true,
              images: true,
              video: true,
              totalRooms: true,
              availableRooms: true,
              isActive: true,
            },
          },
          templeDetails: filters.type === 'TEMPLE',
        },
      }),
      prisma.property.count({ where }),
    ]);

    const result = {
      properties: properties.map(this.sanitizeProperty),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await cacheService.set(cacheKey, result, cacheService.getTTL().PROPERTY_LIST);

    return result;
  }

  async getById(idOrSlug: string) {
    const cacheKey = cacheService.keys.property(idOrSlug);
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    // Try by ID first, then by slug
    let property = await prisma.property.findFirst({
      where: { id: idOrSlug, isDeleted: false },
      include: {
        rooms: {
          where: { isActive: true, isDeleted: false },
        },
        templeDetails: true,
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
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!property) {
      property = await prisma.property.findFirst({
        where: { slug: idOrSlug, isDeleted: false },
        include: {
          rooms: {
            where: { isActive: true, isDeleted: false },
          },
          templeDetails: true,
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
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    }

    // If not found by ID, try by slug
    if (!property) {
      property = await prisma.property.findFirst({
        where: { slug: idOrSlug, isDeleted: false },
        include: {
          rooms: {
            where: { isActive: true, isDeleted: false },
          },
          templeDetails: true,
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
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    }

    if (!property) {
      const error = new Error('Property not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    await prisma.property.update({
      where: { id: property.id },
      data: { viewCount: { increment: 1 } },
    });

    const result = this.sanitizeProperty(property);

    await cacheService.set(cacheKey, result, cacheService.getTTL().PROPERTY_DETAIL);

    return result;
  }

  async create(data: {
    type: 'HOTEL' | 'HOME' | 'TEMPLE';
    name: string;
    description: string;
    shortDesc?: string;
    searchText?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
    images: any[];
    videos?: any[];
    virtualTourUrl?: string;
    amenities: string[];
    highlights?: string[];
    featureFlags?: Record<string, unknown>;
    basePrice: number;
    currency?: string;
    metaTitle?: string;
    metaDesc?: string;
    vendorId?: string;
  }) {
    const slug = generateSlug(data.name);
    const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

    // Set status based on whether it's a vendor creating the property
    // Vendor properties need admin approval before going live
    const propertyStatus = data.vendorId ? 'PENDING' : 'ACTIVE';

    const property = await prisma.property.create({
      data: {
        type: data.type as any,
        name: data.name,
        slug: uniqueSlug,
        description: data.description,
        shortDesc: data.shortDesc,
        searchText: data.searchText,
        address: data.address,
        city: data.city as any,
        state: data.state,
        pincode: data.pincode,
        latitude: data.latitude !== undefined ? new Prisma.Decimal(data.latitude) : null,
        longitude: data.longitude !== undefined ? new Prisma.Decimal(data.longitude) : null,
        images: data.images,
        videos: data.videos || [],
        virtualTourUrl: data.virtualTourUrl,
        amenities: data.amenities,
        highlights: data.highlights || [],
        featureFlags: this.toJsonValue(data.featureFlags),
        basePrice: new Prisma.Decimal(data.basePrice),
        currency: data.currency || 'INR',
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
        vendorId: data.vendorId,
        status: propertyStatus,
      },
    });

    // Send notification to admin for vendor property
    if (data.vendorId) {
      try {
        const vendor = await prisma.vendor.findUnique({
          where: { id: data.vendorId },
          include: { user: true }
        });
        
        await prisma.notification.create({
          data: {
            userId: data.vendorId,
            type: 'PROPERTY_SUBMITTED',
            title: 'New Property Submitted for Review',
            message: `${vendor?.businessName || vendor?.user?.name || 'A vendor'} submitted "${data.name}" for verification.`,
            isForAdmin: true,
          }
        });
        logger.info({ propertyId: property.id, vendorId: data.vendorId }, 'Admin notification created for property submission');
      } catch (notificationError) {
        logger.error({ notificationError }, 'Failed to create admin notification');
      }
    }

    await mediaService.syncEntityMedia('PROPERTY', property.id, data.images, 'image');
    if (data.videos !== undefined) {
      await mediaService.syncEntityMedia('PROPERTY', property.id, data.videos, 'video');
    }
    await syncAmenityCatalog(data.amenities);

    logger.info({ propertyId: property.id }, 'Property created');

    return this.sanitizeProperty(property);
  }

  private async getPropertyByIdOrSlug(idOrSlug: string) {
    let property = await prisma.property.findUnique({
      where: { id: idOrSlug },
    });

    if (!property) {
      property = await prisma.property.findUnique({
        where: { slug: idOrSlug },
      });
    }

    if (!property) {
      const error = new Error('Property not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return property;
  }

  async update(idOrSlug: string, data: Partial<{
    name: string;
    description: string;
    shortDesc: string;
    searchText: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    images: any[];
    videos: any[];
    virtualTourUrl: string;
    amenities: string[];
    highlights: string[];
    featureFlags: Record<string, unknown>;
    basePrice: number;
    currency: string;
    metaTitle: string;
    metaDesc: string;
    status: string;
    isFeatured: boolean;
  }>, vendorId?: string) {
    const property = await this.getPropertyByIdOrSlug(idOrSlug);
    const propertyId = property.id;

    if (vendorId && property.vendorId !== vendorId) {
      const error = new Error('Not authorized to update this property');
      (error as any).code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    const updateData: any = { ...data };

    if (data.featureFlags !== undefined) {
      updateData.featureFlags = this.toJsonValue(data.featureFlags);
    }
    if (data.basePrice !== undefined) {
      updateData.basePrice = new Prisma.Decimal(data.basePrice);
    }
    if (data.latitude !== undefined) {
      updateData.latitude = new Prisma.Decimal(data.latitude);
    }
    if (data.longitude !== undefined) {
      updateData.longitude = new Prisma.Decimal(data.longitude);
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
    });

    if (data.images !== undefined) {
      await mediaService.syncEntityMedia('PROPERTY', propertyId, data.images, 'image');
    }
    if (data.videos !== undefined) {
      await mediaService.syncEntityMedia('PROPERTY', propertyId, data.videos, 'video');
    }
    if (data.amenities !== undefined) {
      await syncAmenityCatalog(data.amenities);
    }

    await cacheService.del(cacheService.keys.property(propertyId));
    if (property.slug) {
      await cacheService.del(cacheService.keys.property(property.slug));
    }

    logger.info({ propertyId }, 'Property updated');

    return this.sanitizeProperty(updated);
  }

  async delete(idOrSlug: string, vendorId?: string) {
    const property = await this.getPropertyByIdOrSlug(idOrSlug);
    const propertyId = property.id;

    if (vendorId && property.vendorId !== vendorId) {
      const error = new Error('Not authorized to delete this property');
      (error as any).code = ERROR_CODES.FORBIDDEN;
      throw error;
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: { status: 'INACTIVE', isDeleted: true, deletedAt: new Date() },
    });

    await cacheService.del(cacheService.keys.property(propertyId));
    if (property.slug) {
      await cacheService.del(cacheService.keys.property(property.slug));
    }

    logger.info({ propertyId }, 'Property deleted');

    return { message: 'Property deleted successfully' };
  }

  async checkAvailability(propertyId: string, checkIn: Date, checkOut: Date, roomId?: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        rooms: roomId ? { where: { id: roomId } } : { where: { isActive: true } },
      },
    });

    if (!property) {
      const error = new Error('Property not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const stayDates: Date[] = [];
    const current = new Date(checkIn);
    while (current < checkOut) {
      stayDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const roomIds = property.rooms.map(r => r.id);
    const inventoryDays = await prisma.inventoryDay.findMany({
      where: {
        roomId: { in: roomIds },
        date: { in: stayDates },
      },
    });

    const overlappingBookings = await prisma.booking.findMany({
      where: {
        propertyId,
        roomId: { in: roomIds },
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          {
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
        ],
      },
      select: { roomId: true, checkInDate: true, checkOutDate: true },
    });

    const bookingsByRoom = new Map<string, number>();
    for (const booking of overlappingBookings) {
      if (!booking.roomId) continue;
      const current = bookingsByRoom.get(booking.roomId) || 0;
      bookingsByRoom.set(booking.roomId, current + 1);
    }

    const inventoryByRoom = new Map<string, number>();
    for (const day of inventoryDays) {
      const current = inventoryByRoom.get(day.roomId);
      if (current === undefined || day.availableRooms < current) {
        inventoryByRoom.set(day.roomId, day.availableRooms);
      }
    }

    const availableRooms = property.rooms
      .map((room) => {
        const inventoryAvailable = inventoryByRoom.get(room.id);
        const bookingsCount = bookingsByRoom.get(room.id) || 0;
        const totalStock = room.totalRooms;
        const fromInventory = inventoryAvailable !== undefined ? inventoryAvailable : totalStock;
        const fromBookings = totalStock - bookingsCount;
        const available = Math.min(fromInventory, fromBookings);
        return {
          ...room,
          availableRooms: Math.max(0, available),
          totalRooms: room.totalRooms,
        };
      })
      .filter((room) => room.availableRooms > 0);

    const totalAvailable = availableRooms.reduce((sum, r) => sum + r.availableRooms, 0);

    return {
      available: totalAvailable > 0,
      availableRooms: totalAvailable,
      totalRooms: property.rooms.reduce((sum, r) => sum + r.totalRooms, 0),
      rooms: availableRooms.map((room) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        pricePerNight: room.pricePerNight.toNumber(),
        capacity: room.capacity,
      })),
    };
  }

  async getFeatured(limit: number = 6) {
    const cacheKey = cacheService.keys.featuredProperties();
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const properties = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        isFeatured: true,
        isDeleted: false,
      },
      take: limit,
      orderBy: { rating: 'desc' },
    });

    const result = properties.map(this.sanitizeProperty);
    await cacheService.set(cacheKey, result, cacheService.getTTL().FEATURED_PROPERTIES);

    return result;
  }

  async getCityNames() {
    const cities = await prisma.platformCity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    
    if (cities.length > 0) {
      return cities.map(c => c.name);
    }
    
    return [];
  }

  async getAmenities() {
    const platformAmenities = await prisma.platformAmenity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { name: true },
    });

    if (platformAmenities.length > 0) {
      return platformAmenities.map((amenity) => amenity.name);
    }

    const [properties, rooms] = await Promise.all([
      prisma.property.findMany({ where: { isDeleted: false }, select: { amenities: true } }),
      prisma.room.findMany({ where: { isDeleted: false }, select: { amenities: true } }),
    ]);

    return Array.from(
      new Set(
        [...properties, ...rooms].flatMap((item) => getAmenityNamesFromJson(item.amenities)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }

  async createAmenity(name: string) {
    const normalizedName = normalizeAmenityName(name);
    const existing = await prisma.platformAmenity.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      if (!existing.isActive) {
        return await prisma.platformAmenity.update({
          where: { id: existing.id },
          data: { name: normalizedName, isActive: true },
        });
      }

      const error = new Error('Amenity already exists');
      (error as any).code = ERROR_CODES.RESOURCE_CONFLICT;
      throw error;
    }

    return await prisma.platformAmenity.create({ data: { name: normalizedName } });
  }

  async getCities() {
    const platformCities = await prisma.platformCity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { name: true },
    });

    if (platformCities.length > 0) {
      return platformCities.map((c) => ({
        city: c.name,
        state: 'Andhra Pradesh',
        count: 0,
      }));
    }

    return [];
  }

  async createCity(name: string) {
    const normalizedName = name.toUpperCase().trim();
    const existing = await prisma.platformCity.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      if (!existing.isActive) {
        return await prisma.platformCity.update({
          where: { id: existing.id },
          data: { name: normalizedName, isActive: true },
        });
      }

      const error = new Error('City already exists');
      (error as any).code = ERROR_CODES.RESOURCE_CONFLICT;
      throw error;
    }

    return await prisma.platformCity.create({ data: { name: normalizedName } });
  }

  async toggleCity(name: string, isActive: boolean) {
    const city = await prisma.platformCity.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (!city) {
      const error = new Error('City not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return await prisma.platformCity.update({
      where: { id: city.id },
      data: { isActive },
    });
  }

  async getAllCities() {
    return await prisma.platformCity.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getAllAmenities() {
    return await prisma.platformAmenity.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async toggleAmenity(name: string, isActive: boolean) {
    const amenity = await prisma.platformAmenity.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (!amenity) {
      const error = new Error('Amenity not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return await prisma.platformAmenity.update({
      where: { id: amenity.id },
      data: { isActive },
    });
  }

  async search(query: string, limit: number = 10) {
    const properties = await prisma.property.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });

    return properties.map(this.sanitizeProperty);
  }

  private toJsonValue(value?: Record<string, unknown>): Prisma.InputJsonValue | undefined {
    return value as Prisma.InputJsonValue | undefined;
  }

  private sanitizeProperty = (property: any) => {
    return {
      id: property.id,
      type: property.type,
      status: property.status,
      name: property.name,
      slug: property.slug,
      description: property.description,
      shortDesc: property.shortDesc,
      searchText: property.searchText,
      address: property.address,
      city: property.city,
      state: property.state,
      pincode: property.pincode,
      latitude: property.latitude?.toNumber?.() || property.latitude,
      longitude: property.longitude?.toNumber?.() || property.longitude,
      images: property.images,
      videos: property.videos,
      virtualTourUrl: property.virtualTourUrl,
      amenities: property.amenities,
      highlights: property.highlights,
      featureFlags: property.featureFlags,
      basePrice: property.basePrice?.toNumber?.() || property.basePrice,
      currency: property.currency,
      rating: property.rating?.toNumber?.() || property.rating,
      reviewCount: property.reviewCount,
      bookingCount: property.bookingCount,
      viewCount: property.viewCount,
      isFeatured: property.isFeatured,
      isVerified: property.isVerified,
      metaTitle: property.metaTitle,
      metaDesc: property.metaDesc,
      rooms: property.rooms?.map(this.sanitizeRoom),
      templeDetails: property.templeDetails,
      reviews: property.reviews,
      vendor: property.vendor,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  private sanitizeRoom = (room: any) => {
    return {
      id: room.id,
      name: room.name,
      description: room.description,
      type: room.type,
      capacity: room.capacity,
      extraBedCapacity: room.extraBedCapacity,
      pricePerNight: room.pricePerNight?.toNumber?.() || room.pricePerNight,
      weekendPrice: room.weekendPrice?.toNumber?.() || room.weekendPrice,
      amenities: room.amenities,
      images: room.images,
      video: room.video,
      totalRooms: room.totalRooms,
      availableRooms: room.availableRooms,
      isActive: room.isActive,
    };
  }
}

export const propertiesService = new PropertiesService();
export default propertiesService;
