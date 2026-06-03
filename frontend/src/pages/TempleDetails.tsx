import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { formatCity } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Clock,
  Loader2,
  MapPin,
  Landmark,
  CalendarDays,
  Ticket,
  Car,
  Accessibility,
  Camera,
  Shield,
  Phone,
  Train,
  Bus,
  Plane,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";

interface TempleDetailsData {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string;
  fullAddress: string;
  landmark?: string;
  description?: string;
  shortDesc?: string;
  deityName?: string;
  templeType?: string;
  builtYear?: string;
  founder?: string;
  architectureStyle?: string;
  uniqueFeatures?: string;
  mythologicalSignificance?: string;
  historicalSignificance?: string;
  associatedLegends?: string;
  // SEO fields from database
  metaTitle?: string;
  metaDescription?: string;
  searchKeywords?: string;
  canonicalUrl?: string;
  openGraphImage?: string;
  structuredDataJsonLd?: string;
  sacredNearby?: string;
  darshanTimings?: Array<{
    day?: string;
    morningOpen?: string;
    morningClose?: string;
    eveningOpen?: string;
    eveningClose?: string;
  }>;
  morningAarti?: string;
  afternoonAarti?: string;
  eveningAarti?: string;
  specialSevas?: string;
  festivalSpecificTimings?: string;
  generalEntryFee?: string;
  specialDarshanFee?: string;
  vipDarshanFee?: string;
  dressCodeMen?: string;
  dressCodeWomen?: string;
  mobileRestrictions?: string;
  securityNotes?: string;
  majorFestivals?: string;
  festivalDates?: string;
  annualBrahmotsavam?: string;
  rathotsavamDetails?: string;
  specialPoojas?: string;
  crowdExpectationLevel?: string;
  bestMonths?: string;
  bestTimeOfDay?: string;
  peakCrowdDays?: string;
  avoidDays?: string;
  weatherConditions?: string;
  nearbyTemples?: string;
  nearbyHotels?: string;
  nearbyRestaurants?: string;
  nearbyBeachesOrHills?: string;
  distanceRailwayStation?: string;
  distanceBusStand?: string;
  distanceAirport?: string;
  devoteeTips?: string;
  thingsToCarry?: string;
  thingsNotAllowed?: string;
  idealVisitDuration?: string;
  suggestedItinerary?: string;
  localFoodRecommendations?: string;
  templeOfficePhone?: string;
  emergencyContact?: string;
  lostAndFoundDesk?: string;
  medicalFacilityNearby?: string;
  policeStationNearby?: string;
  parkingAvailable?: boolean;
  wheelchairAccessible?: boolean;
  cloakroomAvailable?: boolean;
  restroomsAvailable?: boolean;
  drinkingWaterAvailable?: boolean;
  prasadamCounterAvailable?: boolean;
  photographyAllowed?: boolean;
  images?: Array<string | { url?: string; isPrimary?: boolean }>;
}

const parseList = (value?: string) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) || [];

const asImageUrl = (image: string | { url?: string; isPrimary?: boolean }) =>
  typeof image === "string" ? image : image?.url;

const asDayLabel = (day?: string) => {
  if (!day) return "Everyday";
  return day.charAt(0).toUpperCase() + day.slice(1);
};

const normalizeDay = (day?: string) => (day || "").trim().toLowerCase();

