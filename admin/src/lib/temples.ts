import api from "./api";

export interface Temple {
  id: string;
  name: string;
  slug: string;
  city: string;
  fullAddress: string;
  landmark?: string;
  description: string;
  shortDesc?: string;
  latitude?: number;
  longitude?: number;
  deityName?: string;
  templeType?: string;
  builtYear?: string;
  founder?: string;
  mythologicalSignificance?: string;
  historicalSignificance?: string;
  architectureStyle?: string;
  uniqueFeatures?: string;
  sacredNearby?: string;
  associatedLegends?: string;
  darshanTimings?: any[];
  morningAarti?: string;
  afternoonAarti?: string;
  eveningAarti?: string;
  specialSevas?: string;
  festivalSpecificTimings?: string;
  generalEntryFee?: string;
  specialDarshanFee?: string;
  vipDarshanFee?: string;
  parkingAvailable?: boolean;
  wheelchairAccessible?: boolean;
  cloakroomAvailable?: boolean;
  restroomsAvailable?: boolean;
  drinkingWaterAvailable?: boolean;
  prasadamCounterAvailable?: boolean;
  photographyAllowed?: boolean;
  mobileRestrictions?: string;
  dressCodeMen?: string;
  dressCodeWomen?: string;
  securityNotes?: string;
  majorFestivals?: string;
  festivalDates?: string;
  annualBrahmotsavam?: string;
  rathotsavamDetails?: string;
  crowdExpectationLevel?: string;
  specialPoojas?: string;
  specialDecorationDays?: string;
  bestMonths?: string;
  bestTimeOfDay?: string;
  peakCrowdDays?: string;
  avoidDays?: string;
  weatherConditions?: string;
  nearbyTemples?: string;
  nearbyBeachesOrHills?: string;
  nearbyRestaurants?: string;
  nearbyHotels?: string;
  distanceRailwayStation?: string;
  distanceBusStand?: string;
  distanceAirport?: string;
  images?: any[];
  videos?: any[];
  virtualTourUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  searchKeywords?: string;
  canonicalUrl?: string;
  openGraphImage?: string;
  structuredDataJsonLd?: string;
  devoteeTips?: string;
  thingsToCarry?: string;
  thingsNotAllowed?: string;
  idealVisitDuration?: string;
  suggestedItinerary?: string;
  localFoodRecommendations?: string;
  faqs?: any;
  emergencyContact?: string;
  templeOfficePhone?: string;
  lostAndFoundDesk?: string;
  medicalFacilityNearby?: string;
  policeStationNearby?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTempleRequest {
  name: string;
  slug: string;
  city: string;
  fullAddress?: string;
  landmark?: string;
  description?: string;
  shortDesc?: string;
  latitude?: number;
  longitude?: number;
  deityName?: string;
  templeType?: string;
  builtYear?: string;
  founder?: string;
  mythologicalSignificance?: string;
  historicalSignificance?: string;
  architectureStyle?: string;
  uniqueFeatures?: string;
  sacredNearby?: string;
  associatedLegends?: string;
  darshanTimings?: any[];
  morningAarti?: string;
  afternoonAarti?: string;
  eveningAarti?: string;
  specialSevas?: string;
  festivalSpecificTimings?: string;
  generalEntryFee?: string;
  specialDarshanFee?: string;
  vipDarshanFee?: string;
  parkingAvailable?: boolean;
  wheelchairAccessible?: boolean;
  cloakroomAvailable?: boolean;
  restroomsAvailable?: boolean;
  drinkingWaterAvailable?: boolean;
  prasadamCounterAvailable?: boolean;
  photographyAllowed?: boolean;
  mobileRestrictions?: string;
  dressCodeMen?: string;
  dressCodeWomen?: string;
  securityNotes?: string;
  majorFestivals?: string;
  festivalDates?: string;
  annualBrahmotsavam?: string;
  rathotsavamDetails?: string;
  crowdExpectationLevel?: string;
  specialPoojas?: string;
  specialDecorationDays?: string;
  bestMonths?: string;
  bestTimeOfDay?: string;
  peakCrowdDays?: string;
  avoidDays?: string;
  weatherConditions?: string;
  nearbyTemples?: string;
  nearbyBeachesOrHills?: string;
  nearbyRestaurants?: string;
  nearbyHotels?: string;
  distanceRailwayStation?: string;
  distanceBusStand?: string;
  distanceAirport?: string;
  images?: any[];
  videos?: any[];
  virtualTourUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  searchKeywords?: string;
  canonicalUrl?: string;
  openGraphImage?: string;
  structuredDataJsonLd?: string;
  devoteeTips?: string;
  thingsToCarry?: string;
  thingsNotAllowed?: string;
  idealVisitDuration?: string;
  suggestedItinerary?: string;
  localFoodRecommendations?: string;
  faqs?: any;
  emergencyContact?: string;
  templeOfficePhone?: string;
  lostAndFoundDesk?: string;
  medicalFacilityNearby?: string;
  policeStationNearby?: string;
  active?: boolean;
}

const mapTemple = (temple: any): Temple => {
  return {
    id: temple.id,
    name: temple.name,
    slug: temple.slug,
    city: temple.city,
    fullAddress: temple.fullAddress || "",
    landmark: temple.landmark,
    description: temple.description || "",
    shortDesc: temple.shortDesc,
    latitude: temple.latitude,
    longitude: temple.longitude,
    deityName: temple.deityName,
    templeType: temple.templeType,
    builtYear: temple.builtYear,
    founder: temple.founder,
    mythologicalSignificance: temple.mythologicalSignificance,
    historicalSignificance: temple.historicalSignificance,
    architectureStyle: temple.architectureStyle,
    uniqueFeatures: temple.uniqueFeatures,
    sacredNearby: temple.sacredNearby,
    associatedLegends: temple.associatedLegends,
    darshanTimings: temple.darshanTimings,
    morningAarti: temple.morningAarti,
    afternoonAarti: temple.afternoonAarti,
    eveningAarti: temple.eveningAarti,
    specialSevas: temple.specialSevas,
    festivalSpecificTimings: temple.festivalSpecificTimings,
    generalEntryFee: temple.generalEntryFee,
    specialDarshanFee: temple.specialDarshanFee,
    vipDarshanFee: temple.vipDarshanFee,
    parkingAvailable: temple.parkingAvailable,
    wheelchairAccessible: temple.wheelchairAccessible,
    cloakroomAvailable: temple.cloakroomAvailable,
    restroomsAvailable: temple.restroomsAvailable,
    drinkingWaterAvailable: temple.drinkingWaterAvailable,
    prasadamCounterAvailable: temple.prasadamCounterAvailable,
    photographyAllowed: temple.photographyAllowed,
    mobileRestrictions: temple.mobileRestrictions,
    dressCodeMen: temple.dressCodeMen,
    dressCodeWomen: temple.dressCodeWomen,
    securityNotes: temple.securityNotes,
    majorFestivals: temple.majorFestivals,
    festivalDates: temple.festivalDates,
    annualBrahmotsavam: temple.annualBrahmotsavam,
    rathotsavamDetails: temple.rathotsavamDetails,
    crowdExpectationLevel: temple.crowdExpectationLevel,
    specialPoojas: temple.specialPoojas,
    specialDecorationDays: temple.specialDecorationDays,
    bestMonths: temple.bestMonths,
    bestTimeOfDay: temple.bestTimeOfDay,
    peakCrowdDays: temple.peakCrowdDays,
    avoidDays: temple.avoidDays,
    weatherConditions: temple.weatherConditions,
    nearbyTemples: temple.nearbyTemples,
    nearbyBeachesOrHills: temple.nearbyBeachesOrHills,
    nearbyRestaurants: temple.nearbyRestaurants,
    nearbyHotels: temple.nearbyHotels,
    distanceRailwayStation: temple.distanceRailwayStation,
    distanceBusStand: temple.distanceBusStand,
    distanceAirport: temple.distanceAirport,
    images: temple.images || [],
    videos: temple.videos || [],
    virtualTourUrl: temple.virtualTourUrl,
    metaTitle: temple.metaTitle,
    metaDescription: temple.metaDescription,
    searchKeywords: temple.searchKeywords,
    canonicalUrl: temple.canonicalUrl,
    openGraphImage: temple.openGraphImage,
    structuredDataJsonLd: temple.structuredDataJsonLd,
    devoteeTips: temple.devoteeTips,
    thingsToCarry: temple.thingsToCarry,
    thingsNotAllowed: temple.thingsNotAllowed,
    idealVisitDuration: temple.idealVisitDuration,
    suggestedItinerary: temple.suggestedItinerary,
    localFoodRecommendations: temple.localFoodRecommendations,
    faqs: temple.faqs,
    emergencyContact: temple.emergencyContact,
    templeOfficePhone: temple.templeOfficePhone,
    lostAndFoundDesk: temple.lostAndFoundDesk,
    medicalFacilityNearby: temple.medicalFacilityNearby,
    policeStationNearby: temple.policeStationNearby,
    active: temple.active ?? true,
    createdAt: temple.createdAt,
    updatedAt: temple.updatedAt,
  };
};

const normalizeList = (payload: any) => {
  const data = payload?.data ?? payload?.temples ?? [];
  const meta = payload?.meta ?? payload?.pagination;
  return {
    data: Array.isArray(data) ? data.map(mapTemple) : [],
    pagination: meta
      ? {
          total: meta.total ?? 0,
          page: meta.page ?? 1,
          limit: meta.limit ?? 10,
          totalPages: meta.totalPages ?? meta.pages ?? 1,
        }
      : { total: 0, page: 1, limit: 10, totalPages: 1 },
  };
};

export const templesService = {
  getTemples: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    active?: boolean;
  }) => {
    const response = await api.get("/v1/temples", { params });
    return normalizeList(response.data);
  },

  getTempleById: async (id: string) => {
    const response = await api.get(`/v1/temples/${id}`);
    const payload = response.data?.data ?? response.data;
    return mapTemple(payload);
  },

  createTemple: async (data: CreateTempleRequest) => {
    const response = await api.post("/v1/temples", data);
    return mapTemple(response.data.data ?? response.data);
  },

  updateTemple: async (id: string, data: Partial<CreateTempleRequest>) => {
    const response = await api.put(`/v1/temples/${id}`, data);
    return mapTemple(response.data.data ?? response.data);
  },

  deleteTemple: async (id: string) => {
    const response = await api.delete(`/v1/temples/${id}`);
    return response.data?.data ?? response.data;
  },

  activateTemple: async (id: string) => {
    const response = await api.patch(`/v1/temples/${id}/activate`);
    return response.data?.data ?? response.data;
  },

  deactivateTemple: async (id: string) => {
    const response = await api.patch(`/v1/temples/${id}/deactivate`);
    return response.data?.data ?? response.data;
  },
};
