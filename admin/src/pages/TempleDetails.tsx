import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Image as ImageIcon,
  Phone,
  Clock,
  Calendar,
  Info,
  Car,
  Accessibility,
  Camera,
  Utensils,
  Star,
  DollarSign,
  Building,
  Activity,
} from "lucide-react";
import { templesService, type Temple } from "../lib/temples";
import { PageHeader } from "../components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { PageLoader } from "../components/ui/PageLoader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";

export default function TempleDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [temple, setTemple] = useState<Temple | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | null
  >(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getTempleImage = (image: Temple["images"] extends Array<infer T>
    ? T
    : never) => {
    if (!image) {
      return { url: "", alt: "" };
    }

    if (typeof image === "string") {
      return { url: image, alt: "" };
    }

    return {
      url: image.url || "",
      alt: image.alt || "",
    };
  };

  const fetchTemple = async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await templesService.getTempleBySlug(slug);
      setTemple(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Unable to load temple details.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemple();
  }, [slug]);

  const confirmStatusChange = async () => {
    if (!temple || !confirmAction) return;
    try {
      if (confirmAction === "activate") {
        await templesService.activateTemple(temple.slug);
        setTemple({ ...temple, active: true });
        toast.success("Temple activated successfully.");
      } else {
        await templesService.deactivateTemple(temple.slug);
        setTemple({ ...temple, active: false });
        toast.success("Temple deactivated successfully.");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Unable to update temple status.",
      );
    } finally {
      setConfirmAction(null);
    }
  };

  const handleDelete = async () => {
    if (!temple) return;
    try {
      await templesService.deleteTemple(temple.slug);
      toast.success("Temple deleted successfully.");
      navigate("/temples");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Unable to delete temple.",
      );
    } finally {
      setConfirmDelete(false);
    }
  };

  if (isLoading) {
    return <PageLoader rows={6} />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load temple"
        description={error}
        action={
          <button
            type="button"
            onClick={fetchTemple}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (!temple) {
    return (
      <EmptyState
        title="Temple not found"
        description="This temple record does not exist."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/temples")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <PageHeader
          title={temple.name}
          description={temple.fullAddress || temple.city}
          actions={
            <StatusBadge
              label={temple.active ? "Active" : "Inactive"}
              variant={temple.active ? "success" : "neutral"}
            />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-slate-700">
                {temple.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">City:</span> {temple.city}
                  </div>
                )}
                {temple.landmark && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">Landmark:</span>{" "}
                    {temple.landmark}
                  </div>
                )}
                {temple.deityName && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">Deity:</span>{" "}
                    {temple.deityName}
                  </div>
                )}
                {temple.templeType && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">Temple Type:</span>{" "}
                    {temple.templeType}
                  </div>
                )}
                {temple.builtYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">Built Year:</span>{" "}
                    {temple.builtYear}
                  </div>
                )}
                {temple.architectureStyle && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">Architecture:</span>{" "}
                    {temple.architectureStyle}
                  </div>
                )}
                {temple.founder && (
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">Founder:</span>{" "}
                    {temple.founder}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {temple.description || "No description available."}
              </p>
              {temple.shortDesc && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-slate-900">
                    Short Description:
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {temple.shortDesc}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Temple Images</CardTitle>
            </CardHeader>
            <CardContent>
              {(temple.images ?? []).length > 0 ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {temple.images?.map((img, index) => {
                    const image = getTempleImage(img);

                    if (!image.url) {
                      return null;
                    }

                    return (
                      <div
                        key={index}
                        className="overflow-hidden rounded-lg border border-slate-200"
                      >
                        <img
                          src={image.url}
                          alt={image.alt || `${temple.name} image ${index + 1}`}
                          className="h-32 w-full object-cover"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 py-8">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">
                      No images uploaded yet
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {(temple.darshanTimings ||
            temple.morningAarti ||
            temple.afternoonAarti ||
            temple.eveningAarti) && (
              <Card>
                <CardHeader>
                  <CardTitle>Darshan Timings & Aarti</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-slate-700">
                    {temple.morningAarti && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Morning Aarti:</span>{" "}
                        {temple.morningAarti}
                      </div>
                    )}
                    {temple.afternoonAarti && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Afternoon Aarti:</span>{" "}
                        {temple.afternoonAarti}
                      </div>
                    )}
                    {temple.eveningAarti && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Evening Aarti:</span>{" "}
                        {temple.eveningAarti}
                      </div>
                    )}
                    {temple.specialSevas && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="font-medium text-slate-900 mb-2">
                          Special Sevas:
                        </p>
                        <p className="text-slate-600">{temple.specialSevas}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {(temple.generalEntryFee ||
            temple.specialDarshanFee ||
            temple.vipDarshanFee) && (
              <Card>
                <CardHeader>
                  <CardTitle>Fees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-slate-700">
                    {temple.generalEntryFee && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">General Entry:</span>{" "}
                        {temple.generalEntryFee}
                      </div>
                    )}
                    {temple.specialDarshanFee && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Special Darshan:</span>{" "}
                        {temple.specialDarshanFee}
                      </div>
                    )}
                    {temple.vipDarshanFee && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">VIP Darshan:</span>{" "}
                        {temple.vipDarshanFee}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {(temple.historicalSignificance ||
            temple.mythologicalSignificance ||
            temple.associatedLegends) && (
              <Card>
                <CardHeader>
                  <CardTitle>Historical & Mythological Significance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {temple.historicalSignificance && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Historical Significance
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.historicalSignificance}
                      </p>
                    </div>
                  )}
                  {temple.mythologicalSignificance && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Mythological Significance
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.mythologicalSignificance}
                      </p>
                    </div>
                  )}
                  {temple.associatedLegends && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Associated Legends
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.associatedLegends}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {temple.majorFestivals && (
            <Card>
              <CardHeader>
                <CardTitle>Festivals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">Major Festivals:</span>{" "}
                    {temple.majorFestivals}
                  </div>
                  {temple.festivalDates && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">Festival Dates:</span>{" "}
                      {temple.festivalDates}
                    </div>
                  )}
                  {temple.annualBrahmotsavam && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">
                        Annual Brahmotsavam:
                      </span>{" "}
                      {temple.annualBrahmotsavam}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {(temple.bestMonths ||
            temple.bestTimeOfDay ||
            temple.idealVisitDuration ||
            temple.peakCrowdDays ||
            temple.avoidDays ||
            temple.weatherConditions) && (
              <Card>
                <CardHeader>
                  <CardTitle>Visitor Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-slate-700">
                    {temple.bestMonths && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Best Months:</span>{" "}
                        {temple.bestMonths}
                      </div>
                    )}
                    {temple.bestTimeOfDay && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                          Best Time of Day:
                        </span>{" "}
                        {temple.bestTimeOfDay}
                      </div>
                    )}
                    {temple.idealVisitDuration && (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                          Ideal Visit Duration:
                        </span>{" "}
                        {temple.idealVisitDuration}
                      </div>
                    )}
                    {temple.peakCrowdDays && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Peak Crowd Days:</span>{" "}
                        {temple.peakCrowdDays}
                      </div>
                    )}
                    {temple.avoidDays && (
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Days to Avoid:</span>{" "}
                        {temple.avoidDays}
                      </div>
                    )}
                    {temple.weatherConditions && (
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                          Weather Conditions:
                        </span>{" "}
                        {temple.weatherConditions}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {(temple.dressCodeMen ||
            temple.dressCodeWomen ||
            temple.thingsToCarry ||
            temple.thingsNotAllowed) && (
              <Card>
                <CardHeader>
                  <CardTitle>Visitor Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {temple.dressCodeMen && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Dress Code (Men):
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.dressCodeMen}
                      </p>
                    </div>
                  )}
                  {temple.dressCodeWomen && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Dress Code (Women):
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.dressCodeWomen}
                      </p>
                    </div>
                  )}
                  {temple.thingsToCarry && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Things to Carry:
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.thingsToCarry}
                      </p>
                    </div>
                  )}
                  {temple.thingsNotAllowed && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Things Not Allowed:
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.thingsNotAllowed}
                      </p>
                    </div>
                  )}
                  {temple.mobileRestrictions && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Mobile Restrictions:
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.mobileRestrictions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {(temple.nearbyTemples ||
            temple.nearbyRestaurants ||
            temple.nearbyHotels ||
            temple.nearbyBeachesOrHills) && (
              <Card>
                <CardHeader>
                  <CardTitle>Nearby Places</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {temple.nearbyTemples && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Nearby Temples:
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.nearbyTemples}
                      </p>
                    </div>
                  )}
                  {temple.nearbyRestaurants && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Nearby Restaurants:
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.nearbyRestaurants}
                      </p>
                    </div>
                  )}
                  {temple.nearbyHotels && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Nearby Hotels:
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.nearbyHotels}
                      </p>
                    </div>
                  )}
                  {temple.nearbyBeachesOrHills && (
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        Nearby Beaches/Hills:
                      </p>
                      <p className="text-sm text-slate-600">
                        {temple.nearbyBeachesOrHills}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {(temple.distanceRailwayStation ||
            temple.distanceBusStand ||
            temple.distanceAirport) && (
              <Card>
                <CardHeader>
                  <CardTitle>Distance from Transport</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-slate-700">
                    {temple.distanceRailwayStation && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Railway Station:</span>{" "}
                        {temple.distanceRailwayStation}
                      </div>
                    )}
                    {temple.distanceBusStand && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Bus Stand:</span>{" "}
                        {temple.distanceBusStand}
                      </div>
                    )}
                    {temple.distanceAirport && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">Airport:</span>{" "}
                        {temple.distanceAirport}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {temple.parkingAvailable !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Car className="h-4 w-4" />
                      Parking
                    </span>
                    <span
                      className={
                        temple.parkingAvailable
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      {temple.parkingAvailable ? "Available" : "Not Available"}
                    </span>
                  </div>
                )}
                {temple.wheelchairAccessible !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Accessibility className="h-4 w-4" />
                      Wheelchair
                    </span>
                    <span
                      className={
                        temple.wheelchairAccessible
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      {temple.wheelchairAccessible
                        ? "Accessible"
                        : "Not Accessible"}
                    </span>
                  </div>
                )}
                {temple.cloakroomAvailable !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Activity className="h-4 w-4" />
                      Cloakroom
                    </span>
                    <span
                      className={
                        temple.cloakroomAvailable
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      {temple.cloakroomAvailable
                        ? "Available"
                        : "Not Available"}
                    </span>
                  </div>
                )}
                {temple.restroomsAvailable !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Building className="h-4 w-4" />
                      Restrooms
                    </span>
                    <span
                      className={
                        temple.restroomsAvailable
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      {temple.restroomsAvailable
                        ? "Available"
                        : "Not Available"}
                    </span>
                  </div>
                )}
                {temple.drinkingWaterAvailable !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Info className="h-4 w-4" />
                      Drinking Water
                    </span>
                    <span
                      className={
                        temple.drinkingWaterAvailable
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      {temple.drinkingWaterAvailable
                        ? "Available"
                        : "Not Available"}
                    </span>
                  </div>
                )}
                {temple.prasadamCounterAvailable !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Utensils className="h-4 w-4" />
                      Prasadam
                    </span>
                    <span
                      className={
                        temple.prasadamCounterAvailable
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      {temple.prasadamCounterAvailable
                        ? "Available"
                        : "Not Available"}
                    </span>
                  </div>
                )}
                {temple.photographyAllowed !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <Camera className="h-4 w-4" />
                      Photography
                    </span>
                    <span
                      className={
                        temple.photographyAllowed
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    >
                      {temple.photographyAllowed ? "Allowed" : "Not Allowed"}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(temple.emergencyContact || temple.templeOfficePhone) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-slate-700">
                  {temple.emergencyContact && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">Emergency:</span>{" "}
                      {temple.emergencyContact}
                    </div>
                  )}
                  {temple.templeOfficePhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">Office:</span>{" "}
                      {temple.templeOfficePhone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate(`/temples/${temple.slug}/edit`)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit Temple
                </button>
                {temple.active ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("deactivate")}
                    className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Deactivate Temple
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmAction("activate")}
                    className="w-full rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
                  >
                    Activate Temple
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                >
                  Delete Temple
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-slate-500">
                <p>
                  Created: {new Date(temple.createdAt).toLocaleDateString()}
                </p>
                <p>
                  Updated: {new Date(temple.updatedAt).toLocaleDateString()}
                </p>
                {temple.slug && <p className="truncate">Slug: {temple.slug}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={
          confirmAction === "activate"
            ? "Activate this temple?"
            : "Deactivate this temple?"
        }
        description={
          confirmAction === "activate"
            ? "The temple will be visible to users."
            : "The temple will be hidden from listings."
        }
        confirmText={
          confirmAction === "activate" ? "Activate temple" : "Deactivate temple"
        }
        variant={confirmAction === "activate" ? "default" : "danger"}
        onConfirm={confirmStatusChange}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this temple?"
        description="This action is permanent and cannot be undone. The temple will be removed from all listings."
        confirmText="Delete temple"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