const TempleDetails = () => {
  const { id } = useParams();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const [temple, setTemple] = useState<TempleDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedTimingDay, setSelectedTimingDay] = useState("");

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    api.temples
      .getById(id)
      .then((result: any) => {
        const data = result?.data || result;
        setTemple(data);
      })
      .catch((err: any) => setError(err?.message || "Temple not found"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const templeImages = useMemo(() => {
    if (!temple?.images?.length) return [];
    return temple.images.map(asImageUrl).filter(Boolean) as string[];
  }, [temple?.images]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [templeImages.length, temple?.id]);

  const timingOptions = useMemo(() => {
    return (temple?.darshanTimings || []).map((timing, index) => ({
      key: normalizeDay(timing.day) || `day-${index}`,
      label: asDayLabel(timing.day),
      timing,
    }));
  }, [temple?.darshanTimings]);

  useEffect(() => {
    if (!timingOptions.length) {
      setSelectedTimingDay("");
      return;
    }

    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const todayMatch = timingOptions.find((option) => option.key === today);
    setSelectedTimingDay(todayMatch?.key || timingOptions[0].key);
  }, [timingOptions]);

  const selectedTiming = useMemo(() => {
    if (!timingOptions.length) return undefined;
    return timingOptions.find((option) => option.key === selectedTimingDay)?.timing || timingOptions[0].timing;
  }, [timingOptions, selectedTimingDay]);

  const nearbyTemples = parseList(temple?.nearbyTemples);
  const nearbyHotels = parseList(temple?.nearbyHotels);
  const nearbyRestaurants = parseList(temple?.nearbyRestaurants);
  const nearbyNature = parseList(temple?.nearbyBeachesOrHills);
  const mapQuery = temple?.fullAddress || temple?.landmark || `${formatCity(temple?.city || "")} temple`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  const liked = temple ? isInWishlist(temple.id, "temple") : false;

  const handleToggleLike = () => {
    if (!temple) return;

    toggleWishlist({
      id: temple.id,
      type: "temple",
      name: temple.name,
      location: formatCity(temple.city),
      image: templeImages[0] || "",
    });

    toast({
      title: liked ? "Removed from wishlist" : "Added to wishlist",
      description: liked ? "This temple is no longer in your wishlist." : "This temple was added to your wishlist.",
    });
  };

  // Parse database JSON-LD if available
  const parsedJsonLd = useMemo(() => {
    if (temple?.structuredDataJsonLd) {
      try {
        return JSON.parse(temple.structuredDataJsonLd);
      } catch {
        return null;
      }
    }
    return null;
  }, [temple?.structuredDataJsonLd]);

  // Default JSON-LD schema for temple
  const defaultJsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Place",
    name: temple?.name,
    image: templeImages,
    address: {
      "@type": "PostalAddress",
      addressLocality: formatCity(temple?.city || ""),
      addressRegion: temple?.state || "Andhra Pradesh",
      streetAddress: temple?.fullAddress || temple?.landmark || "",
      addressCountry: "IN",
    },
    url: `https://hosthaven.in/temples/${id}`,
  }), [temple, templeImages, id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !temple) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-4">Temple Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The temple you're looking for doesn't exist."}</p>
          <Link to="/temples">
            <Button variant="gold">Back to Temples</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={temple.metaTitle || `${temple.name} Temple - ${formatCity(temple.city)}`}
        description={temple.metaDescription || `${temple.name} in ${formatCity(temple.city)}. Find darshan timings, location details, facilities, and visitor tips on HostHaven.`}
        keywords={temple.searchKeywords || `${temple.name}, ${formatCity(temple.city).toLowerCase()} temple, darshan timings, HostHaven temples`}
        canonical={temple.canonicalUrl || `https://hosthaven.in/temples/${temple.slug || id}`}
        ogImage={temple.openGraphImage || templeImages[0] || "/logo.png"}
        jsonLd={parsedJsonLd || defaultJsonLd}
      />
      <div className="py-4 md:py-6">
        <div className="container mx-auto px-4 sm:px-6">
          <Link
            to="/temples"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Temples
          </Link>

          <div className="relative rounded-2xl overflow-hidden mb-4 md:mb-6 aspect-[4/3] md:aspect-[16/8] lg:aspect-[21/9] bg-muted">
            <img
              src={templeImages[activeImageIndex] || "https://images.unsplash.com/photo-1621427642694-46e7f7e4db14?w=1200"}
              alt={temple.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-heritage-brown/85 via-heritage-brown/20 to-transparent" />

            {templeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev - 1 + templeImages.length) % templeImages.length)
                  }
                  className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 h-8 w-8 md:h-9 md:w-9 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev + 1) % templeImages.length)}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 h-8 w-8 md:h-9 md:w-9 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </>
            )}
          </div>

          {templeImages.length > 1 && (
            <div className="flex justify-center gap-2 mb-6">
              {templeImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === activeImageIndex ? "w-6 bg-primary" : "w-2.5 bg-muted-foreground/40"
                    }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}

          <div className="mb-6 bg-card rounded-2xl shadow-card p-4 md:p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-block px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded-full">
                {formatCity(temple.city)}
              </span>
              {temple.templeType && (
                <span className="inline-block px-3 py-1 bg-muted text-foreground text-xs font-medium rounded-full">
                  {temple.templeType}
                </span>
              )}
            </div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">{temple.name}</h1>
              <button
                type="button"
                onClick={handleToggleLike}
                title={liked ? "Remove from wishlist" : "Add to wishlist"}
                aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                className="h-10 w-10 rounded-full bg-muted/70 hover:bg-muted flex items-center justify-center transition-colors"
              >
                <Heart className={`w-5 h-5 ${liked ? "text-primary fill-primary" : "text-foreground"}`} />
              </button>
            </div>
            <p className="text-muted-foreground mt-1">Deity: {temple.deityName || "Not specified"}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl shadow-card p-4 md:p-5">
                <h2 className="text-xl font-serif font-semibold mb-3 pb-2 border-b-2 border-gold/60">Overview</h2>
                {temple.shortDesc && (
                  <p className="text-foreground font-medium text-base mb-3 leading-snug">
                    {temple.shortDesc}
                  </p>
                )}
                {temple.description && (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {temple.description}
                  </p>
                )}
                {!temple.shortDesc && !temple.description && (
                  <p className="text-muted-foreground">Temple description not available.</p>
                )}
              </div>

              <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-4">
                <h2 className="text-xl font-serif font-semibold pb-2 border-b-2 border-gold/60">Address & Location</h2>
                <div className="space-y-3">
                  {(temple.fullAddress || temple.landmark) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Address</p>
                        <p className="text-muted-foreground">{temple.fullAddress || temple.landmark}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">City</p>
                      <p className="text-muted-foreground">{formatCity(temple.city)}</p>
                    </div>
                  </div>
                  {temple.state && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">State</p>
                        <p className="text-muted-foreground">{temple.state}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-4">
                <h2 className="text-xl font-serif font-semibold pb-2 border-b-2 border-gold/60">Get Directions</h2>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-xl text-gold-dark font-semibold transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  Open in Google Maps
                </a>
                <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Temple Location"
                    className="w-full h-full"
                  />
                </div>
              </div>

              {(temple.mythologicalSignificance || temple.historicalSignificance || temple.associatedLegends) && (
                <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-4">
                  <h2 className="text-xl font-serif font-semibold pb-2 border-b-2 border-gold/60">Spiritual & Historical Significance</h2>
                  {temple.mythologicalSignificance && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 pb-1 border-b border-gold/30">Mythological Significance</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{temple.mythologicalSignificance}</p>
                    </div>
                  )}
                  {temple.historicalSignificance && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 pb-1 border-b border-gold/30">Historical Significance</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{temple.historicalSignificance}</p>
                    </div>
                  )}
                  {temple.associatedLegends && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 pb-1 border-b border-gold/30">Associated Legends</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{temple.associatedLegends}</p>
                    </div>
                  )}
                </div>
              )}

              {(timingOptions.length > 0 || temple.morningAarti || temple.afternoonAarti || temple.eveningAarti || temple.specialSevas || temple.festivalSpecificTimings) && (
                <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-4">
                  <h2 className="text-xl font-serif font-semibold pb-2 border-b-2 border-gold/60">Timings & Rituals</h2>
                  {timingOptions.length ? (
                    <div className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        {timingOptions.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setSelectedTimingDay(option.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedTimingDay === option.key
                              ? "gradient-gold text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {selectedTiming && (
                        <div className="p-3 rounded-xl bg-muted/60 text-sm">
                          <p className="font-semibold text-foreground mb-1">{asDayLabel(selectedTiming.day)}</p>
                          <p className="text-muted-foreground">
                            Morning: {selectedTiming.morningOpen && selectedTiming.morningClose ? `${selectedTiming.morningOpen} - ${selectedTiming.morningClose}` : "N/A"}
                          </p>
                          <p className="text-muted-foreground">
                            Evening: {selectedTiming.eveningOpen && selectedTiming.eveningClose ? `${selectedTiming.eveningOpen} - ${selectedTiming.eveningClose}` : "N/A"}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Darshan timings not available.</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {temple.morningAarti && <p><span className="font-semibold">Morning Aarti:</span> {temple.morningAarti}</p>}
                    {temple.afternoonAarti && <p><span className="font-semibold">Afternoon Aarti:</span> {temple.afternoonAarti}</p>}
                    {temple.eveningAarti && <p><span className="font-semibold">Evening Aarti:</span> {temple.eveningAarti}</p>}
                    {temple.specialSevas && <p><span className="font-semibold">Special Sevas:</span> {temple.specialSevas}</p>}
                    {temple.festivalSpecificTimings && <p className="md:col-span-2"><span className="font-semibold">Festival Timings:</span> {temple.festivalSpecificTimings}</p>}
                  </div>
                </div>
              )}

              {(temple.generalEntryFee || temple.specialDarshanFee || temple.vipDarshanFee || temple.dressCodeMen || temple.dressCodeWomen || temple.mobileRestrictions || temple.securityNotes || temple.parkingAvailable || temple.wheelchairAccessible || temple.cloakroomAvailable || temple.restroomsAvailable || temple.drinkingWaterAvailable || temple.prasadamCounterAvailable || temple.photographyAllowed !== undefined) && (
                <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-4">
                  <h2 className="text-xl font-serif font-semibold pb-2 border-b-2 border-gold/60">Entry, Rules & Facilities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {(temple.generalEntryFee || temple.specialDarshanFee || temple.vipDarshanFee) && (
                      <div className="md:col-span-2">
                        <p><span className="font-semibold">General Entry:</span> {temple.generalEntryFee || "Free"}</p>
                        {temple.specialDarshanFee && <p><span className="font-semibold">Special Darshan:</span> {temple.specialDarshanFee}</p>}
                        {temple.vipDarshanFee && <p><span className="font-semibold">VIP Darshan:</span> {temple.vipDarshanFee}</p>}
                      </div>
                    )}
                    {temple.dressCodeMen && <p><span className="font-semibold">Dress Code (Men):</span> {temple.dressCodeMen}</p>}
                    {temple.dressCodeWomen && <p><span className="font-semibold">Dress Code (Women):</span> {temple.dressCodeWomen}</p>}
                    {temple.mobileRestrictions && <p className="md:col-span-2"><span className="font-semibold">Mobile Restrictions:</span> {temple.mobileRestrictions}</p>}
                    {temple.securityNotes && <p className="md:col-span-2"><span className="font-semibold">Security Notes:</span> {temple.securityNotes}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {temple.parkingAvailable && <span className="px-2.5 py-1 rounded-full text-xs bg-muted inline-flex items-center gap-1"><Car className="w-3 h-3" />Parking</span>}
                    {temple.wheelchairAccessible && <span className="px-2.5 py-1 rounded-full text-xs bg-muted inline-flex items-center gap-1"><Accessibility className="w-3 h-3" />Wheelchair Accessible</span>}
                    {temple.cloakroomAvailable && <span className="px-2.5 py-1 rounded-full text-xs bg-muted">Cloakroom</span>}
                    {temple.restroomsAvailable && <span className="px-2.5 py-1 rounded-full text-xs bg-muted">Restrooms</span>}
                    {temple.drinkingWaterAvailable && <span className="px-2.5 py-1 rounded-full text-xs bg-muted">Drinking Water</span>}
                    {temple.prasadamCounterAvailable && <span className="px-2.5 py-1 rounded-full text-xs bg-muted">Prasadam Counter</span>}
                    {temple.photographyAllowed !== undefined && (
                      <span className="px-2.5 py-1 rounded-full text-xs bg-muted inline-flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {temple.photographyAllowed ? "Photography Allowed" : "No Photography"}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {(temple.majorFestivals || temple.festivalDates || temple.annualBrahmotsavam || temple.rathotsavamDetails || temple.specialPoojas) && (
                <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-3">
                  <h2 className="text-xl font-serif font-semibold pb-2 border-b-2 border-gold/60">Festivals & Special Events</h2>
                  {temple.majorFestivals && <p><span className="font-semibold">Major Festivals:</span> {temple.majorFestivals}</p>}
                  {temple.festivalDates && <p><span className="font-semibold">Festival Dates:</span> {temple.festivalDates}</p>}
                  {temple.annualBrahmotsavam && <p><span className="font-semibold">Annual Brahmotsavam:</span> {temple.annualBrahmotsavam}</p>}
                  {temple.rathotsavamDetails && <p><span className="font-semibold">Rathotsavam Details:</span> {temple.rathotsavamDetails}</p>}
                  {temple.specialPoojas && <p><span className="font-semibold">Special Poojas:</span> {temple.specialPoojas}</p>}
                </div>
              )}

              {(temple.devoteeTips || temple.thingsToCarry || temple.thingsNotAllowed || temple.idealVisitDuration || temple.suggestedItinerary || temple.localFoodRecommendations) && (
                <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-3">
                  <h2 className="text-xl font-serif font-semibold pb-2 border-b-2 border-gold/60">Devotee Guide</h2>
                  {temple.devoteeTips && <p><span className="font-semibold">Tips:</span> {temple.devoteeTips}</p>}
                  {temple.thingsToCarry && <p><span className="font-semibold">Things to Carry:</span> {temple.thingsToCarry}</p>}
                  {temple.thingsNotAllowed && <p><span className="font-semibold">Not Allowed:</span> {temple.thingsNotAllowed}</p>}
                  {temple.idealVisitDuration && <p><span className="font-semibold">Ideal Visit Duration:</span> {temple.idealVisitDuration}</p>}
                  {temple.suggestedItinerary && <p><span className="font-semibold">Suggested Itinerary:</span> {temple.suggestedItinerary}</p>}
                  {temple.localFoodRecommendations && <p><span className="font-semibold">Local Food:</span> {temple.localFoodRecommendations}</p>}
                </div>
              )}
            </div>

            <div className="lg:col-span-1 space-y-6">
              {(temple.deityName || temple.templeType || temple.builtYear || temple.founder || temple.architectureStyle || temple.uniqueFeatures || temple.sacredNearby) && (
                <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-3 xl:sticky xl:top-24">
                  <h3 className="text-lg font-serif font-semibold pb-2 border-b-2 border-gold/60">Temple Facts</h3>
                  {temple.deityName && <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><Landmark className="w-4 h-4 text-primary" /> Deity: {temple.deityName}</p>}
                  {temple.templeType && <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Type:</span> {temple.templeType}</p>}
                  {temple.builtYear && <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Built Year:</span> {temple.builtYear}</p>}
                  {temple.founder && <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Founder:</span> {temple.founder}</p>}
                  {temple.architectureStyle && <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Architecture:</span> {temple.architectureStyle}</p>}
                  {temple.uniqueFeatures && <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Unique Features:</span> {temple.uniqueFeatures}</p>}
                  {temple.sacredNearby && <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Sacred Nearby:</span> {temple.sacredNearby}</p>}
                </div>
              )}

              {(temple.bestMonths || temple.bestTimeOfDay || temple.peakCrowdDays || temple.avoidDays || temple.weatherConditions || temple.crowdExpectationLevel) && (
                <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-3">
                  <h3 className="text-lg font-serif font-semibold pb-2 border-b-2 border-gold/60 inline-flex items-center gap-2"><CalendarDays className="w-5 h-5 text-gold" /> Best Time to Visit</h3>
                  {temple.bestMonths && <p className="text-sm"><span className="font-semibold">Best Months:</span> {temple.bestMonths}</p>}
                  {temple.bestTimeOfDay && <p className="text-sm"><span className="font-semibold">Best Time of Day:</span> {temple.bestTimeOfDay}</p>}
                  {temple.peakCrowdDays && <p className="text-sm"><span className="font-semibold">Peak Crowd Days:</span> {temple.peakCrowdDays}</p>}
                  {temple.avoidDays && <p className="text-sm"><span className="font-semibold">Avoid Days:</span> {temple.avoidDays}</p>}
                  {temple.weatherConditions && <p className="text-sm"><span className="font-semibold">Weather:</span> {temple.weatherConditions}</p>}
                  {temple.crowdExpectationLevel && <p className="text-sm"><span className="font-semibold">Crowd Level:</span> {temple.crowdExpectationLevel}</p>}
                </div>
              )}

              {(nearbyTemples.length > 0 || nearbyHotels.length > 0 || nearbyRestaurants.length > 0 || nearbyNature.length > 0 || temple.distanceRailwayStation || temple.distanceBusStand || temple.distanceAirport) && (
                <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-3">
                  <h3 className="text-lg font-serif font-semibold pb-2 border-b-2 border-gold/60">Nearby & Transit</h3>
                  {nearbyTemples.length > 0 && <p className="text-sm"><span className="font-semibold">Nearby Temples:</span> {nearbyTemples.join(", ")}</p>}
                  {nearbyHotels.length > 0 && <p className="text-sm"><span className="font-semibold">Nearby Hotels:</span> {nearbyHotels.join(", ")}</p>}
                  {nearbyRestaurants.length > 0 && <p className="text-sm"><span className="font-semibold">Nearby Restaurants:</span> {nearbyRestaurants.join(", ")}</p>}
                  {nearbyNature.length > 0 && <p className="text-sm"><span className="font-semibold">Beaches/Hills:</span> {nearbyNature.join(", ")}</p>}
                  {temple.distanceRailwayStation && <p className="text-sm inline-flex items-center gap-2"><Train className="w-4 h-4 text-primary" /> Railway: {temple.distanceRailwayStation}</p>}
                  {temple.distanceBusStand && <p className="text-sm inline-flex items-center gap-2"><Bus className="w-4 h-4 text-primary" /> Bus Stand: {temple.distanceBusStand}</p>}
                  {temple.distanceAirport && <p className="text-sm inline-flex items-center gap-2"><Plane className="w-4 h-4 text-primary" /> Airport: {temple.distanceAirport}</p>}
                  <Link to="/hotels" className="block pt-2">
                    <Button variant="gold" className="w-full">Book Nearby Stay</Button>
                  </Link>
                </div>
              )}

              {(temple.templeOfficePhone || temple.emergencyContact || temple.lostAndFoundDesk || temple.medicalFacilityNearby || temple.policeStationNearby) && (
                <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-3">
                  <h3 className="text-lg font-serif font-semibold pb-2 border-b-2 border-gold/60 inline-flex items-center gap-2"><Phone className="w-5 h-5 text-gold" /> Contacts & Emergency</h3>
                  {temple.templeOfficePhone && <p className="text-sm"><span className="font-semibold">Temple Office:</span> {temple.templeOfficePhone}</p>}
                  {temple.emergencyContact && <p className="text-sm"><span className="font-semibold">Emergency Contact:</span> {temple.emergencyContact}</p>}
                  {temple.lostAndFoundDesk && <p className="text-sm"><span className="font-semibold">Lost & Found:</span> {temple.lostAndFoundDesk}</p>}
                  {temple.medicalFacilityNearby && <p className="text-sm"><span className="font-semibold">Medical Facility:</span> {temple.medicalFacilityNearby}</p>}
                  {temple.policeStationNearby && <p className="text-sm"><span className="font-semibold">Police Station:</span> {temple.policeStationNearby}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TempleDetails;
