import prisma from "../../config/database";
import { logger } from "../../utils/logger.util";
import { ERROR_CODES } from "../../constants/error-codes";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import Razorpay from "razorpay";
import { config } from "../../config";
import type { PlatformSettingsInput } from "./admin-settings.schema";
import { auditLogger } from "../../lib/auditLogger";
import { syncAmenityCatalog } from '../../utils/amenities.util';
import { hashPassword } from '../../utils/hash.util';

let financeRazorpayClient: Razorpay | null = null;

const getFinanceRazorpayClient = () => {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    const error = new Error("Razorpay credentials are not configured");
    (error as any).code = ERROR_CODES.PAYMENT_FAILED;
    throw error;
  }

  if (!financeRazorpayClient) {
    financeRazorpayClient = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }

  return financeRazorpayClient;
};

const maskAccountNumber = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${"*".repeat(Math.max(0, trimmed.length - 4))}${trimmed.slice(-4)}`;
};

const maskIfscCode = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
};

const maskUpiId = (value?: string | null) => {
  if (!value) return null;
  const [handle, provider] = value.split("@");
  if (!provider) return "***";
  if (handle.length <= 2) return `**@${provider}`;
  return `${handle.slice(0, 2)}***@${provider}`;
};

const normalizePayoutStatus = (value?: string | null) => {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "APPROVED" || normalized === "PAID" || normalized === "REJECTED" || normalized === "PENDING") {
    return normalized;
  }
  if (normalized === "COMPLETED") return "PAID";
  if (normalized === "FAILED") return "REJECTED";
  return "PENDING";
};

const isPayoutTerminal = (status: string) => status === "PAID" || status === "REJECTED";

const DEFAULT_HOMEPAGE_CONFIG = {
  pageBackground: "hsl(var(--background))",
  sections: {
    banner: { isVisible: true, order: 0 },
    hero: { isVisible: true, order: 1 },
    features: { isVisible: true, order: 2 },
    destinations: { isVisible: true, order: 3 },
    recommendations: { isVisible: true, order: 4 },
    temples: { isVisible: true, order: 5 },
    services: { isVisible: true, order: 6 },
    becomePartner: { isVisible: true, order: 7 },
  },
  bannerSlides: [
    {
      id: "1",
      title: "Planning a Weekend\nGetaway?",
      subtitle: "Discover Premium Hotels",
      tags: "· Luxury · Comfort · Service",
      ctaText: "Explore Hotels",
      ctaLink: "/hotels",
      imageUrl: "",
      isActive: true,
    },
    {
      id: "2",
      title: "Looking for a\nCozy Stay?",
      subtitle: "Find Perfect Homes",
      tags: "· Spacious · Homely · Affordable",
      ctaText: "Browse Homes",
      ctaLink: "/homes",
      imageUrl: "",
      isActive: true,
    },
    {
      id: "3",
      title: "Planning a Weekend\nDeviation?",
      subtitle: "Discover Sacred Temples",
      tags: "· Yaganti · Mahanandi · Ahobilam",
      ctaText: "Know the route",
      ctaLink: "/deviation-temples",
      imageUrl: "",
      isActive: true,
    },
  ],
  destinations: [
    {
      id: "1",
      name: "Nandyala",
      imageUrl: "",
      link: "/hotels?destination=nandyala",
      isActive: true,
    },
    {
      id: "2",
      name: "Vijayawada",
      imageUrl: "",
      link: "/hotels?destination=vijayawada",
      isActive: true,
    },
    {
      id: "3",
      name: "Vetapalem",
      imageUrl: "",
      link: "/hotels?destination=vetapalem",
      isActive: true,
    },
  ],
  featureCards: [
    {
      id: "1",
      icon: "clock",
      title: "24 Hour Check-In",
      description: "Instant access to your stay, anytime",
      badge: "Fast Resolution",
      isActive: true,
    },
    {
      id: "2",
      icon: "settings",
      title: "Customizable Rooms",
      description: "Tailor your stay to your needs",
      badge: "",
      link: "/contact",
      isActive: true,
    },
    {
      id: "3",
      icon: "refresh",
      title: "Instant Refund",
      description: "Fast and hassle-free refunds",
      badge: "59 Second Response",
      isActive: true,
    },
  ],
  serviceCards: [
    {
      id: "1",
      icon: "car",
      title: "Car Rental",
      description:
        "Explore Andhra Pradesh with our reliable car rental service",
      link: "/services#car-rental",
      isActive: true,
    },
    {
      id: "2",
      icon: "bike",
      title: "Bike Rental",
      description: "Two-wheelers for quick and easy local travel",
      link: "/services#bike-rental",
      isActive: true,
    },
    {
      id: "3",
      icon: "wrench",
      title: "Car Services",
      description: "Professional car maintenance and repair services",
      link: "/services#car-services",
      isActive: true,
    },
  ],
  temples: [
    {
      id: "1",
      name: "Kanaka Durga Temple",
      location: "Vijayawada",
      imageUrl: "",
      link: "/temples/kanaka-durga",
      isActive: true,
    },
    {
      id: "2",
      name: "Mahanandi Temple",
      location: "Nandyala",
      imageUrl: "",
      link: "/temples/mahanandi",
      isActive: true,
    },
    {
      id: "3",
      name: "Sri Venkateswara Temple",
      location: "Tirupati",
      imageUrl: "",
      link: "/temples/tirumala",
      isActive: true,
    },
  ],
  partnerSection: {
    title: "Are you a property owner?",
    subtitle: "List your property on HostHaven and start earning today",
    ctaText: "Become a Partner",
    ctaLink: "/vendor/signup",
  },
};

type CmsAudience = "user" | "vendor";

type FeatureFlagRecord = {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
};

type AdvancedSettings = {
  booking: {
    autoConfirmBookings: boolean;
    maxAdvanceBookingDays: number;
    cancellationWindowHours: number;
    allowInstantRefunds: boolean;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    indexable: boolean;
    canonicalBaseUrl?: string;
  };
  social: {
    facebookUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    xUrl?: string;
  };
  contact: {
    supportEmail: string;
    supportPhone: string;
    supportAddress: string;
    supportHours: string;
    supportCompanyName: string;
  };
  tax?: {
    enabled: boolean;
    percent: number;
  };
};

type CmsPageRecord = {
  id: string;
  title: string;
  slug: string;
  audience: CmsAudience;
  summary?: string;
  content: string;
  coverImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  booking: {
    autoConfirmBookings: false,
    maxAdvanceBookingDays: 120,
    cancellationWindowHours: 24,
    allowInstantRefunds: false,
  },
  seo: {
    metaTitle: "HostHaven",
    metaDescription:
      "Book trusted hotels, homes, and travel experiences with HostHaven.",
    indexable: true,
  },
  social: {},
  contact: {
    supportEmail: "support@hosthaven.com",
    supportPhone: "+91 1800 123 4567",
    supportAddress: "Vijayawada, Andhra Pradesh, India",
    supportHours: "24/7 Customer Support",
    supportCompanyName: "HostHaven Travels Pvt. Ltd.",
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSectionConfigRecord = (
  value: unknown,
): value is Record<string, { isVisible?: boolean; order?: number }> =>
  isRecord(value);

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toFeatureFlagRecord = (value: unknown): FeatureFlagRecord | null => {
  if (!isRecord(value)) return null;
  const id = typeof value.id === "string" && value.id.trim().length > 0
    ? value.id
    : randomUUID();
  const name =
    typeof value.name === "string" && value.name.trim().length > 0
      ? value.name.trim()
      : "Feature";
  const description =
    typeof value.description === "string" ? value.description : "";
  return {
    id,
    name,
    description,
    isEnabled: Boolean(value.isEnabled),
  };
};

const coerceBoundedNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(numeric)));
};

const mergeAdvancedSettings = (value: unknown): AdvancedSettings => {
  const bookingSource =
    isRecord(value) && isRecord(value.booking) ? value.booking : {};
  const seoSource = isRecord(value) && isRecord(value.seo) ? value.seo : {};
  const socialSource =
    isRecord(value) && isRecord(value.social) ? value.social : {};
  const contactSource =
    isRecord(value) && isRecord(value.contact) ? value.contact : {};

  return {
    booking: {
      autoConfirmBookings:
        typeof bookingSource.autoConfirmBookings === "boolean"
          ? bookingSource.autoConfirmBookings
          : DEFAULT_ADVANCED_SETTINGS.booking.autoConfirmBookings,
      maxAdvanceBookingDays: coerceBoundedNumber(
        bookingSource.maxAdvanceBookingDays,
        DEFAULT_ADVANCED_SETTINGS.booking.maxAdvanceBookingDays,
        1,
        365,
      ),
      cancellationWindowHours: coerceBoundedNumber(
        bookingSource.cancellationWindowHours,
        DEFAULT_ADVANCED_SETTINGS.booking.cancellationWindowHours,
        1,
        720,
      ),
      allowInstantRefunds:
        typeof bookingSource.allowInstantRefunds === "boolean"
          ? bookingSource.allowInstantRefunds
          : DEFAULT_ADVANCED_SETTINGS.booking.allowInstantRefunds,
    },
    seo: {
      metaTitle:
        typeof seoSource.metaTitle === "string" && seoSource.metaTitle.trim()
          ? seoSource.metaTitle.trim()
          : DEFAULT_ADVANCED_SETTINGS.seo.metaTitle,
      metaDescription:
        typeof seoSource.metaDescription === "string" &&
        seoSource.metaDescription.trim()
          ? seoSource.metaDescription.trim()
          : DEFAULT_ADVANCED_SETTINGS.seo.metaDescription,
      indexable:
        typeof seoSource.indexable === "boolean"
          ? seoSource.indexable
          : DEFAULT_ADVANCED_SETTINGS.seo.indexable,
      canonicalBaseUrl:
        typeof seoSource.canonicalBaseUrl === "string" &&
        seoSource.canonicalBaseUrl.trim()
          ? seoSource.canonicalBaseUrl.trim()
          : undefined,
    },
    social: {
      facebookUrl:
        typeof socialSource.facebookUrl === "string" &&
        socialSource.facebookUrl.trim()
          ? socialSource.facebookUrl.trim()
          : undefined,
      instagramUrl:
        typeof socialSource.instagramUrl === "string" &&
        socialSource.instagramUrl.trim()
          ? socialSource.instagramUrl.trim()
          : undefined,
      youtubeUrl:
        typeof socialSource.youtubeUrl === "string" &&
        socialSource.youtubeUrl.trim()
          ? socialSource.youtubeUrl.trim()
          : undefined,
      xUrl:
        typeof socialSource.xUrl === "string" && socialSource.xUrl.trim()
          ? socialSource.xUrl.trim()
          : undefined,
    },
    contact: {
      supportEmail:
        typeof contactSource.supportEmail === "string" &&
        contactSource.supportEmail.trim()
          ? contactSource.supportEmail.trim()
          : DEFAULT_ADVANCED_SETTINGS.contact.supportEmail,
      supportPhone:
        typeof contactSource.supportPhone === "string" &&
        contactSource.supportPhone.trim()
          ? contactSource.supportPhone.trim()
          : DEFAULT_ADVANCED_SETTINGS.contact.supportPhone,
      supportAddress:
        typeof contactSource.supportAddress === "string" &&
        contactSource.supportAddress.trim()
          ? contactSource.supportAddress.trim()
          : DEFAULT_ADVANCED_SETTINGS.contact.supportAddress,
      supportHours:
        typeof contactSource.supportHours === "string" &&
        contactSource.supportHours.trim()
          ? contactSource.supportHours.trim()
          : DEFAULT_ADVANCED_SETTINGS.contact.supportHours,
      supportCompanyName:
        typeof contactSource.supportCompanyName === "string" &&
        contactSource.supportCompanyName.trim()
          ? contactSource.supportCompanyName.trim()
          : DEFAULT_ADVANCED_SETTINGS.contact.supportCompanyName,
    },
  };
};

const parseFeatureSettings = (
  value: Prisma.JsonValue | null | undefined,
): { flags: FeatureFlagRecord[]; advancedSettings: AdvancedSettings } => {
  if (Array.isArray(value)) {
    return {
      flags: value.map(toFeatureFlagRecord).filter(Boolean) as FeatureFlagRecord[],
      advancedSettings: DEFAULT_ADVANCED_SETTINGS,
    };
  }

  if (isRecord(value)) {
    const flagsSource = Array.isArray(value.flags)
      ? value.flags
      : Array.isArray(value.featureFlags)
        ? value.featureFlags
        : [];
    return {
      flags: flagsSource
        .map(toFeatureFlagRecord)
        .filter(Boolean) as FeatureFlagRecord[],
      advancedSettings: mergeAdvancedSettings(value.advancedSettings),
    };
  }

  return { flags: [], advancedSettings: DEFAULT_ADVANCED_SETTINGS };
};

const parseCmsPageRecord = (value: unknown): CmsPageRecord | null => {
  if (!isRecord(value)) return null;

  const title =
    typeof value.title === "string" && value.title.trim().length > 0
      ? value.title.trim()
      : "";
  const rawSlug =
    typeof value.slug === "string" && value.slug.trim().length > 0
      ? value.slug
      : title;
  const slug = normalizeSlug(rawSlug);
  const audience =
    value.audience === "vendor" || value.audience === "user"
      ? value.audience
      : null;
  const content =
    typeof value.content === "string" && value.content.trim().length > 0
      ? value.content
      : "";

  if (!title || !slug || !audience || !content) return null;

  return {
    id:
      typeof value.id === "string" && value.id.trim().length > 0
        ? value.id
        : randomUUID(),
    title,
    slug,
    audience,
    summary:
      typeof value.summary === "string" && value.summary.trim().length > 0
        ? value.summary.trim()
        : undefined,
    content,
    coverImageUrl:
      typeof value.coverImageUrl === "string" &&
      value.coverImageUrl.trim().length > 0
        ? value.coverImageUrl.trim()
        : undefined,
    seoTitle:
      typeof value.seoTitle === "string" && value.seoTitle.trim().length > 0
        ? value.seoTitle.trim()
        : undefined,
    seoDescription:
      typeof value.seoDescription === "string" &&
      value.seoDescription.trim().length > 0
        ? value.seoDescription.trim()
        : undefined,
    isPublished: Boolean(value.isPublished),
    createdAt:
      typeof value.createdAt === "string" && value.createdAt.trim().length > 0
        ? value.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof value.updatedAt === "string" && value.updatedAt.trim().length > 0
        ? value.updatedAt
        : new Date().toISOString(),
    publishedAt:
      typeof value.publishedAt === "string" && value.publishedAt.trim().length > 0
        ? value.publishedAt
        : undefined,
  };
};

const CANCELLATION_POLICY_MAP: Record<
  string,
  {
    freeBeforeHours: number;
    refundPercentBefore: number;
    refundPercentAfter: number;
  }
> = {
  FREE_CANCELLATION: {
    freeBeforeHours: 24,
    refundPercentBefore: 100,
    refundPercentAfter: 0,
  },
  MODERATE: {
    freeBeforeHours: 48,
    refundPercentBefore: 100,
    refundPercentAfter: 50,
  },
  STRICT: {
    freeBeforeHours: 72,
    refundPercentBefore: 100,
    refundPercentAfter: 0,
  },
  NON_REFUNDABLE: {
    freeBeforeHours: 0,
    refundPercentBefore: 0,
    refundPercentAfter: 0,
  },
};

const resolveCancellationPolicy = (policyKey?: string) =>
  CANCELLATION_POLICY_MAP[policyKey ?? ""] ||
  CANCELLATION_POLICY_MAP.FREE_CANCELLATION;

const normalizePropertyMedia = (items: any[] | null | undefined) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === "string") {
      return { url: item };
    }
    if (item && typeof item === "object") {
      return item;
    }
    return { url: String(item) };
  });
};

const normalizePropertyImages = (items: any[] | null | undefined) => {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => {
    if (typeof item === "string") {
      return {
        url: item,
        alt: undefined,
        isPrimary: index === 0,
      };
    }

    return {
      ...(item || {}),
      url: item?.url,
      alt: item?.alt,
      isPrimary: Boolean(item?.isPrimary ?? index === 0),
    };
  });
};

const normalizeStringList = (items: any[] | null | undefined) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        if (typeof item.name === "string") return item.name.trim();
        if (typeof item.label === "string") return item.label.trim();
        if (typeof item.value === "string") return item.value.trim();
        if (typeof item.url === "string") return item.url.trim();
      }
      if (item === null || item === undefined) return "";
      return String(item).trim();
    })
    .filter(Boolean);
};

const normalizePropertyJson = (value: unknown) =>
  value === undefined ? undefined : (value as Prisma.InputJsonValue);

const normalizePropertyDecimal = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  return new Prisma.Decimal(value as Prisma.Decimal.Value);
};

const normalizePropertyRoomInput = (room: any) => {
  const amenities = room.amenities ?? room.roomAmenities ?? [];
  const images = room.images ?? room.roomImages ?? [];
  return {
    name: room.name ?? room.roomName ?? "Room",
    description: room.description ?? undefined,
    type: room.type ?? room.roomType ?? room.listingType ?? "standard",
    capacity: Number(room.capacity ?? 2),
    extraBedCapacity: Number(room.extraBedCapacity ?? 0),
    sizeSqm: normalizePropertyDecimal(room.sizeSqm),
    pricePerNight: new Prisma.Decimal(room.pricePerNight ?? 0),
    weekendPrice:
      room.weekendPrice === undefined || room.weekendPrice === null || room.weekendPrice === ""
        ? undefined
        : new Prisma.Decimal(room.weekendPrice),
    seasonalPricing: normalizePropertyJson(room.seasonalPricing),
    amenities: normalizeStringList(amenities),
    images: normalizePropertyImages(images),
    video: room.video ?? undefined,
    totalRooms: Number(room.totalRooms ?? room.availableRooms ?? 1),
    availableRooms: Number(room.availableRooms ?? room.totalRooms ?? 1),
    isActive: room.isActive ?? true,
  };
};

const buildCancellationPolicyData = (cancellationPolicy: any) => {
  if (!cancellationPolicy) return undefined;
  if (typeof cancellationPolicy === "string") {
    const policy = resolveCancellationPolicy(cancellationPolicy);
    return {
      freeBeforeHours: policy.freeBeforeHours,
      refundPercentBefore: new Prisma.Decimal(policy.refundPercentBefore),
      refundPercentAfter: new Prisma.Decimal(policy.refundPercentAfter),
    };
  }

  return {
    freeBeforeHours: Number(cancellationPolicy.freeBeforeHours ?? 0),
    refundPercentBefore: new Prisma.Decimal(cancellationPolicy.refundPercentBefore ?? 0),
    refundPercentAfter: new Prisma.Decimal(cancellationPolicy.refundPercentAfter ?? 0),
  };
};

const mapCancellationPolicy = (policy: any) => {
  if (!policy) return null;
  return {
    propertyId: policy.propertyId,
    freeBeforeHours: policy.freeBeforeHours,
    refundPercentBefore: policy.refundPercentBefore?.toNumber?.() ?? 0,
    refundPercentAfter: policy.refundPercentAfter?.toNumber?.() ?? 0,
  };
};

const mapAdminRoom = (room: any) => ({
  id: room.id,
  propertyId: room.propertyId,
  name: room.name,
  description: room.description,
  type: room.type,
  capacity: room.capacity,
  extraBedCapacity: room.extraBedCapacity,
  sizeSqm: room.sizeSqm?.toNumber?.(),
  pricePerNight: room.pricePerNight?.toNumber?.() ?? 0,
  weekendPrice: room.weekendPrice?.toNumber?.() ?? null,
  seasonalPricing: room.seasonalPricing,
  amenities: normalizeStringList(room.amenities),
  images: room.images,
  video: room.video,
  totalRooms: room.totalRooms,
  availableRooms: room.availableRooms,
  isActive: room.isActive,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

const mapAdminProperty = (p: any) => ({
  id: p.id,
  vendorId: p.vendorId ?? p.vendor?.id ?? null,
  name: p.name,
  slug: p.slug,
  type: p.type,
  status: p.status,
  description: p.description,
  shortDesc: p.shortDesc,
  searchText: p.searchText,
  address: p.address,
  city: p.city,
  state: p.state,
  pincode: p.pincode,
  latitude: p.latitude?.toNumber?.(),
  longitude: p.longitude?.toNumber?.(),
  images: p.images,
  videos: p.videos,
  virtualTourUrl: p.virtualTourUrl,
  amenities: p.amenities,
  highlights: p.highlights,
  featureFlags: p.featureFlags,
  houseDetails: p.featureFlags,
  basePrice: p.basePrice?.toNumber?.() ?? 0,
  currency: p.currency,
  rating: p.rating?.toNumber?.() ?? 0,
  reviewCount: p.reviewCount,
  bookingCount: p.bookingCount,
  viewCount: p.viewCount,
  isFeatured: p.isFeatured,
  isVerified: p.isVerified,
  rejectionReason: p.rejectionReason ?? null,
  rejectedAt: p.rejectedAt ?? null,
  isDeleted: p.isDeleted,
  deletedAt: p.deletedAt,
  metaTitle: p.metaTitle,
  metaDesc: p.metaDesc,
  vendor: p.vendor,
  rooms: Array.isArray(p.rooms) ? p.rooms.map(mapAdminRoom) : undefined,
  templeDetails: p.templeDetails ?? null,
  cancellationPolicy: mapCancellationPolicy(p.cancellationPolicy),
  bookingsCount: p._count?.bookings ?? p.bookingsCount ?? 0,
  reviewsCount: p._count?.reviews ?? p.reviewsCount ?? 0,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

export class AdminService {
  private defaultPlatformSettingData(
    homepageConfig?: Record<string, unknown>,
  ): Prisma.PlatformSettingCreateInput {
    return {
      platformName: "HostHaven",
      commissionRate: new Prisma.Decimal(15),
      supportEmail: "support@hosthaven.com",
      supportPhone: "+91 1800 123 4567",
      emailNotifications: true,
      pushNotifications: true,
      minPayoutAmount: new Prisma.Decimal(1000),
      payoutFrequency: "WEEKLY",
      emailTemplates: [],
      featureFlags: {
        flags: [],
        advancedSettings: DEFAULT_ADVANCED_SETTINGS,
      } as Prisma.InputJsonValue,
      homepageConfig: (homepageConfig ?? DEFAULT_HOMEPAGE_CONFIG) as Prisma.InputJsonValue,
    };
  }

  private async ensurePlatformSetting() {
    const existing = await prisma.platformSetting.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (existing) return existing;

    return prisma.platformSetting.create({
      data: this.defaultPlatformSettingData(),
    });
  }

  private toHomepageConfigObject(
    homepageConfig: Prisma.JsonValue | null | undefined,
  ): Record<string, unknown> {
    if (!isRecord(homepageConfig)) {
      return { ...DEFAULT_HOMEPAGE_CONFIG };
    }
    const mergedSections = {
      ...(DEFAULT_HOMEPAGE_CONFIG.sections as Record<string, unknown>),
      ...(isSectionConfigRecord(homepageConfig.sections)
        ? homepageConfig.sections
        : {}),
    };

    return {
      ...DEFAULT_HOMEPAGE_CONFIG,
      ...homepageConfig,
      sections: mergedSections,
    };
  }

  private getCmsPagesFromConfig(config: Record<string, unknown>) {
    const source = Array.isArray(config.cmsPages) ? config.cmsPages : [];
    return source
      .map(parseCmsPageRecord)
      .filter(Boolean) as CmsPageRecord[];
  }

  async getPlatformSettings() {
    const settings = await this.ensurePlatformSetting();
    const parsed = parseFeatureSettings(settings?.featureFlags);

    return {
      ...settings,
      commissionRate: settings.commissionRate?.toNumber?.() ?? 0,
      minPayoutAmount: settings.minPayoutAmount?.toNumber?.() ?? 0,
      emailTemplates: Array.isArray(settings.emailTemplates)
        ? settings.emailTemplates
        : [],
      featureFlags: parsed.flags,
      advancedSettings: parsed.advancedSettings,
    };
  }

   async getPublicPlatformSettings() {
     const settings = await this.getPlatformSettings();
     const advanced = settings.advancedSettings ?? DEFAULT_ADVANCED_SETTINGS;

     return {
       platformName: settings.platformName,
       supportEmail: settings.supportEmail,
       supportPhone: settings.supportPhone,
       contact: {
         supportEmail: advanced.contact.supportEmail || settings.supportEmail,
         supportPhone: advanced.contact.supportPhone || settings.supportPhone,
         supportAddress: advanced.contact.supportAddress,
         supportHours: advanced.contact.supportHours,
         supportCompanyName: advanced.contact.supportCompanyName,
       },
       social: advanced.social ?? DEFAULT_ADVANCED_SETTINGS.social,
        tax: {
          enabled: advanced.tax?.enabled ?? false,
          percent: advanced.tax?.percent ?? 0,
        },
     };
   }

   /**
    * Returns public SEO settings for frontend meta tags injection.
    * No authentication required - safe to expose publicly.
    */
   async getPublicSeoSettings() {
     const settings = await this.getPlatformSettings();
     const advanced = settings.advancedSettings ?? DEFAULT_ADVANCED_SETTINGS;

     return {
       platformName: settings.platformName,
       seo: {
         metaTitle: advanced.seo?.metaTitle ?? DEFAULT_ADVANCED_SETTINGS.seo.metaTitle,
         metaDescription: advanced.seo?.metaDescription ?? DEFAULT_ADVANCED_SETTINGS.seo.metaDescription,
         indexable: advanced.seo?.indexable ?? DEFAULT_ADVANCED_SETTINGS.seo.indexable,
         canonicalBaseUrl: advanced.seo?.canonicalBaseUrl ?? "https://hosthaven.in",
       },
       social: advanced.social ?? DEFAULT_ADVANCED_SETTINGS.social,
     };
   }

   /**
    * Generate dynamic sitemap.xml content from database
    */
   async generateSitemapXml(): Promise<string> {
     const baseUrl = "https://hosthaven.in";
     const now = new Date().toISOString().split("T")[0];

    // Fetch all published properties (hotels and homes)
    const properties = await prisma.property.findMany({
      where: {
        status: "ACTIVE",
        isDeleted: false,
      },
      select: {
        slug: true,
        type: true,
        updatedAt: true,
      },
    });

    // Fetch all published temples
    const temples = await prisma.temple.findMany({
      where: {
        active: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    // Fetch all published CMS pages (stored inside platform settings config)
    const cmsPages = await this.getCmsPages();

    // Fetch all services
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        slug: true,
        updatedAt: true,
      },
    });

     // Build sitemap XML
     let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/hotels</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/homes</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/deviation-temples</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/services</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;

    // Add hotel detail pages
    for (const prop of properties.filter((p) => p.type === "HOTEL")) {
      const lastmod = prop.updatedAt.toISOString().split("T")[0];
      xml += `  <url>
    <loc>${baseUrl}/hotels/${prop.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // Add home detail pages
    for (const prop of properties.filter((p) => p.type === "HOME")) {
      const lastmod = prop.updatedAt.toISOString().split("T")[0];
      xml += `  <url>
    <loc>${baseUrl}/homes/${prop.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

     // Add temple detail pages
     for (const temple of temples) {
       const lastmod = temple.updatedAt.toISOString().split("T")[0];
       xml += `  <url>
    <loc>${baseUrl}/temples/${temple.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
     }

    // Add service detail pages
    for (const service of services) {
      const lastmod = service.updatedAt.toISOString().split("T")[0];
      const serviceSlugOrId = service.slug || service.id;
      xml += `  <url>
    <loc>${baseUrl}/services/${serviceSlugOrId}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }

    // Add CMS pages (user-facing only)
    for (const page of cmsPages.filter((p) => p.audience === "user")) {
      const lastmod = page.updatedAt?.split("T")[0] || now;
      xml += `  <url>
    <loc>${baseUrl}/page/${page.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;
    }

     xml += `</urlset>`;
     return xml;
   }

   /**
    * Generate dynamic robots.txt content
    */
   async generateRobotsTxt(): Promise<string> {
     const settings = await this.getPlatformSettings();
     const advanced = settings.advancedSettings ?? DEFAULT_ADVANCED_SETTINGS;
     const indexable = advanced.seo?.indexable ?? true;
     const baseUrl = advanced.seo?.canonicalBaseUrl ?? "https://hosthaven.in";

     if (!indexable) {
       // Block all crawlers if indexable is false
       return `User-agent: *
Disallow: /

# Site is currently not indexed
`;
     }

     return `# robots.txt for HostHaven
User-agent: *
Allow: /

# Disallow admin and vendor areas
Disallow: /admin/
Disallow: /vendor/
Disallow: /api/
Disallow: /auth/
Disallow: /profile/
Disallow: /bookings/
Disallow: /wishlist/

# Disallow search with parameters (prevents duplicate content)
Disallow: /search?*

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay (optional, for polite crawling)
Crawl-delay: 1
`;
   }

  async updatePlatformSettings(data: PlatformSettingsInput) {
    const existing = await this.ensurePlatformSetting();
    const currentFeatureSettings = parseFeatureSettings(existing.featureFlags);
    const featureFlagsPayload = {
      flags: data.featureFlags ?? currentFeatureSettings.flags,
      advancedSettings:
        data.advancedSettings ?? currentFeatureSettings.advancedSettings,
    };

    const payload: any = {
      platformName: data.platformName,
      commissionRate: new Prisma.Decimal(data.commissionRate),
      supportEmail: data.supportEmail,
      supportPhone: data.supportPhone,
      emailNotifications: data.emailNotifications,
      pushNotifications: data.pushNotifications,
      minPayoutAmount: new Prisma.Decimal(data.minPayoutAmount),
      payoutFrequency: data.payoutFrequency,
      emailTemplates: data.emailTemplates ?? [],
      featureFlags: featureFlagsPayload as Prisma.InputJsonValue,
    };

    if (data.vendorRegistrationFee !== undefined) {
      payload.vendorRegistrationFee = new Prisma.Decimal(data.vendorRegistrationFee);
    }
    if (data.allowedCities !== undefined && data.allowedCities !== null) {
      payload.allowedCities = data.allowedCities;
    }
    if (data.defaultState !== undefined && data.defaultState !== null) {
      payload.defaultState = data.defaultState;
    }
    if (data.advancedSettings !== undefined) {
      payload.featureFlags = {
        ...featureFlagsPayload,
        ...(existing.featureFlags as any || {}),
        advancedSettings: data.advancedSettings,
      } as Prisma.InputJsonValue;
    }

    const updated = await prisma.platformSetting.update({
      where: { id: existing.id },
      data: payload,
    });
    const parsed = parseFeatureSettings(updated.featureFlags);

    logger.info({ settingsId: updated.id }, "Platform settings updated");

    return {
      ...updated,
      commissionRate: updated.commissionRate.toNumber(),
      minPayoutAmount: updated.minPayoutAmount.toNumber(),
      emailTemplates: Array.isArray(updated.emailTemplates)
        ? updated.emailTemplates
        : [],
      featureFlags: parsed.flags,
      advancedSettings: parsed.advancedSettings,
    };
  }

  async getHomepageConfig() {
    const settings = await this.ensurePlatformSetting();
    return this.toHomepageConfigObject(settings?.homepageConfig);
  }

  async updateHomepageConfig(config: Record<string, unknown>) {
    const existing = await this.ensurePlatformSetting();
    const existingConfig = this.toHomepageConfigObject(existing?.homepageConfig);
    const nextConfig: Record<string, unknown> = { ...config };

    // Preserve CMS pages when homepage editor payload doesn't include them.
    if (!Object.prototype.hasOwnProperty.call(nextConfig, "cmsPages")) {
      nextConfig.cmsPages = existingConfig.cmsPages ?? [];
    }

    const updated = await prisma.platformSetting.update({
      where: { id: existing.id },
      data: { homepageConfig: nextConfig as Prisma.InputJsonValue },
    });
    logger.info({ settingsId: updated.id }, "Homepage config updated");
    return this.toHomepageConfigObject(updated?.homepageConfig);
  }

  async getCmsPages() {
    const settings = await this.ensurePlatformSetting();
    const config = this.toHomepageConfigObject(settings?.homepageConfig);
    const pages = this.getCmsPagesFromConfig(config);
    return pages
      .filter((p) => p && p.updatedAt)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createCmsPage(data: {
    title: string;
    slug: string;
    audience: CmsAudience;
    summary?: string;
    content: string;
    coverImageUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    isPublished: boolean;
  }) {
    const settings = await this.ensurePlatformSetting();
    const config = this.toHomepageConfigObject(settings?.homepageConfig);
    const pages = this.getCmsPagesFromConfig(config);

    const slug = normalizeSlug(data.slug || data.title);
    if (!slug) {
      const error = new Error("Valid slug is required");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const hasConflict = pages.some(
      (page) => page.audience === data.audience && page.slug === slug,
    );
    if (hasConflict) {
      const error = new Error(
        "A CMS page with the same slug already exists for this audience",
      );
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const now = new Date().toISOString();
    const page: CmsPageRecord = {
      id: randomUUID(),
      title: data.title.trim(),
      slug,
      audience: data.audience,
      summary: data.summary?.trim() || undefined,
      content: data.content.trim(),
      coverImageUrl: data.coverImageUrl?.trim() || undefined,
      seoTitle: data.seoTitle?.trim() || undefined,
      seoDescription: data.seoDescription?.trim() || undefined,
      isPublished: data.isPublished,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.isPublished ? now : undefined,
    };

    const nextConfig = {
      ...config,
      cmsPages: [page, ...pages],
    };
    await prisma.platformSetting.update({
      where: { id: settings.id },
      data: { homepageConfig: nextConfig as Prisma.InputJsonValue },
    });

    logger.info(
      { cmsPageId: page.id, slug: page.slug, audience: page.audience },
      "CMS page created",
    );
    return page;
  }

  async updateCmsPage(
    pageId: string,
    data: {
      title?: string;
      slug?: string;
      audience?: CmsAudience;
      summary?: string;
      content?: string;
      coverImageUrl?: string;
      seoTitle?: string;
      seoDescription?: string;
      isPublished?: boolean;
    },
  ) {
    const settings = await this.ensurePlatformSetting();
    const config = this.toHomepageConfigObject(settings?.homepageConfig);
    const pages = this.getCmsPagesFromConfig(config);
    const pageIndex = pages.findIndex((page) => page.id === pageId);

    if (pageIndex < 0) {
      const error = new Error("CMS page not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const current = pages[pageIndex];
    const nextAudience = data.audience ?? current.audience;
    const nextSlug = normalizeSlug(data.slug ?? current.slug);
    if (!nextSlug) {
      const error = new Error("Valid slug is required");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const hasConflict = pages.some(
      (page) =>
        page.id !== pageId &&
        page.audience === nextAudience &&
        page.slug === nextSlug,
    );
    if (hasConflict) {
      const error = new Error(
        "A CMS page with the same slug already exists for this audience",
      );
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const now = new Date().toISOString();
    const nextPublished =
      typeof data.isPublished === "boolean"
        ? data.isPublished
        : current.isPublished;
    const updatedPage: CmsPageRecord = {
      ...current,
      title: data.title?.trim() || current.title,
      slug: nextSlug,
      audience: nextAudience,
      summary:
        data.summary === undefined
          ? current.summary
          : data.summary.trim() || undefined,
      content: data.content?.trim() || current.content,
      coverImageUrl:
        data.coverImageUrl === undefined
          ? current.coverImageUrl
          : data.coverImageUrl.trim() || undefined,
      seoTitle:
        data.seoTitle === undefined
          ? current.seoTitle
          : data.seoTitle.trim() || undefined,
      seoDescription:
        data.seoDescription === undefined
          ? current.seoDescription
          : data.seoDescription.trim() || undefined,
      isPublished: nextPublished,
      updatedAt: now,
      publishedAt:
        nextPublished && !current.isPublished
          ? now
          : nextPublished
            ? current.publishedAt
            : undefined,
    };

    pages[pageIndex] = updatedPage;
    const nextConfig = {
      ...config,
      cmsPages: pages,
    };
    await prisma.platformSetting.update({
      where: { id: settings.id },
      data: { homepageConfig: nextConfig as Prisma.InputJsonValue },
    });

    logger.info(
      { cmsPageId: updatedPage.id, slug: updatedPage.slug },
      "CMS page updated",
    );
    return updatedPage;
  }

  async deleteCmsPage(pageId: string) {
    const settings = await this.ensurePlatformSetting();
    const config = this.toHomepageConfigObject(settings?.homepageConfig);
    const pages = this.getCmsPagesFromConfig(config);
    const exists = pages.some((page) => page.id === pageId);

    if (!exists) {
      const error = new Error("CMS page not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const nextPages = pages.filter((page) => page.id !== pageId);
    const nextConfig = {
      ...config,
      cmsPages: nextPages,
    };
    await prisma.platformSetting.update({
      where: { id: settings.id },
      data: { homepageConfig: nextConfig as Prisma.InputJsonValue },
    });

    logger.info({ cmsPageId: pageId }, "CMS page deleted");
    return { id: pageId, deleted: true };
  }

  async getPublishedCmsPage(audience: CmsAudience, slug: string) {
    const normalizedSlug = normalizeSlug(slug);
    const pages = await this.getCmsPages();
    const page = pages.find(
      (item) =>
        item.audience === audience &&
        item.slug === normalizedSlug &&
        item.isPublished,
    );

    if (!page) {
      const error = new Error("CMS page not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return page;
  }

  async getDashboard() {
    const [
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue,
      recentBookings,
      recentVendors,
      pendingProperties,
      activeProperties,
      totalVendors,
      pendingVendors,
      totalServiceBookings,
      totalSupportTickets,
      openTickets,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: { notIn: ["VENDOR", "ADMIN"] }, isDeleted: false },
      }),
      prisma.property.count({
        where: { status: { in: ["ACTIVE", "INACTIVE"] }, isDeleted: false },
      }),
      prisma.booking.count({
        where: { isDeleted: false },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.booking.findMany({
        where: { isDeleted: false },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          property: { select: { name: true, type: true } },
        },
      }),
      prisma.vendor.findMany({
        where: { isDeleted: false },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.property.count({ where: { status: "PENDING", isDeleted: false } }),
      prisma.property.count({ where: { status: { in: ["ACTIVE", "INACTIVE"] }, isDeleted: false } }),
      prisma.vendor.count({ where: { isDeleted: false } }),
      prisma.vendor.count({ where: { isDeleted: false, applicationStatus: 'PENDING' } }),
      prisma.serviceBooking.count(),
      prisma.supportTicket.count(),
      prisma.supportTicket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
    ]);

    const newBookingsToday = await prisma.booking.count({
      where: {
        isDeleted: false,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    return {
      stats: {
        totalUsers,
        totalProperties,
        activeProperties,
        totalBookings,
        totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
        pendingProperties,
        pendingVendors,
        totalVendors,
        totalServiceBookings,
        totalSupportTickets,
        openTickets,
        newBookingsToday,
      },
      recentBookings: recentBookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        user: b.user,
        property: b.property,
        totalAmount: b.totalAmount.toNumber(),
        status: b.status,
        createdAt: b.createdAt,
      })),
      recentVendors: recentVendors.map((v: any) => ({
        id: v.id,
        businessName: v.businessName,
        user: v.user,
        isApproved: v.isApproved,
        createdAt: v.createdAt,
      })),
    };
  }

  async getSystemStats(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [users, properties, bookings, revenue] = await Promise.all([
      prisma.user.count({ where }),
      prisma.property.count({ where }),
      prisma.booking.count({ where }),
      prisma.payment.aggregate({
        where: { ...where, status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    const bookingStats = await prisma.booking.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    });

    const propertyTypes = await prisma.property.groupBy({
      by: ["type"],
      where: { status: "ACTIVE" },
      _count: { id: true },
    });

    return {
      users,
      properties,
      bookings,
      revenue: revenue._sum.amount?.toNumber() || 0,
      byStatus: bookingStats.reduce((acc: any, s: any) => {
        acc[s.status] = s._count.id;
        return acc;
      }, {}),
      byPropertyType: propertyTypes.reduce((acc: any, p: any) => {
        acc[p.type] = p._count.id;
        return acc;
      }, {}),
    };
  }

  async getAllUsers(filters: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    status?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.status) {
      if (filters.status === "active") {
        where.isActive = true;
        where.isDeleted = false;
      } else if (filters.status === "suspended") {
        where.isActive = false;
        where.isDeleted = false;
      } else if (filters.status === "deleted") {
        where.isDeleted = true;
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          isDeleted: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStatus(userId: string, isActive: boolean, adminInfo?: { id: string; name: string; email: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      const error = new Error("User not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const oldStatus = user.isActive;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    logger.info({ userId, isActive }, "User status updated");

    if (adminInfo) {
      await auditLogger.logAction(
        adminInfo.id,
        adminInfo.name,
        adminInfo.email,
        isActive ? "UNBLOCK" : "BLOCK",
        "USER",
        userId,
        {
          oldStatus: oldStatus ? "Active" : "Inactive",
          newStatus: updated.isActive ? "Active" : "Inactive",
          userName: user.name,
          userEmail: user.email,
        }
      );
    }

    return {
      id: updated.id,
      isActive: updated.isActive,
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        emailVerifiedAt: true,
        isDeleted: true,
        deletedAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            bookingNumber: true,
            checkInDate: true,
            checkOutDate: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            property: { select: { id: true, name: true, type: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            property: { select: { id: true, name: true } },
          },
        },
        serviceBookings: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            status: true,
            serviceDate: true,
            totalAmount: true,
            service: { select: { id: true, name: true } },
          },
        },
        wishlistItems: { select: { id: true } },
        _count: {
          select: {
            bookings: true,
            reviews: true,
            serviceBookings: true,
            wishlistItems: true,
          },
        },
      },
    });
    if (!user) {
      const error = new Error("User not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }
    const totalSpent = await prisma.booking.aggregate({
      where: {
        userId,
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
      },
      _sum: { totalAmount: true },
    });
    return { ...user, totalSpent: totalSpent._sum.totalAmount ?? 0 };
  }

  async softDeleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error = new Error("User not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isDeleted: true, deletedAt: new Date(), isActive: false },
    });
    logger.info({ userId }, "User soft-deleted");
    return { id: updated.id, isDeleted: true };
  }

  async verifyUserEmail(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error = new Error("User not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
      },
    });
    logger.info({ userId }, "User email verified by admin");
    return { id: updated.id, isVerified: true };
  }

  async resetUserPassword(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error = new Error("User not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }
    // Generate a temporary token — in production this should send an email
    const crypto = await import("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour
    await prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: resetToken, passwordResetExpires: expires },
    });
    // Token sent via email only — never returned in API response
    logger.info({ userId }, "Password reset initiated by admin");
    return { id: userId, expiresAt: expires };
  }

  async getUserSessions(userId: string) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        deviceType: true,
        location: true,
        isActive: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return sessions;
  }

  async getAllProperties(filters: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    city?: string;
    search?: string;
    vendorId?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.vendorId) {
      where.vendorId = filters.vendorId;
    }

    if (filters.city) {
      where.city = filters.city;
    }

    if (filters.search) {
      const searchUpper = filters.search.toUpperCase();
      const cityEnumValues = ['VIJAYAWADA', 'NANDIYALA', 'VETLAPALEM', 'TIRUPATI'];
      const matchedCity = cityEnumValues.includes(searchUpper) ? searchUpper : undefined;
      
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
      ];
      if (matchedCity) {
        where.OR.push({ city: matchedCity });
      }
    }

    // Default hiding soft-deleted
    if (where.isDeleted === undefined && filters.status !== "INACTIVE") {
      where.isDeleted = false;
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
            },
          },
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      properties: properties.map((p: any) => mapAdminProperty(p)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updatePropertyStatus(
    idOrSlug: string,
    status: string,
    reason?: string,
    adminInfo?: { id: string; name: string; email: string },
  ) {
    let property = await prisma.property.findUnique({
      where: { id: idOrSlug },
    });

    if (!property) {
      property = await prisma.property.findUnique({
        where: { slug: idOrSlug },
      });
    }

    if (!property) {
      const error = new Error("Property not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const validStatuses = ["ACTIVE", "INACTIVE", "REJECTED", "DRAFT", "PENDING"];
    if (!validStatuses.includes(status)) {
      const error = new Error("Invalid status value");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const oldStatus = property.status;
    const updateData: Record<string, unknown> = { status: status as any };

    if (status === "REJECTED") {
      updateData.rejectionReason = reason?.trim() || "Property rejected by admin";
      updateData.rejectedAt = new Date();
    } else if (status === "ACTIVE") {
      updateData.rejectionReason = null;
      updateData.rejectedAt = null;
    }

    const updated = await prisma.property.update({
      where: { id: property.id },
      data: updateData,
    });

    logger.info({ propertyId: property.id, status }, "Property status updated");

    if (adminInfo) {
      await auditLogger.logAction(
        adminInfo.id,
        adminInfo.name,
        adminInfo.email,
        status === "ACTIVE" ? "APPROVE" : status === "REJECTED" ? "REJECT" : "UPDATE",
        "PROPERTY",
        property.id,
        {
          oldStatus: oldStatus,
          newStatus: updated.status,
          reason: reason,
          propertyName: property.name,
        }
      );
    }

    return {
      id: updated.id,
      status: updated.status,
      rejectionReason: updated.rejectionReason,
      rejectedAt: updated.rejectedAt,
    };
  }

  async createProperty(data: any) {
    const slugBase = (data.slug || data.name || "property")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${slugBase || "property"}-${Date.now()}`;
    const cancellationPolicyData = buildCancellationPolicyData(data.cancellationPolicy);
    const rooms = Array.isArray(data.rooms) ? data.rooms : [];
    const houseDetails = data.houseDetails ?? data.featureFlags;

    const property = await prisma.property.create({
      data: {
        vendorId: data.vendorId ?? undefined,
        name: data.name,
        slug,
        type: data.type || "HOTEL",
        status: data.status || "DRAFT",
        description: data.description,
        shortDesc: data.shortDesc || undefined,
        searchText: data.searchText || undefined,
        address: data.address,
        city: data.city || "VIJAYAWADA",
        state: data.state || "Andhra Pradesh",
        pincode: data.pincode,
        latitude: normalizePropertyDecimal(data.latitude),
        longitude: normalizePropertyDecimal(data.longitude),
        images: normalizePropertyImages(data.images),
        videos: Array.isArray(data.videos) ? normalizePropertyMedia(data.videos) : undefined,
        virtualTourUrl: data.virtualTourUrl || undefined,
        amenities: data.amenities || [],
        highlights: data.highlights || undefined,
        featureFlags: normalizePropertyJson(houseDetails),
        basePrice: new Prisma.Decimal(data.basePrice || 0),
        currency: data.currency || "INR",
        isFeatured: Boolean(data.isFeatured),
        isVerified: Boolean(data.isVerified),
        metaTitle: data.metaTitle || undefined,
        metaDesc: data.metaDesc || undefined,
        templeDetails:
          data.type === "TEMPLE" && data.templeDetails
            ? {
                create: {
                  deity: data.templeDetails.deity || data.name,
                  templeType: data.templeDetails.templeType,
                  builtYear: data.templeDetails.builtYear,
                  architecture: data.templeDetails.architecture,
                  searchText: data.templeDetails.searchText,
                  darshanTimings:
                    data.templeDetails.darshanTimings ?? [],
                  aartiTimings: data.templeDetails.aartiTimings,
                  specialEvents: data.templeDetails.specialEvents,
                  dressCode: data.templeDetails.dressCode,
                  entryFee: data.templeDetails.entryFee,
                  photography: data.templeDetails.photography ?? true,
                  bestTimeToVisit: data.templeDetails.bestTimeToVisit,
                  festivals: data.templeDetails.festivals,
                },
              }
            : undefined,
        cancellationPolicy: cancellationPolicyData
          ? {
              create: cancellationPolicyData,
            }
          : undefined,
        rooms:
          rooms.length > 0
            ? {
                create: rooms.map(normalizePropertyRoomInput),
              }
            : data.type === "HOME"
              ? {
                  create: [
                    normalizePropertyRoomInput({
                      name: houseDetails?.houseType || "Entire Home",
                      type: houseDetails?.listingType || "entire_home",
                      description: data.description?.slice(0, 200),
                      capacity: Number(houseDetails?.totalGuests) || 4,
                      pricePerNight: data.basePrice || 0,
                      weekendPrice: houseDetails?.weekendPrice,
                      amenities: data.amenities || [],
                      totalRooms: Number(houseDetails?.totalUnits) || 1,
                      availableRooms: Number(houseDetails?.totalUnits) || 1,
                    }),
                  ],
                }
              : undefined,
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
        rooms: { where: { isDeleted: false } },
        templeDetails: true,
        cancellationPolicy: true,
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    await syncAmenityCatalog(data.amenities || []);

    logger.info(
      { propertyId: property.id, type: data.type },
      "Property created by admin",
    );

    return mapAdminProperty(property);
  }

  async getPropertyById(idOrSlug: string) {
    let property = await prisma.property.findUnique({
      where: { id: idOrSlug, isDeleted: false },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            user: { select: { name: true, email: true, phone: true } },
          },
        },
        rooms: {
          where: { isDeleted: false },
        },
        templeDetails: true,
        cancellationPolicy: true,
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    if (!property) {
      property = await prisma.property.findUnique({
        where: { slug: idOrSlug, isDeleted: false },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              user: { select: { name: true, email: true, phone: true } },
            },
          },
          rooms: {
            where: { isDeleted: false },
          },
          templeDetails: true,
          cancellationPolicy: true,
          _count: { select: { bookings: true, reviews: true } },
        },
      });
    }

    if (!property) {
      const error: any = new Error("Property not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return mapAdminProperty(property);
  }

  async updateProperty(idOrSlug: string, data: any) {
    let property = await prisma.property.findUnique({
      where: { id: idOrSlug },
    });

    if (!property) {
      property = await prisma.property.findUnique({
        where: { slug: idOrSlug },
      });
    }

    if (!property) {
      const error: any = new Error("Property not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const propertyId = property.id;

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.type !== undefined)
      updateData.type =
        typeof data.type === "string" ? data.type.toUpperCase() : data.type;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.shortDesc !== undefined) updateData.shortDesc = data.shortDesc;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined)
      updateData.city =
        typeof data.city === "string" ? data.city.toUpperCase() : data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.pincode !== undefined) updateData.pincode = data.pincode;
    if (data.searchText !== undefined) updateData.searchText = data.searchText;
    if (data.latitude !== undefined)
      updateData.latitude =
        data.latitude === null ? null : new Prisma.Decimal(data.latitude);
    if (data.longitude !== undefined)
      updateData.longitude =
        data.longitude === null ? null : new Prisma.Decimal(data.longitude);
    if (data.basePrice !== undefined && data.basePrice !== null)
      updateData.basePrice = new Prisma.Decimal(data.basePrice);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.vendorId !== undefined)
      updateData.vendorId = data.vendorId === null ? null : data.vendorId;
    if (data.amenities !== undefined) updateData.amenities = data.amenities;
    if (data.images !== undefined)
      updateData.images = normalizePropertyImages(data.images);
    if (data.videos !== undefined)
      updateData.videos =
        data.videos === null ? null : normalizePropertyMedia(data.videos);
    if (data.virtualTourUrl !== undefined)
      updateData.virtualTourUrl = data.virtualTourUrl;
    if (data.highlights !== undefined) updateData.highlights = data.highlights;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    if (data.status !== undefined)
      updateData.status =
        typeof data.status === "string"
          ? data.status.toUpperCase()
          : data.status;
    if (data.featureFlags !== undefined)
      updateData.featureFlags = data.featureFlags;
    if (data.houseDetails !== undefined)
      updateData.featureFlags = data.houseDetails;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDesc !== undefined) updateData.metaDesc = data.metaDesc;

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
        rooms: { where: { isDeleted: false } },
        templeDetails: true,
        cancellationPolicy: true,
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    if (data.amenities !== undefined) {
      await syncAmenityCatalog(data.amenities);
    }

    // Upsert cancellation policy if provided
    if (data.cancellationPolicy) {
      const policy = buildCancellationPolicyData(data.cancellationPolicy)!;
      await prisma.cancellationPolicy.upsert({
        where: { propertyId },
        create: {
          propertyId,
          ...policy,
        },
        update: {
          ...policy,
        },
      });
    }

    if (data.templeDetails !== undefined) {
      if (data.templeDetails === null) {
        await prisma.templeDetails.deleteMany({ where: { propertyId } });
      } else if (Object.keys(data.templeDetails).length > 0) {
        await prisma.templeDetails.upsert({
          where: { propertyId },
          create: {
            propertyId,
            deity: data.templeDetails.deity || updated.name,
            templeType: data.templeDetails.templeType,
            builtYear: data.templeDetails.builtYear,
            architecture: data.templeDetails.architecture,
            searchText: data.templeDetails.searchText,
            darshanTimings: data.templeDetails.darshanTimings ?? [],
            aartiTimings: data.templeDetails.aartiTimings,
            specialEvents: data.templeDetails.specialEvents,
            dressCode: data.templeDetails.dressCode,
            entryFee: data.templeDetails.entryFee,
            photography: data.templeDetails.photography ?? true,
            bestTimeToVisit: data.templeDetails.bestTimeToVisit,
            festivals: data.templeDetails.festivals,
          },
          update: {
            ...(data.templeDetails.deity !== undefined ? { deity: data.templeDetails.deity } : {}),
            ...(data.templeDetails.templeType !== undefined ? { templeType: data.templeDetails.templeType } : {}),
            ...(data.templeDetails.builtYear !== undefined ? { builtYear: data.templeDetails.builtYear } : {}),
            ...(data.templeDetails.architecture !== undefined ? { architecture: data.templeDetails.architecture } : {}),
            ...(data.templeDetails.searchText !== undefined ? { searchText: data.templeDetails.searchText } : {}),
            ...(data.templeDetails.darshanTimings !== undefined ? { darshanTimings: data.templeDetails.darshanTimings } : {}),
            ...(data.templeDetails.aartiTimings !== undefined ? { aartiTimings: data.templeDetails.aartiTimings } : {}),
            ...(data.templeDetails.specialEvents !== undefined ? { specialEvents: data.templeDetails.specialEvents } : {}),
            ...(data.templeDetails.dressCode !== undefined ? { dressCode: data.templeDetails.dressCode } : {}),
            ...(data.templeDetails.entryFee !== undefined ? { entryFee: data.templeDetails.entryFee } : {}),
            ...(data.templeDetails.photography !== undefined ? { photography: data.templeDetails.photography } : {}),
            ...(data.templeDetails.bestTimeToVisit !== undefined ? { bestTimeToVisit: data.templeDetails.bestTimeToVisit } : {}),
            ...(data.templeDetails.festivals !== undefined ? { festivals: data.templeDetails.festivals } : {}),
          },
        });
      }
    }

    if (Array.isArray(data.rooms)) {
      const existingRooms = await prisma.room.findMany({
        where: { propertyId, isDeleted: false },
        select: { id: true },
      });
      const incomingIds = new Set(
        data.rooms.map((room: any) => room.id).filter(Boolean),
      );

      for (const room of data.rooms) {
        const roomData = normalizePropertyRoomInput(room);
        if (room.id) {
          await prisma.room.update({
            where: { id: room.id },
            data: roomData,
          });
        } else {
          await prisma.room.create({
            data: {
              propertyId,
              ...roomData,
            },
          });
        }
      }

      const roomsToDelete = existingRooms
        .filter((room) => !incomingIds.has(room.id))
        .map((room) => room.id);
      if (roomsToDelete.length > 0) {
        await prisma.room.updateMany({
          where: { id: { in: roomsToDelete } },
          data: { isDeleted: true, deletedAt: new Date() },
        });
      }
    }

    logger.info({ propertyId }, "Property updated by admin");
    return this.getPropertyById(propertyId);
  }

  async updatePropertyCancellationPolicy(
    propertyId: string,
    cancellationPolicy: string,
  ) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId, isDeleted: false },
      select: { id: true },
    });

    if (!property) {
      const error: any = new Error("Property not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const policy = resolveCancellationPolicy(cancellationPolicy);
    const updated = await prisma.cancellationPolicy.upsert({
      where: { propertyId },
      create: {
        propertyId,
        freeBeforeHours: policy.freeBeforeHours,
        refundPercentBefore: new Prisma.Decimal(policy.refundPercentBefore),
        refundPercentAfter: new Prisma.Decimal(policy.refundPercentAfter),
      },
      update: {
        freeBeforeHours: policy.freeBeforeHours,
        refundPercentBefore: new Prisma.Decimal(policy.refundPercentBefore),
        refundPercentAfter: new Prisma.Decimal(policy.refundPercentAfter),
      },
    });

    logger.info({ propertyId, cancellationPolicy }, "Cancellation policy updated");
    return {
      propertyId: updated.propertyId,
      freeBeforeHours: updated.freeBeforeHours,
      refundPercentBefore: updated.refundPercentBefore.toNumber(),
      refundPercentAfter: updated.refundPercentAfter.toNumber(),
    };
  }

  async softDeleteProperty(propertyId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      const error: any = new Error("Property not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: { isDeleted: true, deletedAt: new Date(), status: "INACTIVE" },
    });

    logger.info({ propertyId }, "Property soft deleted by admin");
    return { id: propertyId, isDeleted: true };
  }

  async updateVendorStatus(vendorId: string, status: string, reason?: string, adminInfo?: { id: string; name: string; email: string }) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });

    if (!vendor) {
      const error = new Error("Vendor not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const oldStatus = {
      isApproved: vendor.isApproved,
      applicationStatus: vendor.applicationStatus,
    };

    const updateData: any = {};
    if (status === "APPROVED") {
      updateData.isApproved = true;
      updateData.approvedAt = new Date();
      updateData.applicationStatus = 'APPROVED';
    } else if (status === "REJECTED") {
      updateData.isApproved = false;
      updateData.applicationStatus = 'REJECTED';
      updateData.rejectionReason = reason || 'Application rejected by admin';
      updateData.rejectedAt = new Date();
    } else if (status === "SUSPENDED") {
      updateData.isApproved = false;
      updateData.applicationStatus = 'SUSPENDED';
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: updateData,
    });

    logger.info({ vendorId, status }, "Vendor status updated");

    if (adminInfo) {
      await auditLogger.logAction(
        adminInfo.id,
        adminInfo.name,
        adminInfo.email,
        status === "APPROVED" ? "APPROVE" : status === "REJECTED" ? "REJECT" : "UPDATE",
        "VENDOR",
        vendorId,
        {
          oldStatus: oldStatus.applicationStatus,
          newStatus: updated.applicationStatus,
          reason: reason,
          businessName: vendor.businessName,
        }
      );
    }

    return {
      id: updated.id,
      isApproved: updated.isApproved,
      approvedAt: updated.approvedAt,
      applicationStatus: updated.applicationStatus,
      rejectionReason: updated.rejectionReason,
    };
  }

  async updateVendorCommission(vendorId: string, commissionRate: number) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      const error = new Error("Vendor not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        commissionRate: new Prisma.Decimal(commissionRate),
      },
    });

    logger.info({ vendorId, commissionRate }, "Vendor commission updated");

    return {
      id: updated.id,
      commissionRate: updated.commissionRate.toNumber(),
    };
  }

  async updateVendor(vendorId: string, data: any) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: true },
    });

    if (!vendor) {
      const error = new Error("Vendor not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updateVendorData: any = {};
    if (data.businessName !== undefined)
      updateVendorData.businessName = data.businessName;
    if (data.businessAddress !== undefined)
      updateVendorData.businessAddress = data.businessAddress;
    if (data.gstNumber !== undefined)
      updateVendorData.gstNumber = data.gstNumber;
    if (data.panNumber !== undefined)
      updateVendorData.panNumber = data.panNumber;
    if (data.aadhaarNumber !== undefined)
      updateVendorData.aadhaarNumber = data.aadhaarNumber;
    if (data.passportPhoto !== undefined)
      updateVendorData.passportPhoto = data.passportPhoto;
    if (data.companyLogo !== undefined)
      updateVendorData.companyLogo = data.companyLogo;
    if (data.commissionRate !== undefined)
      updateVendorData.commissionRate = new Prisma.Decimal(data.commissionRate);
    if (data.bankAccount !== undefined)
      updateVendorData.bankAccount = data.bankAccount;

    const updateUserPayload: any = {};
    if (data.name !== undefined) updateUserPayload.name = data.name;
    if (data.email !== undefined) updateUserPayload.email = data.email;
    if (data.phone !== undefined) updateUserPayload.phone = data.phone;

    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(updateUserPayload).length > 0) {
        await tx.user.update({
          where: { id: vendor.userId },
          data: updateUserPayload,
        });
      }

      let updatedVendor = vendor;
      if (Object.keys(updateVendorData).length > 0) {
        updatedVendor = await tx.vendor.update({
          where: { id: vendorId },
          data: updateVendorData,
          include: { user: true },
        });
      }
      return updatedVendor;
    });

    logger.info({ vendorId }, "Vendor details completely updated by admin");

    return result;
  }

  async getAllBookings(filters: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    vendorId?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.checkInDate = {};
      if (filters.startDate) where.checkInDate.gte = filters.startDate;
      if (filters.endDate) where.checkInDate.lte = filters.endDate;
    }

    if (filters.vendorId) {
      where.property = { vendorId: filters.vendorId };
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              city: true,
              state: true,
              address: true,
              pincode: true,
              images: true,
              vendor: {
                select: {
                  id: true,
                  businessName: true,
                  commissionRate: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          room: { select: { id: true, name: true, type: true } },
          payment: {
            select: {
              id: true,
              razorpayOrderId: true,
              razorpayPaymentId: true,
              razorpaySignature: true,
              amount: true,
              currency: true,
              method: true,
              status: true,
              invoiceId: true,
              refundId: true,
              errorCode: true,
              errorDesc: true,
              refundedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          commissionLedger: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings: bookings.map((b: any) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        user: b.user,
        property: b.property,
        room: b.room,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        adults: b.adults,
        children: b.children,
        extraBeds: b.extraBeds,
        baseAmount: b.baseAmount?.toNumber?.() || b.baseAmount,
        taxAmount: b.taxAmount?.toNumber?.() || b.taxAmount,
        discountAmount: b.discountAmount?.toNumber?.() || b.discountAmount,
        totalAmount: b.totalAmount?.toNumber?.() || b.totalAmount,
        amountPaid: b.payment?.amount?.toNumber?.() || b.payment?.amount || 0,
        status: b.status,
        specialRequests: b.specialRequests,
        guestDetails: b.guestDetails,
        payment: b.payment
          ? {
              id: b.payment.id,
              razorpayOrderId: b.payment.razorpayOrderId,
              razorpayPaymentId: b.payment.razorpayPaymentId,
              razorpaySignature: b.payment.razorpaySignature,
              amount: b.payment.amount?.toNumber?.() || b.payment.amount,
              currency: b.payment.currency,
              method: b.payment.method,
              status: b.payment.status,
              invoiceId: b.payment.invoiceId,
              errorCode: b.payment.errorCode,
              errorDesc: b.payment.errorDesc,
              refundedAt: b.payment.refundedAt,
              createdAt: b.payment.createdAt,
              updatedAt: b.payment.updatedAt,
            }
          : null,
        paymentStatus: b.payment?.status,
        cancelledAt: b.cancelledAt,
        cancellationReason: b.cancellationReason,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        vendorCommissionRate: b.property?.vendor?.commissionRate?.toNumber?.() || b.property?.vendor?.commissionRate || 0,
        commissionAmount: b.commissionLedger?.commissionAmount?.toNumber?.() || b.commissionLedger?.commissionAmount || 0,
        vendorEarning: b.commissionLedger?.vendorEarning?.toNumber?.() || b.commissionLedger?.vendorEarning || 0,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Booking detail, status override, and logs
  async getBookingById(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        property: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
            state: true,
            address: true,
            pincode: true,
            images: true,
            vendor: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
        room: { select: { id: true, name: true, type: true } },
        payment: true,
      },
    });

    if (!booking) {
      const error: any = new Error("Booking not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    // Formatting bigints and decimals
    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      user: booking.user,
      property: booking.property,
      room: booking.room,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      adults: booking.adults,
      children: booking.children,
      extraBeds: booking.extraBeds,
      baseAmount: booking.baseAmount?.toNumber?.() || booking.baseAmount,
      taxAmount: booking.taxAmount?.toNumber?.() || booking.taxAmount,
      discountAmount:
        booking.discountAmount?.toNumber?.() || booking.discountAmount,
      totalAmount: booking.totalAmount?.toNumber?.() || booking.totalAmount,
      status: booking.status,
      specialRequests: booking.specialRequests,
      guestDetails: booking.guestDetails,
      payment: booking.payment
        ? {
            ...booking.payment,
            amount:
              booking.payment.amount?.toNumber?.() || booking.payment.amount,
          }
        : null,
      cancelledAt: booking.cancelledAt,
      cancelledBy: booking.cancelledBy,
      cancellationReason: booking.cancellationReason,
      actualCheckIn: booking.actualCheckIn,
      actualCheckOut: booking.actualCheckOut,
      isReviewed: booking.isReviewed,
      vendorNotifiedAt: booking.vendorNotifiedAt,
      vendorConfirmedAt: booking.vendorConfirmedAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  async updateBookingStatus(bookingId: string, status: string, reason?: string, adminInfo?: { id: string; name: string; email: string }) {
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "CHECKED_IN",
      "CHECKED_OUT",
      "CANCELLED",
    ];
    if (!validStatuses.includes(status)) {
      const error: any = new Error("Invalid booking status");
      error.code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      const error: any = new Error("Booking not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const oldStatus = booking.status;

    const data: any = { status };
    if (status === "CANCELLED") {
      data.cancelledAt = new Date();
      data.cancelledBy = "ADMIN";
      data.cancellationReason = reason || "Cancelled by Admin";
    } else if (status === "CHECKED_IN") {
      data.actualCheckIn = new Date();
    } else if (status === "CHECKED_OUT") {
      data.actualCheckOut = new Date();
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data,
    });

    if (status === "CONFIRMED") {
      await this.calculateCommission(bookingId);
    }

    if (adminInfo) {
      await auditLogger.logAction(
        adminInfo.id,
        adminInfo.name,
        adminInfo.email,
        "UPDATE",
        "BOOKING",
        bookingId,
        {
          oldStatus: oldStatus,
          newStatus: updated.status,
          reason: reason,
          bookingNumber: booking.bookingNumber,
        }
      );
    }

    return updated;
  }

  async getPaymentDetails(bookingId: string) {
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      const error: any = new Error("Payment not found for this booking");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return {
      ...payment,
      amount: payment.amount.toString(),
    };
  }

  async getPaymentById(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            checkInDate: true,
            checkOutDate: true,
            status: true,
            property: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
              },
            },
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        refunds: true,
      },
    });

    if (!payment) {
      const error: any = new Error("Payment not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return {
      id: payment.id,
      bookingId: payment.bookingId,
      bookingNumber: payment.booking?.bookingNumber,
      amount: payment.amount.toNumber(),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      invoiceId: payment.invoiceId,
      refundId: payment.refundId,
      errorCode: payment.errorCode,
      errorDesc: payment.errorDesc,
      refundedAt: payment.refundedAt,
      refundableBalance: Math.max(
        0,
        payment.amount.toNumber() - payment.refunds.reduce((sum: number, refund: any) => sum + refund.amount.toNumber(), 0),
      ),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      booking: payment.booking,
      refunds: payment.refunds.map((refund: any) => ({
        id: refund.id,
        amount: refund.amount.toNumber(),
        reason: refund.reason,
        status: refund.status,
        razorpayRefundId: refund.razorpayRefundId,
        createdAt: refund.createdAt,
      })),
    };
  }

  async getAllVendors(filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
    };

    if (filters.status === "PENDING") {
      where.applicationStatus = "PENDING";
    } else if (filters.status === "APPROVED") {
      where.applicationStatus = "APPROVED";
    } else if (filters.status === "REJECTED") {
      where.applicationStatus = "REJECTED";
    } else if (filters.status === "SUSPENDED") {
      where.applicationStatus = "SUSPENDED";
    }

    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: "insensitive" } },
        { user: { name: { contains: filters.search, mode: "insensitive" } } },
        { user: { email: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          properties: { select: { id: true, name: true, status: true } },
          _count: { select: { properties: true } },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    const vendorBookingCounts = await Promise.all(
      vendors.map((vendor) =>
        prisma.booking.count({
          where: {
            isDeleted: false,
            property: { vendorId: vendor.id },
          },
        }),
      ),
    );

    return {
      vendors: vendors.map((v: any, index: number) => ({
        id: v.id,
        businessName: v.businessName,
        email: v.user?.email,
        phone: v.user?.phone,
        businessAddress: v.businessAddress,
        gstNumber: v.gstNumber,
        panNumber: v.panNumber,
        aadhaarNumber: v.aadhaarNumber,
        passportPhoto: v.passportPhoto,
        companyLogo: v.companyLogo,
        bankAccount: v.bankAccount,
        isApproved: v.isApproved,
        applicationStatus: v.applicationStatus,
        rejectionReason: v.rejectionReason,
        approvedAt: v.approvedAt,
        commissionRate: v.commissionRate?.toNumber?.() ?? 0,
        propertiesCount: v._count.properties,
        bookingsCount: vendorBookingCounts[index] ?? 0,
        properties: v.properties,
        user: v.user,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorById(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        properties: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            city: true,
          },
        },
        payouts: {
          select: { id: true, amount: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { properties: true, payouts: true } },
      },
    });

    if (!vendor) {
      const error: any = new Error("Vendor not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const totalEarnings = await prisma.payout.aggregate({
      where: { vendorId, status: { in: ["PAID", "COMPLETED"] } },
      _sum: { amount: true },
    });

    return {
      ...vendor,
      commissionRate: vendor.commissionRate.toString(),
      applicationStatus: vendor.applicationStatus,
      rejectionReason: vendor.rejectionReason,
      companyLogo: vendor.companyLogo,
      passportPhoto: vendor.passportPhoto,
      businessDocuments: vendor.businessDocuments,
      bankAccount: vendor.bankAccount,
      totalEarnings: totalEarnings._sum?.amount
        ? totalEarnings._sum.amount.toString()
        : "0",
    };
  }

  async softDeleteVendor(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      const error: any = new Error("Vendor not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    // Rather than true physical deletion, we mark user context as soft-deleted + vendor disapproved.
    // If the schema requires an explicit isDeleted flag, ensure you add one to Prisma schema later.
    // However typically vendor suspension acts as soft-deletion effectively if we also softly delete their owner `user`.

    await prisma.$transaction(async (tx) => {
      await tx.vendor.update({
        where: { id: vendorId },
        data: { isApproved: false },
      });

      if (vendor.userId) {
        await tx.user.update({
          where: { id: vendor.userId },
          data: { isDeleted: true, deletedAt: new Date(), isActive: false },
        });
      }
    });

    logger.info({ vendorId }, "Vendor soft-deleted successfully");

    return { id: vendorId, isDeleted: true };
  }

  private serializePayout(payout: any) {
    const normalizedStatus = normalizePayoutStatus(payout.status);
    return {
      id: payout.id,
      vendor: payout.vendor || null,
      amount: payout.amount?.toNumber?.() || 0,
      status: normalizedStatus,
      periodStart: payout.periodStart,
      periodEnd: payout.periodEnd,
      processedAt: payout.processedAt,
      transactionId: payout.transactionId,
      bankName: payout.bankName || null,
      bankAccount: maskAccountNumber(payout.bankAccount),
      ifscCode: maskIfscCode(payout.ifscCode),
      upiId: maskUpiId(payout.upiId),
      upiQrCode: payout.upiQrCode ? "[MASKED]" : null,
      paymentScreenshot: payout.paymentScreenshot,
      vendorVerified: payout.vendorVerified,
      vendorVerifiedAt: payout.vendorVerifiedAt,
      vendorNotes: payout.vendorNotes,
      processedBy: payout.processedBy,
      createdAt: payout.createdAt,
      commissionEntries: Array.isArray(payout.commissionEntries)
        ? payout.commissionEntries.map((entry: any) => ({
            id: entry.id,
            bookingId: entry.bookingId,
            bookingAmount: entry.bookingAmount?.toNumber?.() ?? 0,
            commissionRate: entry.commissionRate?.toNumber?.() ?? 0,
            commissionAmount: entry.commissionAmount?.toNumber?.() ?? 0,
            vendorEarning: entry.vendorEarning?.toNumber?.() ?? 0,
            createdAt: entry.createdAt,
            booking: entry.booking
              ? {
                  ...entry.booking,
                  totalAmount: entry.booking.totalAmount?.toNumber?.() ?? 0,
                }
              : null,
          }))
        : [],
    };
  }

  async getAllPayouts(filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    vendorId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status.toUpperCase();
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: "insensitive" } },
        { transactionId: { contains: filters.search, mode: "insensitive" } },
        { vendor: { businessName: { contains: filters.search, mode: "insensitive" } } },
      ];
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      };
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    return {
      payouts: payouts.map((p: any) => this.serializePayout(p)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPayoutById(id: string) {
    const payout = await prisma.payout.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            user: { select: { name: true, email: true, phone: true } },
          },
        },
        commissionEntries: {
          include: {
            booking: {
              select: {
                id: true,
                bookingNumber: true,
                user: { select: { name: true, email: true, phone: true } },
                property: { select: { name: true, city: true } },
                room: { select: { name: true } },
                checkInDate: true,
                checkOutDate: true,
                totalAmount: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!payout) {
      const error = new Error('Payout not found');
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return this.serializePayout(payout);
  }

  async getAllPayments(filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    vendorId?: string;
    bookingId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status.toUpperCase();
    if (filters.bookingId) where.bookingId = filters.bookingId;
    if (filters.vendorId) {
      where.booking = {
        ...(where.booking || {}),
        property: { vendorId: filters.vendorId },
      };
    }
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: "insensitive" } },
        {
          razorpayPaymentId: { contains: filters.search, mode: "insensitive" },
        },
        { razorpayOrderId: { contains: filters.search, mode: "insensitive" } },
        {
          booking: {
            bookingNumber: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              property: { select: { name: true } },
              user: { select: { name: true, email: true } },
            },
          },
          refunds: true,
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments: payments.map((p: any) => ({
        id: p.id,
        amount: p.amount.toNumber(),
        currency: p.currency,
        status: p.status,
        method: p.method,
        razorpayPaymentId: p.razorpayPaymentId,
        razorpayOrderId: p.razorpayOrderId,
        bookingId: p.booking?.id,
        bookingNumber: p.booking?.bookingNumber,
        propertyName: p.booking?.property?.name,
        user: p.booking?.user,
        refunds: p.refunds.map((r: any) => ({
          ...r,
          amount: r.amount.toNumber(),
        })),
        createdAt: p.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllRefunds(filters: {
    page?: number;
    limit?: number;
    search?: string;
    vendorId?: string;
    bookingId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: "insensitive" } },
        { razorpayRefundId: { contains: filters.search, mode: "insensitive" } },
        { payment: { booking: { bookingNumber: { contains: filters.search, mode: "insensitive" } } } },
      ];
    }
    if (filters.bookingId) {
      where.payment = {
        ...(where.payment || {}),
        bookingId: filters.bookingId,
      };
    }
    if (filters.vendorId) {
      where.payment = {
        ...(where.payment || {}),
        booking: {
          ...((where.payment && where.payment.booking) || {}),
          property: { vendorId: filters.vendorId },
        },
      };
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      };
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          payment: {
            include: {
              booking: {
                select: {
                  bookingNumber: true,
                  property: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.refund.count({ where }),
    ]);

    return {
      refunds: refunds.map((r: any) => ({
        id: r.id,
        paymentId: r.paymentId,
        amount: r.amount.toNumber(),
        reason: r.reason,
        status: r.status,
        razorpayRefundId: r.razorpayRefundId,
        bookingNumber: r.payment?.booking?.bookingNumber,
        propertyName: r.payment?.booking?.property?.name,
        createdAt: r.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async processPayout(
    payoutId: string,
    action: "approve" | "reject",
    notes?: string,
    adminInfo?: { id: string; name: string; email: string },
  ) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });

    if (!payout) {
      const error = new Error("Payout not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const currentStatus = normalizePayoutStatus(payout.status);

    if (isPayoutTerminal(currentStatus)) {
      const error = new Error("Payout is already finalized and cannot be modified");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    if (currentStatus === "APPROVED" && action === "approve") {
      const error = new Error("Payout is already approved");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    if (action === "approve") {
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: "APPROVED",
        },
      });
    } else {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: "REJECTED" },
      });
    }

    logger.info({ payoutId, action, adminId: adminInfo?.id }, "Payout processed by admin");

    if (adminInfo) {
      await auditLogger.logAction(
        adminInfo.id,
        adminInfo.name,
        adminInfo.email,
        action === "approve" ? "APPROVE" : "REJECT",
        "PAYOUT",
        payoutId,
        {
          payoutId: payout.id,
          vendorId: payout.vendorId,
          amount: payout.amount.toNumber(),
          previousStatus: currentStatus,
          newStatus: action === "approve" ? "APPROVED" : "REJECTED",
          notes,
        }
      );
    }

    return { message: `Payout ${action}d successfully` };
  }

  async refundBooking(bookingId: string, amount?: number, reason?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) {
      const error = new Error("Booking not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    if (!booking.payment) {
      const error = new Error("Payment record not found for booking");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const refundAmount = amount ?? booking.payment.amount.toNumber();

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "REFUNDED",
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      }),
      prisma.refund.create({
        data: {
          paymentId: booking.payment.id,
          amount: new Prisma.Decimal(refundAmount),
          reason,
          status: "processed",
        },
      }),
    ]);

    logger.info({ bookingId, refundAmount }, "Booking refunded by admin");

    return {
      bookingId,
      message: "Refund marked successfully",
    };
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string,
    adminInfo?: { id: string; name: string; email: string },
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true, refunds: true },
    });

    if (!payment) {
      const error = new Error("Payment not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    if (payment.status === "REFUNDED") {
      const error = new Error("This payment has already been refunded");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    if (payment.status === "FAILED" || payment.status === "PENDING") {
      const error = new Error("Cannot refund a payment that has not been successfully captured");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const totalRefunded = payment.refunds.reduce(
      (sum, r) => sum + r.amount.toNumber(),
      0,
    );

    const maxRefundable = payment.amount.toNumber() - totalRefunded;

    if (amount !== undefined && amount > maxRefundable) {
      const error = new Error(`Refund amount cannot exceed ${maxRefundable} (remaining refundable amount)`);
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    if (amount !== undefined && amount <= 0) {
      const error = new Error("Refund amount must be greater than 0");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const refundAmount = amount ?? maxRefundable;

    if (refundAmount > maxRefundable) {
      const error = new Error(`Refund amount cannot exceed ${maxRefundable} (remaining refundable amount)`);
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const razorpayPaymentId = payment.razorpayPaymentId;
    if (!razorpayPaymentId) {
      const error = new Error("Cannot refund a payment without an external Razorpay payment ID");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const refund = await getFinanceRazorpayClient().payments.refund(razorpayPaymentId, {
      amount: Math.round(refundAmount * 100),
      speed: "normal",
      notes: {
        paymentId,
        reason: reason || "Admin initiated refund",
      },
    });

    const nextPaymentStatus = refundAmount >= maxRefundable ? "REFUNDED" : "PARTIALLY_REFUNDED";
    const shouldMarkBookingRefunded = nextPaymentStatus === "REFUNDED";

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: nextPaymentStatus,
          refundedAt: new Date(),
          refundId: refund.id,
        },
      }),
      ...(payment.booking
        ? [
            prisma.booking.update({
              where: { id: payment.booking.id },
              data: {
                ...(shouldMarkBookingRefunded ? { status: "REFUNDED" } : {}),
                cancellationReason: reason,
                ...(shouldMarkBookingRefunded ? { cancelledAt: new Date() } : {}),
              },
            }),
          ]
        : []),
      prisma.refund.create({
        data: {
          paymentId: paymentId,
          amount: new Prisma.Decimal(refundAmount),
          reason,
          status: refund.status || "processed",
          razorpayRefundId: refund.id,
        },
      }),
    ]);

    logger.info({ paymentId, refundAmount, adminId: adminInfo?.id }, "Payment refunded by admin");

    if (adminInfo) {
      await auditLogger.logAction(
        adminInfo.id,
        adminInfo.name,
        adminInfo.email,
        "UPDATE",
        "PAYMENT",
        paymentId,
        {
          paymentId: payment.id,
          bookingId: payment.bookingId,
          originalAmount: payment.amount.toNumber(),
          refundedAmount: refundAmount,
          totalPreviouslyRefunded: totalRefunded,
          reason,
        }
      );
    }

    return {
      paymentId,
      message: "Refund processed successfully",
    };
  }

  async markPayoutPaid(
    payoutId: string,
    transactionId: string,
    notes?: string,
    paymentScreenshot?: string,
    adminInfo?: { id: string; name: string; email: string },
  ) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });

    if (!payout) {
      const error = new Error("Payout not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const currentStatus = normalizePayoutStatus(payout.status);

    if (currentStatus === "PAID") {
      const error = new Error("Payout has already been marked as paid");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    if (currentStatus === "REJECTED") {
      const error = new Error("Rejected payout cannot be marked as paid");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    if (currentStatus !== "APPROVED") {
      const error = new Error("Only approved payouts can be marked as paid");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "PAID",
        processedAt: new Date(),
        transactionId,
        paymentScreenshot,
        processedBy: adminInfo?.id,
      },
    });

    logger.info(
      { payoutId, transactionId, notes, adminId: adminInfo?.id },
      "Payout marked as paid by admin",
    );

    if (adminInfo) {
      await auditLogger.logAction(
        adminInfo.id,
        adminInfo.name,
        adminInfo.email,
        "UPDATE",
        "PAYOUT",
        payoutId,
        {
          payoutId: updated.id,
          vendorId: updated.vendorId,
          amount: updated.amount.toNumber(),
          transactionId,
          notes,
          paymentScreenshot,
        },
      );
    }

    return {
      id: updated.id,
      status: updated.status,
      transactionId: updated.transactionId,
      processedAt: updated.processedAt,
      paymentScreenshot: updated.paymentScreenshot,
    };
  }

  async verifyPayoutByVendor(
    payoutId: string,
    vendorId: string,
    notes?: string,
  ) {
    const payout = await prisma.payout.findUnique({ where: { id: payoutId } });

    if (!payout) {
      const error = new Error("Payout not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    if (payout.vendorId !== vendorId) {
      const error = new Error("Payout not found for this vendor");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    if (normalizePayoutStatus(payout.status) !== "PAID") {
      const error = new Error("Only paid payouts can be acknowledged by the vendor");
      (error as any).code = ERROR_CODES.VALIDATION_ERROR;
      throw error;
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        vendorVerified: true,
        vendorVerifiedAt: new Date(),
        vendorNotes: notes,
      },
    });

    logger.info({ payoutId, notes }, "Payout verified by vendor");

    return {
      id: updated.id,
      vendorVerified: updated.vendorVerified,
      vendorVerifiedAt: updated.vendorVerifiedAt,
    };
  }

  async calculateCommission(bookingId?: string, serviceBookingId?: string) {
    if (serviceBookingId) {
      const serviceBooking = await prisma.serviceBooking.findUnique({
        where: { id: serviceBookingId },
      });

      if (!serviceBooking || !serviceBooking.totalAmount) return;

      // Service model lacks a vendorId; fall back to platform-level vendor
      const vendor = await prisma.vendor.findFirst({
        where: { commissionRate: { gt: 0 } },
        orderBy: { commissionRate: 'desc' },
      });

      if (!vendor) return;

      const commissionRate = vendor.commissionRate;
      const bookingAmount = serviceBooking.totalAmount;
      const commissionAmount = bookingAmount.mul(commissionRate).div(100);
      const vendorEarning = bookingAmount.sub(commissionAmount);

      await prisma.commissionLedger.upsert({
        where: { serviceBookingId },
        update: {
          commissionRate,
          commissionAmount,
          vendorEarning,
          bookingAmount,
        },
        create: {
          serviceBookingId,
          vendorId: vendor.id,
          bookingAmount,
          commissionRate,
          commissionAmount,
          vendorEarning,
        },
      });

      logger.info({ serviceBookingId, vendorId: vendor.id }, "Commission calculated for service booking");
      return;
    }

    if (!bookingId) return;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: { include: { vendor: true } } },
    });

    if (!booking || !booking.property.vendor) return;

    const vendor = booking.property.vendor;
    const commissionRate = vendor.commissionRate;
    const bookingAmount = booking.totalAmount;
    const commissionAmount = bookingAmount.mul(commissionRate).div(100);
    const vendorEarning = bookingAmount.sub(commissionAmount);

    await prisma.commissionLedger.upsert({
      where: { bookingId },
      update: {
        commissionRate,
        commissionAmount,
        vendorEarning,
        bookingAmount,
      },
      create: {
        bookingId,
        vendorId: vendor.id,
        bookingAmount,
        commissionRate,
        commissionAmount,
        vendorEarning,
      },
    });

    logger.info({ bookingId, vendorId: vendor.id }, "Commission calculated");
  }

  async getVendorEarnings(filters?: { vendorId?: string; search?: string }) {
    const vendors = await prisma.vendor.findMany({
      where: {
        isDeleted: false,
        ...(filters?.vendorId ? { id: filters.vendorId } : {}),
        ...(filters?.search
          ? { businessName: { contains: filters.search, mode: "insensitive" } }
          : {}),
      },
      include: {
        commissionLedger: {
          where: { payoutId: null },
        },
      },
    });

    return vendors.map((v: any) => {
      const grossAmount = v.commissionLedger.reduce(
        (acc: Prisma.Decimal, entry: any) => acc.add(entry.bookingAmount),
        new Prisma.Decimal(0),
      );

      const totalCommission = v.commissionLedger.reduce(
        (acc: Prisma.Decimal, entry: any) => acc.add(entry.commissionAmount),
        new Prisma.Decimal(0),
      );

      const unpaidEarnings = v.commissionLedger.reduce(
        (acc: Prisma.Decimal, entry: any) => acc.add(entry.vendorEarning),
        new Prisma.Decimal(0),
      );

      return {
        id: v.id,
        businessName: v.businessName,
        commissionRate: v.commissionRate?.toNumber?.() ?? 0,
        grossAmount: grossAmount.toNumber(),
        totalCommission: totalCommission.toNumber(),
        unpaidEarnings: unpaidEarnings.toNumber(),
        pendingEntriesCount: v.commissionLedger.length,
      };
    });
  }

  async createPayout(vendorId: string, amount?: number) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, isDeleted: true, businessName: true, bankAccount: true },
    });

    if (!vendor || vendor.isDeleted) {
      const error = new Error("Vendor not found");
      (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const payout = await prisma.$transaction(async (tx) => {
      const unpaidEntries = await tx.commissionLedger.findMany({
        where: { vendorId, payoutId: null },
        orderBy: { createdAt: "asc" },
      });

      if (unpaidEntries.length === 0) {
        const error = new Error("No unpaid earnings for this vendor");
        (error as any).code = ERROR_CODES.VALIDATION_ERROR;
        throw error;
      }

      const totalEarning = unpaidEntries.reduce(
        (acc, entry) => acc.add(entry.vendorEarning),
        new Prisma.Decimal(0),
      );

      const payoutAmount = amount ? new Prisma.Decimal(amount) : totalEarning;

      if (payoutAmount.lte(0)) {
        const error = new Error("Payout amount must be greater than 0");
        (error as any).code = ERROR_CODES.VALIDATION_ERROR;
        throw error;
      }

      if (payoutAmount.gt(totalEarning)) {
        const error = new Error(`Payout amount cannot exceed unpaid earnings of ${totalEarning.toNumber()}`);
        (error as any).code = ERROR_CODES.VALIDATION_ERROR;
        throw error;
      }

      const selectedEntries: typeof unpaidEntries = [];
      let allocated = new Prisma.Decimal(0);

      for (const entry of unpaidEntries) {
        const nextAllocated = allocated.add(entry.vendorEarning);
        if (nextAllocated.gt(payoutAmount)) {
          break;
        }
        selectedEntries.push(entry);
        allocated = nextAllocated;
      }

      if (allocated.lt(payoutAmount)) {
        const error = new Error("Unable to allocate enough unpaid entries for this payout");
        (error as any).code = ERROR_CODES.VALIDATION_ERROR;
        throw error;
      }

      const bankAccount = vendor.bankAccount && typeof vendor.bankAccount === "object"
        ? vendor.bankAccount as Record<string, unknown>
        : null;

      const createdPayout = await tx.payout.create({
        data: {
          vendorId,
          amount: payoutAmount,
          status: "PENDING",
          bookingIds: selectedEntries.map((entry) => entry.bookingId),
          periodStart: selectedEntries[0].createdAt,
          periodEnd: selectedEntries[selectedEntries.length - 1].createdAt,
          bankName: typeof bankAccount?.bankName === "string" ? bankAccount.bankName : null,
          bankAccount: typeof bankAccount?.accountNumber === "string" ? bankAccount.accountNumber : null,
          ifscCode: typeof bankAccount?.ifscCode === "string" ? bankAccount.ifscCode : null,
          upiId: typeof bankAccount?.upiId === "string" ? bankAccount.upiId : null,
        },
      });

      await tx.commissionLedger.updateMany({
        where: { id: { in: selectedEntries.map((entry) => entry.id) } },
        data: { payoutId: createdPayout.id },
      });

      return createdPayout;
    });

    logger.info({ vendorId, payoutId: payout.id }, "Payout created");

    return payout;
  }

  async updatePropertyRoomMetrics(
    propertyId: string,
    roomId: string,
    data: {
      pricePerNight?: number;
      weekendPrice?: number;
      totalRooms?: number;
      availableRooms?: number;
      isActive?: boolean;
    },
  ) {
    const room = await prisma.room.findFirst({
      where: { id: roomId, propertyId, isDeleted: false },
      select: { id: true },
    });

    if (!room) {
      const error: any = new Error("Room not found for this property");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    return this.updateRoom(roomId, data);
  }

  async updateRoom(
    roomId: string,
    data: {
      pricePerNight?: number;
      weekendPrice?: number;
      totalRooms?: number;
      availableRooms?: number;
      isActive?: boolean;
      images?: string[];
      roomImages?: string[];
      video?: string;
    },
  ) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      const error: any = new Error("Room not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const updateData: any = {};
    if (data.pricePerNight !== undefined)
      updateData.pricePerNight = new Prisma.Decimal(data.pricePerNight);
    if (data.weekendPrice !== undefined)
      updateData.weekendPrice = new Prisma.Decimal(data.weekendPrice);
    if (data.totalRooms !== undefined) updateData.totalRooms = data.totalRooms;

    // Safely constrain available rooms to not exceed total rooms
    if (data.availableRooms !== undefined) {
      updateData.availableRooms = Math.min(
        data.availableRooms,
        data.totalRooms ?? room.totalRooms,
      );
    }

    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.images !== undefined) updateData.images = data.images as any;
    if (data.video !== undefined) updateData.video = data.video || null;

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: updateData,
    });

    logger.info({ roomId }, "Room details updated securely by admin");

    return {
      id: updated.id,
      name: updated.name,
      pricePerNight: updated.pricePerNight.toNumber(),
      weekendPrice: updated.weekendPrice
        ? updated.weekendPrice.toNumber()
        : null,
      totalRooms: updated.totalRooms,
      availableRooms: updated.availableRooms,
      isActive: updated.isActive,
      images: updated.images,
      video: updated.video,
      message: "Room details updated",
    };
  }

  async blockRoomDates(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date,
    quantity: number,
  ) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      const error: any = new Error("Room not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const lock = await prisma.inventoryLock.create({
      data: {
        roomId,
        quantity,
        checkInDate,
        checkOutDate,
        lockUntil: new Date("9999-12-31T23:59:59.000Z"), // Permanent lock until manually lifted
      },
    });

    logger.info(
      { roomId, lockId: lock.id },
      "Room dates forcibly blocked by admin",
    );

    return {
      lockId: lock.id,
      roomId: lock.roomId,
      message: "Room dates permanently blocked for specified duration",
    };
  }

  async getRoomInventory(roomId: string, startDate: Date, endDate: Date) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true },
    });

    if (!room) {
      const error: any = new Error("Room not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const [days, locks] = await Promise.all([
      prisma.inventoryDay.findMany({
        where: {
          roomId,
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: "asc" },
      }),
      prisma.inventoryLock.findMany({
        where: {
          roomId,
          OR: [
            { checkInDate: { lte: endDate }, checkOutDate: { gte: startDate } },
          ],
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      days: days.map((d) => ({
        date: d.date,
        totalRooms: d.totalRooms,
        availableRooms: d.availableRooms,
      })),
      locks: locks.map((l) => ({
        id: l.id,
        quantity: l.quantity,
        checkInDate: l.checkInDate,
        checkOutDate: l.checkOutDate,
        lockUntil: l.lockUntil,
        isExpired: l.lockUntil < new Date() && l.lockUntil.getFullYear() < 9000,
      })),
    };
  }

  async overrideRoomInventory(
    roomId: string,
    date: Date,
    availableRooms: number,
  ) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      const error: any = new Error("Room not found");
      error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw error;
    }

    const result = await prisma.inventoryDay.upsert({
      where: { roomId_date: { roomId, date } },
      update: { availableRooms },
      create: {
        roomId,
        date,
        totalRooms: room.totalRooms,
        availableRooms,
      },
    });

    logger.info(
      { roomId, date, availableRooms },
      "Inventory manually overridden by admin",
    );
    return result;
  }

  async getAllPropertiesInventory(date: Date, vendorId?: string) {
    const whereClause: any = { isDeleted: false };
    if (vendorId) {
      whereClause.vendorId = vendorId;
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: { id: true, businessName: true },
        },
        rooms: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            type: true,
            totalRooms: true,
            bookings: {
              where: {
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
                checkInDate: { lte: date },
                checkOutDate: { gt: date },
              },
              select: {
                id: true,
                bookingNumber: true,
                checkInDate: true,
                checkOutDate: true,
                status: true,
                user: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
    });

    return properties.map((property: any) => ({
      propertyId: property.id,
      propertyName: property.name,
      vendorName: property.vendor?.businessName || "Unknown",
      rooms: property.rooms.map((room: any) => {
        const filledRooms = room.bookings.length;
        const availableRooms = room.totalRooms - filledRooms;

        return {
          roomId: room.id,
          roomName: room.name,
          roomType: room.type,
          totalRooms: room.totalRooms,
          filledRooms,
          availableRooms,
          bookings: room.bookings.map((booking: any) => ({
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            guestName: booking.user.name,
            phone: booking.user.phone,
            checkIn: booking.checkInDate,
            checkOut: booking.checkOutDate,
            status: booking.status,
          })),
        };
      }),
    }));
  }

  async releaseRoomLocks(roomId: string, lockId?: string) {
    const where: any = { roomId };
    if (lockId) where.id = lockId;

    const result = await prisma.inventoryLock.deleteMany({ where });
    logger.info(
      { roomId, lockId },
      "Inventory locks manually released by admin",
    );
    return { count: result.count };
  }

  async cleanupInventoryLocks() {
    const result = await prisma.inventoryLock.deleteMany({
      where: {
        lockUntil: { lt: new Date() },
        // Don't delete permanent admin blocks (year 9999)
        NOT: { lockUntil: { gte: new Date("9990-01-01") } },
      },
    });

    logger.info(
      { count: result.count },
      "Cleanup of expired inventory locks completed",
    );
    return { count: result.count };
  }

  async getAnalytics(range: "7d" | "30d" | "3m") {
    const daysMap = { "7d": 7, "30d": 30, "3m": 90 } as const;
    const days = daysMap[range] ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - days);
    const previousEnd = new Date(startDate);

    const decimalToNumber = (value: Prisma.Decimal | null | undefined) =>
      value ? value.toNumber() : 0;

    const [
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue,
      currentUsers,
      currentProperties,
      currentBookings,
      currentRevenue,
      prevUsers,
      prevProperties,
      prevBookings,
      prevRevenue,
      bookingsInRange,
      paymentsInRange,
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.property.count({ where: { status: "ACTIVE", isDeleted: false } }),
      prisma.booking.count({ where: { isDeleted: false } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: { isDeleted: false, createdAt: { gte: startDate } },
      }),
      prisma.property.count({
        where: { isDeleted: false, createdAt: { gte: startDate } },
      }),
      prisma.booking.count({
        where: { isDeleted: false, createdAt: { gte: startDate } },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: { isDeleted: false, createdAt: { gte: previousStart, lt: previousEnd } },
      }),
      prisma.property.count({
        where: { isDeleted: false, createdAt: { gte: previousStart, lt: previousEnd } },
      }),
      prisma.booking.count({
        where: { isDeleted: false, createdAt: { gte: previousStart, lt: previousEnd } },
      }),
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: previousStart, lt: previousEnd },
        },
        _sum: { amount: true },
      }),
      prisma.booking.findMany({
        where: { isDeleted: false, createdAt: { gte: startDate } },
        select: {
          status: true,
          totalAmount: true,
          cancellationReason: true,
          property: {
            select: {
              city: true,
              name: true,
              rating: true,
              vendor: {
                select: {
                  id: true,
                  businessName: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          status: true,
          method: true,
          errorCode: true,
          errorDesc: true,
        },
      }),
    ]);

    const months: { month: string; start: Date; end: Date }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
        999,
      );
      months.push({
        month: date.toLocaleString("en-US", { month: "short" }),
        start: date,
        end,
      });
    }

    const bookingsByMonth = await Promise.all(
      months.map(async (month) => {
        const count = await prisma.booking.count({
          where: {
            isDeleted: false,
            createdAt: { gte: month.start, lte: month.end },
          },
        });
        return { month: month.month, count };
      }),
    );

    const revenueByMonth = await Promise.all(
      months.map(async (month) => {
        const revenue = await prisma.payment.aggregate({
          where: {
            status: "COMPLETED",
            createdAt: { gte: month.start, lte: month.end },
          },
          _sum: { amount: true },
        });
        return {
          month: month.month,
          amount: revenue._sum.amount?.toNumber() || 0,
        };
      }),
    );

    const topPropertiesRaw = await prisma.property.findMany({
      where: { status: "ACTIVE", isDeleted: false },
      select: {
        name: true,
        bookings: {
          where: { createdAt: { gte: startDate }, isDeleted: false },
          select: { totalAmount: true },
        },
      },
    });

    const topProperties = topPropertiesRaw
      .map((property) => {
        const bookings = property.bookings.length;
        const revenue = property.bookings.reduce(
          (sum, booking) => sum + decimalToNumber(booking.totalAmount as Prisma.Decimal),
          0,
        );
        return {
          name: property.name,
          bookings,
          revenue,
        };
      })
      .filter((property) => property.bookings > 0 || property.revenue > 0)
      .sort((a, b) =>
        b.bookings === a.bookings ? b.revenue - a.revenue : b.bookings - a.bookings,
      )
      .slice(0, 5);

    const cityMap = new Map<string, { city: string; bookings: number; revenue: number }>();
    const vendorMap = new Map<
      string,
      {
        name: string;
        bookings: number;
        revenue: number;
        ratingTotal: number;
        ratingCount: number;
      }
    >();
    const bookingStatusMap = new Map<string, number>();
    const cancellationReasonMap = new Map<string, number>();

    for (const booking of bookingsInRange as any[]) {
      const bookingAmount = decimalToNumber(booking.totalAmount as Prisma.Decimal);
      const city = booking.property?.city ?? "UNKNOWN";
      const cityStats = cityMap.get(city) ?? { city, bookings: 0, revenue: 0 };
      cityStats.bookings += 1;
      cityStats.revenue += bookingAmount;
      cityMap.set(city, cityStats);

      const currentStatusCount = bookingStatusMap.get(booking.status) ?? 0;
      bookingStatusMap.set(booking.status, currentStatusCount + 1);

      if (booking.status === "CANCELLED" || booking.status === "REFUNDED") {
        const reason = booking.cancellationReason || "Unspecified";
        const currentReasonCount = cancellationReasonMap.get(reason) ?? 0;
        cancellationReasonMap.set(reason, currentReasonCount + 1);
      }

      const vendor = booking.property?.vendor;
      if (vendor?.id) {
        const vendorStats = vendorMap.get(vendor.id) ?? {
          name: vendor.businessName,
          bookings: 0,
          revenue: 0,
          ratingTotal: 0,
          ratingCount: 0,
        };
        vendorStats.bookings += 1;
        vendorStats.revenue += bookingAmount;

        const rating = decimalToNumber(booking.property?.rating as Prisma.Decimal);
        if (rating > 0) {
          vendorStats.ratingTotal += rating;
          vendorStats.ratingCount += 1;
        }

        vendorMap.set(vendor.id, vendorStats);
      }
    }

    const failedPayments = (paymentsInRange as any[]).filter(
      (payment) => payment.status === "FAILED",
    );
    const paymentFailureReasonMap = new Map<string, number>();
    const paymentMethodMap = new Map<string, number>();

    for (const payment of paymentsInRange as any[]) {
      const method = payment.method || "UNKNOWN";
      paymentMethodMap.set(method, (paymentMethodMap.get(method) ?? 0) + 1);
    }

    for (const failedPayment of failedPayments) {
      const reason = failedPayment.errorDesc || failedPayment.errorCode || "Unknown";
      paymentFailureReasonMap.set(
        reason,
        (paymentFailureReasonMap.get(reason) ?? 0) + 1,
      );
    }

    const bookingsByCity = Array.from(cityMap.values()).sort(
      (a, b) => b.bookings - a.bookings,
    );
    const vendorPerformance = Array.from(vendorMap.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)
      .map((vendor) => ({
        name: vendor.name,
        bookings: vendor.bookings,
        revenue: Number(vendor.revenue.toFixed(2)),
        rating:
          vendor.ratingCount > 0
            ? Number((vendor.ratingTotal / vendor.ratingCount).toFixed(1))
            : 0,
        responseTime: "N/A",
      }));

    const cancellationTotal = (bookingsInRange as any[]).filter(
      (booking) => booking.status === "CANCELLED" || booking.status === "REFUNDED",
    ).length;
    const paymentFailureTotal = failedPayments.length;
    const totalPaymentsInRange = (paymentsInRange as any[]).length;

    const growth = (current: number, previous: number) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    return {
      totalUsers,
      userGrowth: growth(currentUsers, prevUsers),
      totalProperties,
      propertyGrowth: growth(currentProperties, prevProperties),
      totalBookings,
      bookingGrowth: growth(currentBookings, prevBookings),
      totalRevenue: decimalToNumber(totalRevenue._sum.amount),
      revenueGrowth: growth(
        decimalToNumber(currentRevenue._sum.amount),
        decimalToNumber(prevRevenue._sum.amount),
      ),
      bookingsByMonth,
      revenueByMonth,
      topProperties,
      bookingsByCity,
      vendorPerformance,
      cancellationStats: {
        total: cancellationTotal,
        rate:
          currentBookings === 0
            ? 0
            : Number(((cancellationTotal / currentBookings) * 100).toFixed(1)),
        byReason: Array.from(cancellationReasonMap.entries())
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count),
      },
      paymentFailureStats: {
        total: paymentFailureTotal,
        rate:
          totalPaymentsInRange === 0
            ? 0
            : Number(((paymentFailureTotal / totalPaymentsInRange) * 100).toFixed(1)),
        byReason: Array.from(paymentFailureReasonMap.entries())
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count),
      },
      bookingStatusBreakdown: Array.from(bookingStatusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      paymentMethodBreakdown: Array.from(paymentMethodMap.entries())
        .map(([method, count]) => ({ method, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  // ─── Export Data ───

  async exportData(
    entity:
      | "users"
      | "vendors"
      | "properties"
      | "rooms"
      | "bookings"
      | "services"
      | "temples"
      | "coupons"
      | "platformCities"
      | "platformAmenities"
      | "cancellationPolicies"
      | "payouts"
      | "payments"
      | "refunds"
      | "reviews"
      | "serviceBookings"
      | "supportTickets",
    filters?: {
      status?: string;
      search?: string;
      vendorId?: string;
      bookingId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    switch (entity) {
      case "users": {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            lastLoginAt: true,
          },
        });
        return users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() || "",
        }));
      }
      case "vendors": {
        const vendors = await prisma.vendor.findMany({
          select: {
            id: true,
            businessName: true,
            user: { select: { email: true } },
            isApproved: true,
            commissionRate: true,
            createdAt: true,
          },
        });
        return vendors.map((v) => ({
          id: v.id,
          businessName: v.businessName,
          email: v.user.email,
          isApproved: v.isApproved,
          commissionRate: v.commissionRate.toString(),
          createdAt: v.createdAt.toISOString(),
        }));
      }
      case "properties": {
        const props = await prisma.property.findMany({
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
            status: true,
            reviewCount: true,
            rating: true,
            createdAt: true,
            vendor: { select: { businessName: true } },
          },
        });
        return props.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          city: p.city,
          status: p.status,
          rating: p.rating?.toString() || "",
          reviewCount: p.reviewCount,
          vendor: p.vendor?.businessName || "",
          createdAt: p.createdAt.toISOString(),
        }));
      }
      case "bookings": {
        const b = await prisma.booking.findMany({
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            totalAmount: true,
            checkInDate: true,
            checkOutDate: true,
            createdAt: true,
            property: { select: { name: true } },
            user: { select: { email: true } },
          },
        });
        return b.map((x) => ({
          id: x.id,
          reference: x.bookingNumber,
          status: x.status,
          property: x.property.name,
          userEmail: x.user.email,
          amount: x.totalAmount.toString(),
          checkIn: x.checkInDate.toISOString(),
          checkOut: x.checkOutDate.toISOString(),
          createdAt: x.createdAt.toISOString(),
        }));
      }
      case "payouts": {
        const result = await this.getAllPayouts({
          page: 1,
          limit: 10000,
          ...filters,
        });
        return result.payouts.map((x) => ({
          id: x.id,
          vendor: x.vendor?.businessName || '',
          status: x.status,
          amount: String(x.amount),
          periodStart: x.periodStart ? new Date(x.periodStart).toISOString() : '',
          periodEnd: x.periodEnd ? new Date(x.periodEnd).toISOString() : '',
          processedAt: x.processedAt ? new Date(x.processedAt).toISOString() : "",
          transactionId: x.transactionId || "",
        }));
      }
      case "payments": {
        const result = await this.getAllPayments({
          page: 1,
          limit: 10000,
          ...filters,
        });
        return result.payments.map((x) => ({
          id: x.id,
          bookingNumber: x.bookingNumber || "",
          property: x.propertyName || "",
          amount: String(x.amount),
          status: x.status,
          method: x.method || "",
          razorpayOrderId: x.razorpayOrderId || "",
          razorpayPaymentId: x.razorpayPaymentId || "",
          createdAt: x.createdAt ? new Date(x.createdAt).toISOString() : '',
        }));
      }
      case "refunds": {
        const result = await this.getAllRefunds({
          page: 1,
          limit: 10000,
          ...filters,
        });
        return result.refunds.map((x) => ({
          id: x.id,
          paymentId: x.paymentId,
          bookingNumber: x.bookingNumber || "",
          amount: String(x.amount),
          reason: x.reason || "",
          status: x.status,
          razorpayRefundId: x.razorpayRefundId || "",
          createdAt: x.createdAt ? new Date(x.createdAt).toISOString() : '',
        }));
      }
      case "services": {
        const services = await prisma.service.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            category: true,
            price: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
          },
        });
        return services.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description,
          category: s.category,
          price: String(s.price),
          isActive: s.isActive,
          isVerified: s.isVerified,
          createdAt: s.createdAt.toISOString(),
        }));
      }
      case "temples": {
        const temples = await prisma.temple.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            fullAddress: true,
            deityName: true,
            templeType: true,
            active: true,
            createdAt: true,
          },
        });
        return temples.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          city: t.city,
          fullAddress: t.fullAddress,
          deityName: t.deityName,
          templeType: t.templeType,
          active: t.active,
          createdAt: t.createdAt.toISOString(),
        }));
      }
      case "rooms": {
        const rooms = await prisma.room.findMany({
          select: {
            id: true,
            propertyId: true,
            name: true,
            type: true,
            totalRooms: true,
            availableRooms: true,
            pricePerNight: true,
            weekendPrice: true,
            capacity: true,
            isActive: true,
            createdAt: true,
          },
        });
        return rooms.map((r) => ({
          id: r.id,
          propertyId: r.propertyId,
          name: r.name,
          type: r.type,
          totalRooms: r.totalRooms,
          availableRooms: r.availableRooms,
          pricePerNight: String(r.pricePerNight),
          weekendPrice: r.weekendPrice ? String(r.weekendPrice) : '',
          capacity: r.capacity,
          isActive: r.isActive,
          createdAt: r.createdAt.toISOString(),
        }));
      }
      case "platformCities": {
        const cities = await prisma.platformCity.findMany({
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
          },
        });
        return cities.map((c) => ({
          id: c.id,
          name: c.name,
          isActive: c.isActive,
          createdAt: c.createdAt.toISOString(),
        }));
      }
      case "platformAmenities": {
        const amenities = await prisma.platformAmenity.findMany({
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
          },
        });
        return amenities.map((a) => ({
          id: a.id,
          name: a.name,
          isActive: a.isActive,
          createdAt: a.createdAt.toISOString(),
        }));
      }
      case "coupons": {
        const coupons = await prisma.coupon.findMany({
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
            minBookingAmount: true,
            maxDiscountAmount: true,
            isActive: true,
            validFrom: true,
            validUntil: true,
          },
        });
        return coupons.map((c) => ({
          id: c.id,
          code: c.code,
          discountType: c.discountType,
          discountValue: String(c.discountValue),
          minBookingAmount: c.minBookingAmount ? String(c.minBookingAmount) : '',
          maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : '',
          isActive: c.isActive,
          validFrom: c.validFrom ? c.validFrom.toISOString() : '',
          validUntil: c.validUntil ? c.validUntil.toISOString() : '',
        }));
      }
      case "cancellationPolicies": {
        const policies = await prisma.cancellationPolicy.findMany({
          select: {
            id: true,
            propertyId: true,
            freeBeforeHours: true,
            refundPercentBefore: true,
            refundPercentAfter: true,
            createdAt: true,
          },
        });
        return policies.map((p) => ({
          id: p.id,
          propertyId: p.propertyId,
          freeBeforeHours: p.freeBeforeHours,
          refundPercentBefore: String(p.refundPercentBefore),
          refundPercentAfter: String(p.refundPercentAfter),
          createdAt: p.createdAt.toISOString(),
        }));
      }
      case "reviews": {
        const reviews = await prisma.review.findMany({
          select: {
            id: true,
            propertyId: true,
            userId: true,
            value: true,
            comment: true,
            isVerified: true,
            isDeleted: true,
            createdAt: true,
          },
        });
        return reviews.map((r) => ({
          id: r.id,
          propertyId: r.propertyId,
          userId: r.userId,
          rating: r.value ? String(r.value) : '',
          comment: r.comment || '',
          isVerified: r.isVerified,
          isDeleted: r.isDeleted,
          createdAt: r.createdAt.toISOString(),
        }));
      }
      case "supportTickets": {
        const tickets = await prisma.supportTicket.findMany({
          select: {
            id: true,
            userId: true,
            status: true,
            message: true,
            isDeleted: true,
            createdAt: true,
          },
        });
        return tickets.map((t) => ({
          id: t.id,
          userId: t.userId || '',
          status: t.status,
          message: t.message || '',
          isDeleted: t.isDeleted,
          createdAt: t.createdAt.toISOString(),
        }));
      }
      case "serviceBookings": {
        const bookings = await prisma.serviceBooking.findMany({
          select: {
            id: true,
            bookingNumber: true,
            serviceId: true,
            serviceName: true,
            userId: true,
            serviceCategory: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        });
        return bookings.map((b) => ({
          id: b.id,
          bookingNumber: b.bookingNumber,
          serviceId: b.serviceId || '',
          serviceName: b.serviceName,
          userId: b.userId,
          serviceCategory: b.serviceCategory || '',
          status: b.status,
          totalAmount: b.totalAmount ? String(b.totalAmount) : '',
          createdAt: b.createdAt.toISOString(),
        }));
      }
      default:
        throw new Error("Invalid export entity");
    }
  }

  // ─── Import Data ───

  async importData(
    entity: string,
    data: Record<string, any>[],
    config: any
  ) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const row of data) {
      try {
        const createData: Record<string, any> = {};
        
        for (const column of config.columns) {
          if (column.required && !row[column.key] && !row[column.label]) {
            throw new Error(`Required field ${column.label} is missing`);
          }
          
          if (row[column.key] !== undefined || row[column.label] !== undefined) {
            let value = row[column.key] || row[column.label];
            
            if (column.type === 'number' && value) {
              value = parseFloat(value);
            } else if (column.type === 'boolean') {
              value = String(value).toLowerCase() === 'true' || value === '1' || value === 1;
            }
            
            createData[column.key] = value;
          }
        }

        switch (entity.toLowerCase()) {
          case 'users':
            if (createData.password) {
              createData.passwordHash = await hashPassword(createData.password);
              delete createData.password;
            }
            await prisma.user.create({ data: createData as any });
            break;
          case 'vendors':
            await prisma.vendor.create({ data: createData as any });
            break;
          case 'services':
            if (createData.price) {
              createData.price = createData.price.toString();
            }
            await prisma.service.create({ data: createData as any });
            break;
          case 'temples':
            await prisma.temple.create({ data: createData as any });
            break;
          case 'platformCities':
            await prisma.platformCity.create({ data: createData as any });
            break;
          case 'platformAmenities':
            await prisma.platformAmenity.create({ data: createData as any });
            break;
          case 'coupons':
            if (createData.discountValue) {
              createData.discountValue = createData.discountValue.toString();
            }
            if (createData.minBookingAmount) {
              createData.minBookingAmount = createData.minBookingAmount.toString();
            }
            if (createData.maxDiscountAmount) {
              createData.maxDiscountAmount = createData.maxDiscountAmount.toString();
            }
            await prisma.coupon.create({ data: createData as any });
            break;
          case 'rooms':
            if (createData.basePrice) {
              createData.basePrice = createData.basePrice.toString();
            }
            if (createData.weekendPrice) {
              createData.weekendPrice = createData.weekendPrice.toString();
            }
            await prisma.room.create({ data: createData as any });
            break;
          case 'cancellationPolicies':
            if (createData.refundPercentage) {
              createData.refundPercentage = createData.refundPercentage.toString();
            }
            await prisma.cancellationPolicy.create({ data: createData as any });
            break;
          case 'reviews':
            if (createData.rating) {
              createData.rating = createData.rating.toString();
            }
            await prisma.review.create({ data: createData as any });
            break;
          case 'supportTickets':
            await prisma.supportTicket.create({ data: createData as any });
            break;
          case 'serviceBookings':
            if (createData.totalAmount) {
              createData.totalAmount = createData.totalAmount.toString();
            }
            if (createData.advancePaid) {
              createData.advancePaid = createData.advancePaid.toString();
            }
            await prisma.serviceBooking.create({ data: createData as any });
            break;
          default:
            throw new Error(`Import not supported for entity: ${entity}`);
        }
        
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row failed: ${error.message}`);
      }
    }

    return results;
  }

  // ─── Admin Logs ───

  async getAdminLogs(filters: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.adminId) where.adminId = filters.adminId;
    if (filters.action) where.action = filters.action;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { name: true } } },
      }),
      prisma.adminLog.count({ where }),
    ]);

    return {
      logs: logs.map((log: any) => ({
        id: log.id,
        adminId: log.adminId,
        adminName: log.admin?.name || 'Unknown',
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Audit Logs ───

  async getAuditLogs(filters: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        userName: log.userName || 'Unknown',
        userEmail: log.userEmail || '',
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        changes: log.changes,
        ipAddress: log.ipAddress,
        timestamp: log.timestamp.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── System Health ───

  async getSystemHealth() {
    const start = Date.now();
    let dbStatus = 'healthy';
    let dbResponseTime = 0;

    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
    } catch {
      dbStatus = 'unhealthy';
    }

    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      cpu: {
        usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000000),
      },
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      api: {
        status: 'healthy',
        responseTime: Date.now() - start,
      },
      services: [],
    };
  }

  // ─── Error Logs ───

  async getErrorLogs(filters: {
    page?: number;
    limit?: number;
    level?: string;
    source?: string;
    resolved?: boolean;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.level) where.level = filters.level;
    if (filters.source) where.source = filters.source;
    if (filters.resolved !== undefined) where.resolved = filters.resolved;

    const [errors, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.errorLog.count({ where }),
    ]);

    return {
      errors: errors.map((err: any) => ({
        id: err.id,
        level: err.level,
        message: err.message,
        stack: err.stack,
        source: err.source,
        userId: err.userId,
        requestId: err.requestId,
        timestamp: err.timestamp.toISOString(),
        resolved: err.resolved,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async resolveError(errorId: string) {
    const error = await prisma.errorLog.findUnique({ where: { id: errorId } });
    if (!error) {
      const err = new Error("Error not found");
      (err as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw err;
    }

    await prisma.errorLog.update({
      where: { id: errorId },
      data: { resolved: true },
    });

    return { success: true };
  }

  // ─── Broadcasts ───

  async getBroadcasts(filters: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;

    const [broadcasts, total] = await Promise.all([
      prisma.broadcastNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.broadcastNotification.count({ where }),
    ]);

    return {
      broadcasts: broadcasts.map((b: any) => ({
        id: b.id,
        title: b.title,
        message: b.message,
        targetAudience: b.targetAudience,
        status: b.status,
        scheduledAt: b.scheduledAt?.toISOString(),
        sentAt: b.sentAt?.toISOString(),
        createdBy: b.createdBy || 'System',
        createdAt: b.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createBroadcast(data: {
    title: string;
    message: string;
    targetAudience: 'all' | 'vendors' | 'users';
    scheduledAt?: string;
  }, adminInfo?: { id: string; name: string; email: string }) {
    const createdBy = adminInfo?.id || 'system';

    const broadcast = await prisma.broadcastNotification.create({
      data: {
        title: data.title,
        message: data.message,
        targetAudience: data.targetAudience,
        status: data.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdBy,
      },
    });

    return {
      id: broadcast.id,
      title: broadcast.title,
      message: broadcast.message,
      targetAudience: broadcast.targetAudience,
      status: broadcast.status,
      scheduledAt: broadcast.scheduledAt?.toISOString(),
      createdAt: broadcast.createdAt.toISOString(),
    };
  }

  async cancelBroadcast(broadcastId: string) {
    const broadcast = await prisma.broadcastNotification.findUnique({ where: { id: broadcastId } });
    if (!broadcast) {
      const err = new Error("Broadcast not found");
      (err as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw err;
    }

    await prisma.broadcastNotification.update({
      where: { id: broadcastId },
      data: { status: 'cancelled' },
    });

    return { success: true };
  }

  async deleteBroadcast(broadcastId: string) {
    const broadcast = await prisma.broadcastNotification.findUnique({ where: { id: broadcastId } });
    if (!broadcast) {
      const err = new Error("Broadcast not found");
      (err as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw err;
    }

    await prisma.broadcastNotification.delete({ where: { id: broadcastId } });
  }

  // City Management
  async getCities() {
    return prisma.platformCity.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createCity(name: string) {
    return prisma.platformCity.create({
      data: { name },
    });
  }

  async updateCity(id: string, data: { name?: string; isActive?: boolean }) {
    const city = await prisma.platformCity.findUnique({ where: { id } });
    if (!city) {
      const err = new Error("City not found");
      (err as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw err;
    }

    return prisma.platformCity.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteCity(id: string) {
    const city = await prisma.platformCity.findUnique({ where: { id } });
    if (!city) {
      const err = new Error("City not found");
      (err as any).code = ERROR_CODES.RESOURCE_NOT_FOUND;
      throw err;
    }

    await prisma.platformCity.delete({ where: { id } });
  }
}

export const adminService = new AdminService();
export default adminService;
