import prisma from "../../config/database";
import { cacheService } from "../../services/cache.service";
import { mediaService } from "../../services/media.service";
import { logger } from "../../utils/logger.util";
import { ERROR_CODES } from "../../constants/error-codes";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";

export class TemplesService {
  async getTemples(filters: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    active?: boolean;
    deity?: string;
    templeType?: string;
    state?: string;
    includeInactive?: boolean;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TempleWhereInput = {};

    if (filters.active !== undefined) {
      where.active = filters.active;
    } else if (!filters.includeInactive) {
      where.active = true;
    }

    if (filters.city) {
      where.city = filters.city as any;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { deityName: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { fullAddress: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const cacheKey = cacheService.keys.propertyList(`temples:${JSON.stringify(filters)}`);
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const [temples, total] = await Promise.all([
      prisma.temple.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.temple.count({ where }),
    ]);

    const result = {
      data: temples,
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
    const cacheKey = `temple:${idOrSlug}`;
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    logger.info({ idOrSlug }, "Looking up temple by ID or slug");

    // Try by ID first, then by slug
    let temple = await prisma.temple.findUnique({
      where: { id: idOrSlug },
    });

    if (!temple) {
      logger.info({ idOrSlug }, "Temple not found by ID, trying slug");
      temple = await prisma.temple.findUnique({
        where: { slug: idOrSlug },
      });
    }

    if (!temple) {
      const error = new Error("Temple not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    logger.info({ templeId: temple.id, slug: temple.slug }, "Temple found");

    await cacheService.set(
      cacheKey,
      temple,
      cacheService.getTTL().PROPERTY_DETAIL,
    );

    return temple;
  }

  async getByProperty(propertyId: string) {
    const temple = await prisma.templeDetails.findUnique({
      where: { propertyId },
    });

    if (!temple) {
      const error = new Error("Temple details not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return temple;
  }

  async getBySlug(slug: string) {
    const cacheKey = `temple:slug:${slug}`;
    const cached = await cacheService.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const temple = await prisma.temple.findUnique({
      where: { slug },
    });

    if (!temple) {
      const error = new Error("Temple not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    await cacheService.set(
      cacheKey,
      temple,
      cacheService.getTTL().PROPERTY_DETAIL,
    );

    return temple;
  }

  async create(data: any) {
    // Check for slug conflict
    const existingSlug = await prisma.temple.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      // Append timestamp to slug to make it unique
      data.slug = `${data.slug}-${Date.now().toString(36)}`;
    }

    const temple = await prisma.temple.create({
      data: {
        name: data.name,
        slug: data.slug,
        city: data.city,
        fullAddress: data.fullAddress || "",
        landmark: data.landmark,
        description: data.description || "",
        shortDesc: data.shortDesc,
        latitude: data.latitude,
        longitude: data.longitude,
        deityName: data.deityName || "",
        templeType: data.templeType,
        builtYear: data.builtYear,
        founder: data.founder,
        mythologicalSignificance: data.mythologicalSignificance,
        historicalSignificance: data.historicalSignificance,
        architectureStyle: data.architectureStyle,
        uniqueFeatures: data.uniqueFeatures,
        sacredNearby: data.sacredNearby,
        associatedLegends: data.associatedLegends,
        darshanTimings: data.darshanTimings || [],
        morningAarti: data.morningAarti,
        afternoonAarti: data.afternoonAarti,
        eveningAarti: data.eveningAarti,
        specialSevas: data.specialSevas,
        festivalSpecificTimings: data.festivalSpecificTimings,
        generalEntryFee: data.generalEntryFee,
        specialDarshanFee: data.specialDarshanFee,
        vipDarshanFee: data.vipDarshanFee,
        parkingAvailable: data.parkingAvailable ?? false,
        wheelchairAccessible: data.wheelchairAccessible ?? false,
        cloakroomAvailable: data.cloakroomAvailable ?? false,
        restroomsAvailable: data.restroomsAvailable ?? false,
        drinkingWaterAvailable: data.drinkingWaterAvailable ?? false,
        prasadamCounterAvailable: data.prasadamCounterAvailable ?? false,
        photographyAllowed: data.photographyAllowed ?? true,
        mobileRestrictions: data.mobileRestrictions,
        dressCodeMen: data.dressCodeMen,
        dressCodeWomen: data.dressCodeWomen,
        securityNotes: data.securityNotes,
        majorFestivals: data.majorFestivals,
        festivalDates: data.festivalDates,
        annualBrahmotsavam: data.annualBrahmotsavam,
        rathotsavamDetails: data.rathotsavamDetails,
        crowdExpectationLevel: data.crowdExpectationLevel,
        specialPoojas: data.specialPoojas,
        specialDecorationDays: data.specialDecorationDays,
        bestMonths: data.bestMonths,
        bestTimeOfDay: data.bestTimeOfDay,
        peakCrowdDays: data.peakCrowdDays,
        avoidDays: data.avoidDays,
        weatherConditions: data.weatherConditions,
        nearbyTemples: data.nearbyTemples,
        nearbyBeachesOrHills: data.nearbyBeachesOrHills,
        nearbyRestaurants: data.nearbyRestaurants,
        nearbyHotels: data.nearbyHotels,
        distanceRailwayStation: data.distanceRailwayStation,
        distanceBusStand: data.distanceBusStand,
        distanceAirport: data.distanceAirport,
        images: data.images || [],
        videos: data.videos || [],
        virtualTourUrl: data.virtualTourUrl,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        searchKeywords: data.searchKeywords,
        canonicalUrl: data.canonicalUrl,
        openGraphImage: data.openGraphImage,
        structuredDataJsonLd: data.structuredDataJsonLd,
        devoteeTips: data.devoteeTips,
        thingsToCarry: data.thingsToCarry,
        thingsNotAllowed: data.thingsNotAllowed,
        idealVisitDuration: data.idealVisitDuration,
        suggestedItinerary: data.suggestedItinerary,
        localFoodRecommendations: data.localFoodRecommendations,
        faqs: data.faqs,
        emergencyContact: data.emergencyContact,
        templeOfficePhone: data.templeOfficePhone,
        lostAndFoundDesk: data.lostAndFoundDesk,
        medicalFacilityNearby: data.medicalFacilityNearby,
        policeStationNearby: data.policeStationNearby,
        active: data.active ?? true,
      },
    });

    await mediaService.syncEntityMedia("TEMPLE", temple.id, data.images || [], "image");
    if (data.videos !== undefined) {
      await mediaService.syncEntityMedia("TEMPLE", temple.id, data.videos, "video");
    }

    logger.info({ templeId: temple.id }, "Temple created");

    return temple;
  }

  private async getTempleByIdOrSlug(idOrSlug: string) {
    let temple = await prisma.temple.findUnique({
      where: { id: idOrSlug },
    });

    if (!temple) {
      temple = await prisma.temple.findUnique({
        where: { slug: idOrSlug },
      });
    }

    if (!temple) {
      const error = new Error("Temple not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return temple;
  }

  async update(idOrSlug: string, data: any) {
    const temple = await this.getTempleByIdOrSlug(idOrSlug);
    const templeId = temple.id;

    logger.info({ idOrSlug, data: JSON.stringify(data) }, "Updating temple with data");

    // Remove id and slug from update data to avoid conflicts
    const { id: _id, slug: _slug, ...updateData } = data;

    logger.info({ templeId, updateData: JSON.stringify(updateData) }, "Update data after filtering");

    const updated = await prisma.temple.update({
      where: { id: templeId },
      data: updateData,
    });

    logger.info({ templeId, updated: JSON.stringify(updated) }, "Temple updated successfully");

    if (data.images !== undefined) {
      await mediaService.syncEntityMedia("TEMPLE", templeId, data.images, "image");
    }
    if (data.videos !== undefined) {
      await mediaService.syncEntityMedia("TEMPLE", templeId, data.videos, "video");
    }

    await cacheService.del(`temple:${templeId}`);
    await cacheService.del(`temple:slug:${temple.slug}`);

    logger.info({ templeId }, "Temple updated");

    return updated;
  }

  async activate(idOrSlug: string) {
    const temple = await this.getTempleByIdOrSlug(idOrSlug);

    const updated = await prisma.temple.update({
      where: { id: temple.id },
      data: { active: true },
    });

    await cacheService.del(`temple:${temple.id}`);
    await cacheService.del(`temple:slug:${temple.slug}`);
    await cacheService.invalidate('temples:list:*');

    logger.info({ templeId: temple.id }, "Temple activated");

    return { id: updated.id, active: updated.active };
  }

  async deactivate(idOrSlug: string) {
    const temple = await this.getTempleByIdOrSlug(idOrSlug);

    const updated = await prisma.temple.update({
      where: { id: temple.id },
      data: { active: false },
    });

    await cacheService.del(`temple:${temple.id}`);
    await cacheService.del(`temple:slug:${temple.slug}`);
    await cacheService.invalidate('temples:list:*');

    logger.info({ templeId: temple.id }, "Temple deactivated");

    return { id: updated.id, active: updated.active };
  }

  async delete(idOrSlug: string) {
    const temple = await this.getTempleByIdOrSlug(idOrSlug);

    await prisma.temple.delete({
      where: { id: temple.id },
    });

    await cacheService.del(`temple:${temple.id}`);
    await cacheService.del(`temple:slug:${temple.slug}`);

    logger.info({ templeId: temple.id }, "Temple deleted");

    return { message: "Temple deleted successfully" };
  }

  async getUpcomingEvents(templeId: string, days: number = 30) {
    const temple = await prisma.temple.findUnique({
      where: { id: templeId },
    });

    if (!temple) {
      const error = new Error("Temple not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return {
      specialEvents: [],
      festivals: [],
    };
  }

  async exportAllTemples() {
    const temples = await prisma.temple.findMany({
      orderBy: { createdAt: "desc" },
    });

    const data = temples.map((t) => {
      const flat: any = {};
      const fields = [
        "id", "name", "slug", "city", "fullAddress", "landmark", "description", "shortDesc",
        "latitude", "longitude", "deityName", "templeType", "builtYear", "founder",
        "mythologicalSignificance", "historicalSignificance", "architectureStyle", "uniqueFeatures",
        "sacredNearby", "associatedLegends", "darshanTimings", "morningAarti", "afternoonAarti",
        "eveningAarti", "specialSevas", "festivalSpecificTimings", "generalEntryFee", "specialDarshanFee",
        "vipDarshanFee", "parkingAvailable", "wheelchairAccessible", "cloakroomAvailable",
        "restroomsAvailable", "drinkingWaterAvailable", "prasadamCounterAvailable", "photographyAllowed",
        "mobileRestrictions", "dressCodeMen", "dressCodeWomen", "securityNotes", "majorFestivals",
        "festivalDates", "annualBrahmotsavam", "rathotsavamDetails", "crowdExpectationLevel",
        "specialPoojas", "specialDecorationDays", "bestMonths", "bestTimeOfDay", "peakCrowdDays",
        "avoidDays", "weatherConditions", "nearbyTemples", "nearbyBeachesOrHills", "nearbyRestaurants",
        "nearbyHotels", "distanceRailwayStation", "distanceBusStand", "distanceAirport",
        "images", "videos", "virtualTourUrl", "metaTitle", "metaDescription", "searchKeywords",
        "canonicalUrl", "openGraphImage", "structuredDataJsonLd", "devoteeTips", "thingsToCarry",
        "thingsNotAllowed", "idealVisitDuration", "suggestedItinerary", "localFoodRecommendations",
        "faqs", "emergencyContact", "templeOfficePhone", "lostAndFoundDesk", "medicalFacilityNearby",
        "policeStationNearby", "active", "createdAt", "updatedAt"
      ];
      
      for (const field of fields) {
        let value = (t as any)[field];
        if (field === "darshanTimings" || field === "images" || field === "videos" || field === "faqs") {
          value = JSON.stringify(value);
        } else if (field === "active") {
          value = value ? "TRUE" : "FALSE";
        } else if (field === "createdAt" || field === "updatedAt") {
          value = value ? value.toISOString() : "";
        }
        flat[field] = value;
      }
      return flat;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Temples");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }

  async importTemples(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

    const results = { created: 0, updated: 0, errors: [] as string[] };

    for (const row of rows) {
      try {
        const data: any = {
          name: row.name,
          slug: row.slug,
          city: row.city,
          fullAddress: row.fullAddress || "",
          landmark: row.landmark,
          description: row.description || "",
          shortDesc: row.shortDesc,
          latitude: row.latitude,
          longitude: row.longitude,
          deityName: row.deityName || "",
          templeType: row.templeType,
          builtYear: row.builtYear,
          founder: row.founder,
          mythologicalSignificance: row.mythologicalSignificance,
          historicalSignificance: row.historicalSignificance,
          architectureStyle: row.architectureStyle,
          uniqueFeatures: row.uniqueFeatures,
          sacredNearby: row.sacredNearby,
          associatedLegends: row.associatedLegends,
          darshanTimings: row.darshanTimings ? JSON.parse(row.darshanTimings) : [],
          morningAarti: row.morningAarti,
          afternoonAarti: row.afternoonAarti,
          eveningAarti: row.eveningAarti,
          specialSevas: row.specialSevas,
          festivalSpecificTimings: row.festivalSpecificTimings,
          generalEntryFee: row.generalEntryFee,
          specialDarshanFee: row.specialDarshanFee,
          vipDarshanFee: row.vipDarshanFee,
          parkingAvailable: row.parkingAvailable?.toUpperCase() === "TRUE",
          wheelchairAccessible: row.wheelchairAccessible?.toUpperCase() === "TRUE",
          cloakroomAvailable: row.cloakroomAvailable?.toUpperCase() === "TRUE",
          restroomsAvailable: row.restroomsAvailable?.toUpperCase() === "TRUE",
          drinkingWaterAvailable: row.drinkingWaterAvailable?.toUpperCase() === "TRUE",
          prasadamCounterAvailable: row.prasadamCounterAvailable?.toUpperCase() === "TRUE",
          photographyAllowed: row.photographyAllowed?.toUpperCase() !== "FALSE",
          mobileRestrictions: row.mobileRestrictions,
          dressCodeMen: row.dressCodeMen,
          dressCodeWomen: row.dressCodeWomen,
          securityNotes: row.securityNotes,
          majorFestivals: row.majorFestivals,
          festivalDates: row.festivalDates,
          annualBrahmotsavam: row.annualBrahmotsavam,
          rathotsavamDetails: row.rathotsavamDetails,
          crowdExpectationLevel: row.crowdExpectationLevel,
          specialPoojas: row.specialPoojas,
          specialDecorationDays: row.specialDecorationDays,
          bestMonths: row.bestMonths,
          bestTimeOfDay: row.bestTimeOfDay,
          peakCrowdDays: row.peakCrowdDays,
          avoidDays: row.avoidDays,
          weatherConditions: row.weatherConditions,
          nearbyTemples: row.nearbyTemples,
          nearbyBeachesOrHills: row.nearbyBeachesOrHills,
          nearbyRestaurants: row.nearbyRestaurants,
          nearbyHotels: row.nearbyHotels,
          distanceRailwayStation: row.distanceRailwayStation,
          distanceBusStand: row.distanceBusStand,
          distanceAirport: row.distanceAirport,
          images: row.images ? JSON.parse(row.images) : [],
          videos: row.videos ? JSON.parse(row.videos) : [],
          virtualTourUrl: row.virtualTourUrl,
          metaTitle: row.metaTitle,
          metaDescription: row.metaDescription,
          searchKeywords: row.searchKeywords,
          canonicalUrl: row.canonicalUrl,
          openGraphImage: row.openGraphImage,
          structuredDataJsonLd: row.structuredDataJsonLd,
          devoteeTips: row.devoteeTips,
          thingsToCarry: row.thingsToCarry,
          thingsNotAllowed: row.thingsNotAllowed,
          idealVisitDuration: row.idealVisitDuration,
          suggestedItinerary: row.suggestedItinerary,
          localFoodRecommendations: row.localFoodRecommendations,
          faqs: row.faqs ? JSON.parse(row.faqs) : null,
          emergencyContact: row.emergencyContact,
          templeOfficePhone: row.templeOfficePhone,
          lostAndFoundDesk: row.lostAndFoundDesk,
          medicalFacilityNearby: row.medicalFacilityNearby,
          policeStationNearby: row.policeStationNearby,
          active: row.active?.toUpperCase() !== "FALSE",
        };

        if (row.id) {
          const existing = await prisma.temple.findUnique({ where: { id: row.id } });
          if (existing) {
            await prisma.temple.update({ where: { id: row.id }, data });
            results.updated++;
            continue;
          }
        }

        const existingSlug = await prisma.temple.findUnique({ where: { slug: data.slug } });
        if (existingSlug) {
          data.slug = `${data.slug}-${Date.now().toString(36)}`;
        }

        await prisma.temple.create({ data });
        results.created++;
      } catch (err: any) {
        results.errors.push(`Row error: ${err.message}`);
      }
    }

    return results;
  }
}

export const templesService = new TemplesService();
export default templesService;
