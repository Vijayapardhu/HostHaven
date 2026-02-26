import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { templesService } from '../lib/temples'
import { mediaUploadService } from '../lib/mediaUpload'
import { templeAutofillService } from '../lib/templeAutofill'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { EmptyState } from '../components/ui/EmptyState'

type DarshanTiming = {
  day: string
  morningOpen: string
  morningClose: string
  eveningOpen: string
  eveningClose: string
}

type TempleImage = {
  url: string
  alt: string
  isPrimary: boolean
}

type PlaceSearchResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

type TempleFormValues = {
  name: string
  slug: string
  city: 'Vijayawada' | 'Nandiyala' | 'Vetlapalem' | ''
  fullAddress: string
  landmark: string
  description: string
  shortDescription: string
  latitude: string
  longitude: string
  deityName: string

  templeType: string
  builtYear: string
  founder: string
  mythologicalSignificance: string
  historicalSignificance: string
  architectureStyle: string
  uniqueFeatures: string
  sacredNearby: string
  associatedLegends: string

  darshanTimings: DarshanTiming[]
  morningAarti: string
  afternoonAarti: string
  eveningAarti: string
  specialSevas: string
  festivalSpecificTimings: string

  generalEntryFee: string
  specialDarshanFee: string
  vipDarshanFee: string
  parkingAvailable: boolean
  wheelchairAccessible: boolean
  cloakroomAvailable: boolean
  restroomsAvailable: boolean
  drinkingWaterAvailable: boolean
  prasadamCounterAvailable: boolean
  photographyAllowed: boolean
  mobileRestrictions: string
  dressCodeMen: string
  dressCodeWomen: string
  securityNotes: string

  majorFestivals: string
  festivalDates: string
  annualBrahmotsavam: string
  rathotsavamDetails: string
  crowdExpectationLevel: string
  specialPoojas: string
  specialDecorationDays: string

  bestMonths: string
  bestTimeOfDay: string
  peakCrowdDays: string
  avoidDays: string
  weatherConditions: string

  nearbyTemples: string
  nearbyBeachesOrHills: string
  nearbyRestaurants: string
  nearbyHotels: string
  distanceRailwayStation: string
  distanceBusStand: string
  distanceAirport: string

  images: TempleImage[]
  videos: string[]
  virtualTourUrl: string

  metaTitle: string
  metaDescription: string
  searchKeywords: string
  canonicalUrl: string
  openGraphImage: string
  structuredDataJsonLd: string

  devoteeTips: string
  thingsToCarry: string
  thingsNotAllowed: string
  idealVisitDuration: string
  suggestedItinerary: string
  localFoodRecommendations: string
  faqs: string

  emergencyContact: string
  templeOfficePhone: string
  lostAndFoundDesk: string
  medicalFacilityNearby: string
  policeStationNearby: string

  active: boolean
}

const CITY_OPTIONS: Array<TempleFormValues['city']> = ['Vijayawada', 'Nandiyala', 'Vetlapalem']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const emptyTiming = (): DarshanTiming => ({
  day: 'Monday',
  morningOpen: '05:00',
  morningClose: '12:00',
  eveningOpen: '16:00',
  eveningClose: '21:00',
})

const emptyImage = (): TempleImage => ({
  url: '',
  alt: '',
  isPrimary: false,
})

const getInitialValues = (): TempleFormValues => ({
  name: '',
  slug: '',
  city: '',
  fullAddress: '',
  landmark: '',
  description: '',
  shortDescription: '',
  latitude: '',
  longitude: '',
  deityName: '',

  templeType: '',
  builtYear: '',
  founder: '',
  mythologicalSignificance: '',
  historicalSignificance: '',
  architectureStyle: '',
  uniqueFeatures: '',
  sacredNearby: '',
  associatedLegends: '',

  darshanTimings: [emptyTiming()],
  morningAarti: '',
  afternoonAarti: '',
  eveningAarti: '',
  specialSevas: '',
  festivalSpecificTimings: '',

  generalEntryFee: '',
  specialDarshanFee: '',
  vipDarshanFee: '',
  parkingAvailable: false,
  wheelchairAccessible: false,
  cloakroomAvailable: false,
  restroomsAvailable: false,
  drinkingWaterAvailable: false,
  prasadamCounterAvailable: false,
  photographyAllowed: false,
  mobileRestrictions: '',
  dressCodeMen: '',
  dressCodeWomen: '',
  securityNotes: '',

  majorFestivals: '',
  festivalDates: '',
  annualBrahmotsavam: '',
  rathotsavamDetails: '',
  crowdExpectationLevel: '',
  specialPoojas: '',
  specialDecorationDays: '',

  bestMonths: '',
  bestTimeOfDay: '',
  peakCrowdDays: '',
  avoidDays: '',
  weatherConditions: '',

  nearbyTemples: '',
  nearbyBeachesOrHills: '',
  nearbyRestaurants: '',
  nearbyHotels: '',
  distanceRailwayStation: '',
  distanceBusStand: '',
  distanceAirport: '',

  images: [emptyImage(), emptyImage(), emptyImage(), emptyImage(), emptyImage()],
  videos: [''],
  virtualTourUrl: '',

  metaTitle: '',
  metaDescription: '',
  searchKeywords: '',
  canonicalUrl: '',
  openGraphImage: '',
  structuredDataJsonLd: '',

  devoteeTips: '',
  thingsToCarry: '',
  thingsNotAllowed: '',
  idealVisitDuration: '',
  suggestedItinerary: '',
  localFoodRecommendations: '',
  faqs: '',

  emergencyContact: '',
  templeOfficePhone: '',
  lostAndFoundDesk: '',
  medicalFacilityNearby: '',
  policeStationNearby: '',

  active: true,
})

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function AddTemple() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<TempleFormValues>(getInitialValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false)
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const [mapSearchResults, setMapSearchResults] = useState<PlaceSearchResult[]>([])
  const [isMapSearching, setIsMapSearching] = useState(false)
  const [mapSearchError, setMapSearchError] = useState('')
  const [isAIAutofilling, setIsAIAutofilling] = useState(false)
  const [aiAdditionalContext, setAiAdditionalContext] = useState('')
  const imageInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const videoInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null)
  const [uploadingVideoIndex, setUploadingVideoIndex] = useState<number | null>(null)
  const [isBulkUploadingImages, setIsBulkUploadingImages] = useState(false)
  const [activeStep, setActiveStep] = useState(1)
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(1)

  const stepTitles = [
    'Basic information',
    'Media',
    'Spiritual details',
    'Timings',
    'Facilities',
    'Festivals',
    'Visit planning',
    'Nearby attractions',
    'SEO',
    'Devotee experience',
  ]

  const longDescriptionWordCount = useMemo(
    () => formValues.description.trim().split(/\s+/).filter(Boolean).length,
    [formValues.description],
  )

  const uploadedImageCount = useMemo(
    () => formValues.images.filter((image) => image.url.trim().length > 0).length,
    [formValues.images],
  )

  const hasPrimaryImage = useMemo(
    () => formValues.images.some((image) => image.url.trim().length > 0 && image.isPrimary),
    [formValues.images],
  )

  const preferredMediaImageUrl = useMemo(
    () =>
      formValues.images.find((image) => image.url.trim().length > 0 && image.isPrimary)?.url?.trim() ||
      formValues.images.find((image) => image.url.trim().length > 0)?.url?.trim() ||
      '',
    [formValues.images],
  )

  const basicStepComplete = useMemo(
    () =>
      Boolean(
        formValues.name.trim() &&
          formValues.city &&
          formValues.fullAddress.trim() &&
          formValues.latitude.trim() &&
          formValues.longitude.trim(),
      ),
    [formValues.name, formValues.city, formValues.fullAddress, formValues.latitude, formValues.longitude],
  )

  const aiLocationReady = useMemo(
    () =>
      Boolean(
        formValues.name.trim() &&
          formValues.city &&
          formValues.fullAddress.trim() &&
          formValues.latitude.trim() &&
          formValues.longitude.trim(),
      ),
    [formValues.name, formValues.city, formValues.fullAddress, formValues.latitude, formValues.longitude],
  )

  const selectedLat = Number(formValues.latitude)
  const selectedLng = Number(formValues.longitude)
  const hasValidCoordinates = Number.isFinite(selectedLat) && Number.isFinite(selectedLng)

  const mapEmbedUrl = hasValidCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${selectedLng - 0.02}%2C${selectedLat - 0.02}%2C${selectedLng + 0.02}%2C${selectedLat + 0.02}&layer=mapnik&marker=${selectedLat}%2C${selectedLng}`
    : 'https://www.openstreetmap.org/export/embed.html?bbox=78.3%2C14.8%2C81.0%2C17.4&layer=mapnik'

  const fileNameWithoutExtension = (filename: string) => {
    const parts = filename.split('.')
    parts.pop()
    return parts.join('.') || filename
  }

  useEffect(() => {
    if (!preferredMediaImageUrl) return
    if (formValues.openGraphImage === preferredMediaImageUrl) return

    setFormValues((prev) => ({
      ...prev,
      openGraphImage: preferredMediaImageUrl,
    }))
  }, [preferredMediaImageUrl, formValues.openGraphImage])

  const loadTemple = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await templesService.getTempleById(id)
      const cityCandidate = data.city?.charAt(0).toUpperCase() + data.city?.slice(1).toLowerCase()
      setFormValues((prev) => ({
        ...prev,
        name: data.name,
        slug: slugify(data.name),
        description: data.description,
        shortDescription: data.shortDesc || data.description?.slice(0, 150) || '',
        city: CITY_OPTIONS.includes(cityCandidate as TempleFormValues['city'])
          ? (cityCandidate as TempleFormValues['city'])
          : '',
        fullAddress: data.fullAddress || '',
        latitude: data.latitude != null ? String(data.latitude) : '',
        longitude: data.longitude != null ? String(data.longitude) : '',
        images:
          Array.isArray(data.images) && data.images.length > 0
            ? data.images.map((url, index) => ({
                url: typeof url === 'string' ? url : String(url || ''),
                alt: `${data.name} image ${index + 1}`,
                isPrimary: index === 0,
              }))
            : prev.images,
        active: data.active,
      }))
      setMaxUnlockedStep(10)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load temple details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTemple()
  }, [id])

  const handleChange = (key: keyof TempleFormValues, value: string | boolean | DarshanTiming[] | TempleImage[] | string[]) => {
    setFormValues((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'name') {
        next.slug = slugify(value as string)
      }
      return next
    })
    setFieldErrors((prev) => {
      const next = { ...prev, [key]: '' }
      if (key === 'latitude' || key === 'longitude') {
        next.coordinates = ''
      }
      return next
    })
  }

  const searchMapPlaces = async () => {
    const query = mapSearchQuery.trim()
    if (!query) {
      setMapSearchError('Enter a place name to search.')
      setMapSearchResults([])
      return
    }

    setIsMapSearching(true)
    setMapSearchError('')

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(query)}`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch map results.')
      }

      const data = (await response.json()) as PlaceSearchResult[]
      setMapSearchResults(data)

      if (data.length === 0) {
        setMapSearchError('No locations found. Try a nearby landmark or full address.')
      }
    } catch (err: any) {
      setMapSearchError(err?.message || 'Unable to search location right now.')
      setMapSearchResults([])
    } finally {
      setIsMapSearching(false)
    }
  }

  const pickMapLocation = (result: PlaceSearchResult) => {
    handleChange('latitude', result.lat)
    handleChange('longitude', result.lon)
    if (!formValues.fullAddress.trim()) {
      handleChange('fullAddress', result.display_name)
    }
    setMapSearchError('')
    toast.success('Location selected. Latitude and longitude updated.')
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formValues.name.trim()) errors.name = 'Temple name is required.'
    if (!formValues.city) errors.city = 'City is required.'
    if (!formValues.fullAddress.trim()) errors.fullAddress = 'Full address is required.'
    if (!formValues.description.trim()) errors.description = 'Long description is required.'
    if (longDescriptionWordCount < 100) {
      errors.description = 'Please provide a richer description (at least 100 words).'
    }
    if (formValues.shortDescription.trim().length < 40 || formValues.shortDescription.trim().length > 160) {
      errors.shortDescription = 'Short description must be between 40 and 160 characters.'
    }
    if (!formValues.deityName.trim()) errors.deityName = 'Deity name is required.'
    if (!formValues.latitude.trim() || !formValues.longitude.trim()) {
      errors.coordinates = 'Latitude and longitude are required.'
    }

    const validImageCount = formValues.images.filter((image) => image.url.trim().length > 0).length
    if (validImageCount < 5) {
      errors.images = 'Please provide at least 5 temple images.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleTimingChange = (index: number, key: keyof DarshanTiming, value: string) => {
    const next = [...formValues.darshanTimings]
    next[index] = { ...next[index], [key]: value }
    handleChange('darshanTimings', next)
  }

  const handleImageChange = (index: number, key: keyof TempleImage, value: string | boolean) => {
    const next = [...formValues.images]
    if (key === 'isPrimary' && value) {
      for (let pointer = 0; pointer < next.length; pointer += 1) {
        next[pointer] = { ...next[pointer], isPrimary: false }
      }
    }
    next[index] = { ...next[index], [key]: value }
    handleChange('images', next)
  }

  const handleVideoChange = (index: number, value: string) => {
    const next = [...formValues.videos]
    next[index] = value
    handleChange('videos', next)
  }

  const handleImageFilePick = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImageIndex(index)
    try {
      const uploaded = await mediaUploadService.uploadSingle(file, {
        folder: 'hosthaven/temples/images',
        resourceType: 'image',
      })

      const next = [...formValues.images]
      next[index] = {
        ...next[index],
        url: uploaded.url,
        alt: next[index].alt || fileNameWithoutExtension(file.name),
      }

      if (!next.some((item) => item.isPrimary)) {
        next[index].isPrimary = true
      }

      handleChange('images', next)
      toast.success('Image uploaded successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Failed to upload image.')
    } finally {
      setUploadingImageIndex(null)
      event.target.value = ''
    }
  }

  const handleBulkImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    setIsBulkUploadingImages(true)
    try {
      const uploadedAssets = await mediaUploadService.uploadMultiple(files, {
        folder: 'hosthaven/temples/images',
        resourceType: 'image',
      })

      const next = [...formValues.images]
      let pointer = 0
      for (let index = 0; index < next.length && pointer < uploadedAssets.length; index += 1) {
        if (!next[index].url) {
          next[index] = {
            ...next[index],
            url: uploadedAssets[pointer].url,
            alt: next[index].alt || fileNameWithoutExtension(files[pointer].name),
          }
          pointer += 1
        }
      }

      while (pointer < uploadedAssets.length) {
        next.push({
          url: uploadedAssets[pointer].url,
          alt: fileNameWithoutExtension(files[pointer].name),
          isPrimary: false,
        })
        pointer += 1
      }

      if (!next.some((item) => item.isPrimary) && next.length > 0) {
        next[0].isPrimary = true
      }

      handleChange('images', next)
      toast.success(`${uploadedAssets.length} image(s) uploaded successfully.`)
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Failed to upload images.')
    } finally {
      setIsBulkUploadingImages(false)
      event.target.value = ''
    }
  }

  const handleVideoFilePick = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingVideoIndex(index)
    try {
      const uploaded = await mediaUploadService.uploadSingle(file, {
        folder: 'hosthaven/temples/videos',
        resourceType: 'video',
      })

      const next = [...formValues.videos]
      next[index] = uploaded.url
      handleChange('videos', next)

      toast.success('Video uploaded successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Failed to upload video.')
    } finally {
      setUploadingVideoIndex(null)
      event.target.value = ''
    }
  }

  const handleAIAutofill = async () => {
    if (!aiLocationReady) {
      toast.error('Temple name, city, full address, and map coordinates are required for accurate AI generation.')
      return
    }

    setIsAIAutofilling(true)
    try {
      const result = await templeAutofillService.generate({
        templeName: formValues.name,
        city: formValues.city,
        additionalContext:
          [
            `Full address: ${formValues.fullAddress}`,
            `Landmark: ${formValues.landmark}`,
            `Latitude: ${formValues.latitude}`,
            `Longitude: ${formValues.longitude}`,
            aiAdditionalContext,
          ]
            .filter((item) => Boolean(item && String(item).trim()))
            .join(' | ') || undefined,
        forceComplete: false,
      })

      const draft = (result?.draft || {}) as Record<string, unknown>

      setFormValues((prev) => {
        const next = { ...prev }

        const stringKeys: Array<keyof TempleFormValues> = [
          'name',
          'city',
          'fullAddress',
          'landmark',
          'description',
          'shortDescription',
          'latitude',
          'longitude',
          'deityName',
          'templeType',
          'builtYear',
          'founder',
          'mythologicalSignificance',
          'historicalSignificance',
          'architectureStyle',
          'uniqueFeatures',
          'sacredNearby',
          'associatedLegends',
          'morningAarti',
          'afternoonAarti',
          'eveningAarti',
          'specialSevas',
          'festivalSpecificTimings',
          'generalEntryFee',
          'specialDarshanFee',
          'vipDarshanFee',
          'mobileRestrictions',
          'dressCodeMen',
          'dressCodeWomen',
          'securityNotes',
          'majorFestivals',
          'festivalDates',
          'annualBrahmotsavam',
          'rathotsavamDetails',
          'crowdExpectationLevel',
          'specialPoojas',
          'specialDecorationDays',
          'bestMonths',
          'bestTimeOfDay',
          'peakCrowdDays',
          'avoidDays',
          'weatherConditions',
          'nearbyTemples',
          'nearbyBeachesOrHills',
          'nearbyRestaurants',
          'nearbyHotels',
          'distanceRailwayStation',
          'distanceBusStand',
          'distanceAirport',
          'virtualTourUrl',
          'metaTitle',
          'metaDescription',
          'searchKeywords',
          'canonicalUrl',
          'openGraphImage',
          'structuredDataJsonLd',
          'devoteeTips',
          'thingsToCarry',
          'thingsNotAllowed',
          'idealVisitDuration',
          'suggestedItinerary',
          'localFoodRecommendations',
          'faqs',
          'emergencyContact',
          'templeOfficePhone',
          'lostAndFoundDesk',
          'medicalFacilityNearby',
          'policeStationNearby',
        ]

        const booleanKeys: Array<keyof TempleFormValues> = [
          'parkingAvailable',
          'wheelchairAccessible',
          'cloakroomAvailable',
          'restroomsAvailable',
          'drinkingWaterAvailable',
          'prasadamCounterAvailable',
          'photographyAllowed',
        ]

        for (const key of stringKeys) {
          const value = draft[key as string]
          if (typeof value === 'string' && value.trim().length > 0) {
            ;(next[key] as string) = value.trim()
          }
        }

        for (const key of booleanKeys) {
          const value = draft[key as string]
          if (typeof value === 'boolean') {
            ;(next[key] as boolean) = value
          }
        }

        const draftTimings = draft.darshanTimings
        if (Array.isArray(draftTimings) && draftTimings.length > 0) {
          const normalizedTimings = draftTimings
            .map((item) => {
              const row = item as Record<string, unknown>
              return {
                day: String(row.day || '').trim() || 'Monday',
                morningOpen: String(row.morningOpen || '').trim() || '05:00',
                morningClose: String(row.morningClose || '').trim() || '12:00',
                eveningOpen: String(row.eveningOpen || '').trim() || '16:00',
                eveningClose: String(row.eveningClose || '').trim() || '21:00',
              }
            })
            .filter((row) => row.day.length > 0)

          if (normalizedTimings.length > 0) {
            next.darshanTimings = normalizedTimings
          }
        }

        next.slug = slugify(next.name)
        return next
      })

      setFieldErrors((prev) => ({
        ...prev,
        name: '',
        city: '',
        fullAddress: '',
        description: '',
        shortDescription: '',
        deityName: '',
        coordinates: '',
      }))

      const report = result?.prefillReport
      if (report) {
        const coverage = `${report.filledFields}/${report.totalFields}`
        const pass2Note = report.pass2Attempted
          ? ` Second pass filled ${report.pass2FilledFields} fields.`
          : ''

        if (report.missingFields.length > 0) {
          toast.warning(
            `AI autofill completed with ${coverage} fields.${pass2Note} ${report.missingFields.length} fields still need manual input.`,
          )
        } else {
          toast.success(`AI autofill completed with full coverage (${coverage}).${pass2Note}`)
        }
      } else if (result?.confidenceNote) {
        toast.success(`AI autofill completed: ${result.confidenceNote}`)
      } else {
        toast.success('AI autofill completed.')
      }
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to run AI autofill.'
      toast.error(message)
    } finally {
      setIsAIAutofilling(false)
    }
  }

  const goToStep = (step: number) => {
    if (step <= maxUnlockedStep) {
      setActiveStep(step)
    }
  }

  const handleNextStep = () => {
    if (activeStep === 1 && !basicStepComplete) {
      toast.error('Complete temple name and location fields in Basic Information first.')
      return
    }

    if (activeStep === 2) {
      if (uploadedImageCount < 5) {
        toast.error('Please upload at least 5 temple images before continuing.')
        return
      }
      if (!hasPrimaryImage) {
        toast.error('Mark one uploaded image as primary.')
        return
      }
    }

    const nextStep = Math.min(activeStep + 1, 10)
    setActiveStep(nextStep)
    setMaxUnlockedStep((prev) => Math.max(prev, nextStep))
  }

  const handlePreviousStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return
    setIsSaving(true)

    const cityEnum =
      formValues.city === 'Vijayawada'
        ? 'VIJAYAWADA'
        : formValues.city === 'Nandiyala'
          ? 'NANDIYALA'
          : 'VETLAPALEM'

    const payload = {
      name: formValues.name,
      slug: formValues.slug || slugify(formValues.name),
      fullAddress: formValues.fullAddress,
      landmark: formValues.landmark,
      description: formValues.description,
      shortDesc: formValues.shortDescription,
      city: cityEnum,
      latitude: Number(formValues.latitude),
      longitude: Number(formValues.longitude),
      deityName: formValues.deityName,
      templeType: formValues.templeType,
      builtYear: formValues.builtYear,
      founder: formValues.founder,
      mythologicalSignificance: formValues.mythologicalSignificance,
      historicalSignificance: formValues.historicalSignificance,
      architectureStyle: formValues.architectureStyle,
      uniqueFeatures: formValues.uniqueFeatures,
      sacredNearby: formValues.sacredNearby,
      associatedLegends: formValues.associatedLegends,
      darshanTimings: formValues.darshanTimings,
      morningAarti: formValues.morningAarti,
      afternoonAarti: formValues.afternoonAarti,
      eveningAarti: formValues.eveningAarti,
      specialSevas: formValues.specialSevas,
      festivalSpecificTimings: formValues.festivalSpecificTimings,
      generalEntryFee: formValues.generalEntryFee,
      specialDarshanFee: formValues.specialDarshanFee,
      vipDarshanFee: formValues.vipDarshanFee,
      parkingAvailable: formValues.parkingAvailable,
      wheelchairAccessible: formValues.wheelchairAccessible,
      cloakroomAvailable: formValues.cloakroomAvailable,
      restroomsAvailable: formValues.restroomsAvailable,
      drinkingWaterAvailable: formValues.drinkingWaterAvailable,
      prasadamCounterAvailable: formValues.prasadamCounterAvailable,
      photographyAllowed: formValues.photographyAllowed,
      mobileRestrictions: formValues.mobileRestrictions,
      dressCodeMen: formValues.dressCodeMen,
      dressCodeWomen: formValues.dressCodeWomen,
      securityNotes: formValues.securityNotes,
      majorFestivals: formValues.majorFestivals,
      festivalDates: formValues.festivalDates,
      annualBrahmotsavam: formValues.annualBrahmotsavam,
      rathotsavamDetails: formValues.rathotsavamDetails,
      crowdExpectationLevel: formValues.crowdExpectationLevel,
      specialPoojas: formValues.specialPoojas,
      specialDecorationDays: formValues.specialDecorationDays,
      bestMonths: formValues.bestMonths,
      bestTimeOfDay: formValues.bestTimeOfDay,
      peakCrowdDays: formValues.peakCrowdDays,
      avoidDays: formValues.avoidDays,
      weatherConditions: formValues.weatherConditions,
      nearbyTemples: formValues.nearbyTemples,
      nearbyBeachesOrHills: formValues.nearbyBeachesOrHills,
      nearbyRestaurants: formValues.nearbyRestaurants,
      nearbyHotels: formValues.nearbyHotels,
      distanceRailwayStation: formValues.distanceRailwayStation,
      distanceBusStand: formValues.distanceBusStand,
      distanceAirport: formValues.distanceAirport,
      images: formValues.images.filter((image) => image.url).map((image) => image.url),
      videos: formValues.videos.filter(Boolean),
      virtualTourUrl: formValues.virtualTourUrl,
      metaTitle: formValues.metaTitle,
      metaDescription: formValues.metaDescription,
      searchKeywords: formValues.searchKeywords,
      canonicalUrl: formValues.canonicalUrl,
      openGraphImage: preferredMediaImageUrl || formValues.openGraphImage,
      structuredDataJsonLd: formValues.structuredDataJsonLd,
      devoteeTips: formValues.devoteeTips,
      thingsToCarry: formValues.thingsToCarry,
      thingsNotAllowed: formValues.thingsNotAllowed,
      idealVisitDuration: formValues.idealVisitDuration,
      suggestedItinerary: formValues.suggestedItinerary,
      localFoodRecommendations: formValues.localFoodRecommendations,
      faqs: formValues.faqs,
      emergencyContact: formValues.emergencyContact,
      templeOfficePhone: formValues.templeOfficePhone,
      lostAndFoundDesk: formValues.lostAndFoundDesk,
      medicalFacilityNearby: formValues.medicalFacilityNearby,
      policeStationNearby: formValues.policeStationNearby,
      active: formValues.active,
    }

    try {
      if (id) {
        await templesService.updateTemple(id, payload)
        toast.success('Temple updated successfully.')
      } else {
        await templesService.createTemple(payload)
        toast.success('Temple created successfully.')
      }
      navigate('/temples')
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Unable to save temple.'
      if (String(message).toLowerCase().includes('not supported')) {
        toast.error('Backend temple create/update is not enabled yet. Form design is ready for integration.')
      } else {
        toast.error(message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <PageLoader rows={6} />
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load temple"
        description={error}
        action={
          <button
            type="button"
            onClick={loadTemple}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? 'Edit temple' : 'Add temple'}
        description="Premium temple content model for spiritual, travel and SEO-rich experience."
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Guided flow</p>
        <p className="mt-1 text-xs text-slate-500">Complete one section at a time using Previous / Continue buttons.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {stepTitles.map((step, index) => {
            const stepNumber = index + 1
            const isActive = stepNumber === activeStep
            const isUnlocked = stepNumber <= maxUnlockedStep

            return (
              <button
                key={step}
                type="button"
                onClick={() => goToStep(stepNumber)}
                disabled={!isUnlocked}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : isUnlocked
                      ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {stepNumber}. {step}
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className={activeStep === 1 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>1) Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-slate-600">Temple name</label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {fieldErrors.name ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p> : null}
              </div>
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-700">AI Accurate Autofill (Name + Location Required)</p>
                <p className="mt-1 text-xs text-slate-500">
                  Generates detailed, accuracy-first non-media fields from temple name + city + address + map coordinates.
                  Avoids forced placeholder filling when data is uncertain.
                </p>
                <input
                  type="text"
                  value={aiAdditionalContext}
                  onChange={(event) => setAiAdditionalContext(event.target.value)}
                  placeholder="Optional context (official source, language preference, ritual focus)"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Required before run: temple name, city, full address, and selected map coordinates.
                </p>
                <button
                  type="button"
                  onClick={handleAIAutofill}
                  disabled={isAIAutofilling || !aiLocationReady}
                  className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isAIAutofilling ? 'Generating accurate details...' : 'Generate Accurate Details'}
                </button>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">City</label>
                <select
                  value={formValues.city}
                  onChange={(event) => handleChange('city', event.target.value as TempleFormValues['city'])}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select city</option>
                  {CITY_OPTIONS.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {fieldErrors.city ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.city}</p> : null}
              </div>
              <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Slug auto-generated from temple name: <span className="font-semibold text-slate-700">{formValues.slug || '—'}</span>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Full address</label>
                <input
                  type="text"
                  value={formValues.fullAddress}
                  onChange={(event) => handleChange('fullAddress', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {fieldErrors.fullAddress ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.fullAddress}</p> : null}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Landmark</label>
                <input
                  type="text"
                  value={formValues.landmark}
                  onChange={(event) => handleChange('landmark', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Deity name</label>
                <input
                  type="text"
                  value={formValues.deityName}
                  onChange={(event) => handleChange('deityName', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {fieldErrors.deityName ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.deityName}</p> : null}
              </div>
              <div className="md:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Map picker</p>
                    <p className="text-xs text-slate-500">
                      Search a place, pick it, and auto-fill latitude/longitude.
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Selected coordinates: {formValues.latitude || '—'}, {formValues.longitude || '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen((prev) => !prev)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {isMapPickerOpen ? 'Hide map picker' : 'Open map picker'}
                  </button>
                </div>

                {isMapPickerOpen ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row">
                      <input
                        type="text"
                        value={mapSearchQuery}
                        onChange={(event) => setMapSearchQuery(event.target.value)}
                        placeholder="Search place e.g. Kanaka Durga Temple Vijayawada"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            searchMapPlaces()
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={searchMapPlaces}
                          disabled={isMapSearching}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {isMapSearching ? 'Searching...' : 'Search'}
                        </button>
                      </div>
                    </div>

                    {mapSearchError ? <p className="text-xs text-rose-600">{mapSearchError}</p> : null}

                    {mapSearchResults.length > 0 ? (
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                        {mapSearchResults.map((result) => (
                          <button
                            key={result.place_id}
                            type="button"
                            onClick={() => pickMapLocation(result)}
                            className="w-full rounded-lg border border-slate-200 p-2 text-left text-sm hover:bg-slate-50"
                          >
                            <p className="font-medium text-slate-700">{result.display_name}</p>
                            <p className="text-xs text-slate-500">
                              Lat: {Number(result.lat).toFixed(6)}, Lng: {Number(result.lon).toFixed(6)}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <iframe
                        title="Temple location map preview"
                        src={mapEmbedUrl}
                        className="h-72 w-full"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Short description (40-160 chars)</label>
                <textarea
                  value={formValues.shortDescription}
                  onChange={(event) => handleChange('shortDescription', event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">{formValues.shortDescription.length}/160 characters</p>
                {fieldErrors.shortDescription ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.shortDescription}</p> : null}
              </div>
              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-slate-600">Long description (rich, informative)</label>
                <textarea
                  value={formValues.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  rows={8}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">Word count: {longDescriptionWordCount}</p>
                {fieldErrors.description ? (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
                ) : null}
              </div>
              {fieldErrors.coordinates ? <p className="md:col-span-3 text-xs text-rose-600">{fieldErrors.coordinates}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 2 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>2) Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-700">Upload to cloud storage</p>
                  <label className="inline-flex cursor-pointer items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    {isBulkUploadingImages ? 'Uploading images...' : 'Upload multiple images'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleBulkImageUpload}
                      disabled={isBulkUploadingImages}
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">Upload images/videos using picker only. Manual URL entry is disabled.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">Images uploaded: {uploadedImageCount}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">Primary image: {hasPrimaryImage ? 'Set' : 'Missing'}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">Videos: {formValues.videos.filter(Boolean).length}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Temple images (minimum 5)</p>
                {fieldErrors.images ? <p className="text-xs text-rose-600">{fieldErrors.images}</p> : null}
                {formValues.images.map((image, index) => (
                  <div key={`image-${index}`} className="rounded-lg border border-slate-200 p-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        {image.url ? (
                          <img src={image.url} alt={image.alt || `Temple image ${index + 1}`} className="h-28 w-full object-cover" />
                        ) : (
                          <div className="flex h-28 items-center justify-center text-xs text-slate-500">No image uploaded</div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-slate-600">Alt text</label>
                        <input
                          type="text"
                          value={image.alt}
                          onChange={(event) => {
                            const nextImages = [...formValues.images]
                            nextImages[index] = {
                              ...nextImages[index],
                              alt: event.target.value,
                            }
                            handleChange('images', nextImages)
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          placeholder="Describe the uploaded image"
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => imageInputRefs.current[index]?.click()}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            disabled={uploadingImageIndex === index}
                          >
                            {uploadingImageIndex === index ? 'Uploading...' : image.url ? 'Replace image' : 'Upload image'}
                          </button>
                          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={image.isPrimary}
                              onChange={(event) => {
                                const nextImages = formValues.images.map((item, imageIndex) => ({
                                  ...item,
                                  isPrimary: imageIndex === index ? event.target.checked : false,
                                }))
                                handleChange('images', nextImages)
                              }}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            Primary image
                          </label>
                          {formValues.images.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const nextImages = formValues.images.filter((_, imageIndex) => imageIndex !== index)
                                handleChange('images', nextImages.length > 0 ? nextImages : [emptyImage()])
                              }}
                              className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                        <input
                          ref={(node) => {
                            imageInputRefs.current[index] = node
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => handleImageFilePick(index, event)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('images', [...formValues.images, emptyImage()])}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    + Add image slot
                  </button>
                  {formValues.images.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleChange('images', formValues.images.slice(0, -1))}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Remove last slot
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Temple videos</p>
                {formValues.videos.map((video, index) => (
                  <div key={`video-${index}`} className="rounded-lg border border-slate-200 p-3">
                    {video ? (
                      <video src={video} controls className="h-40 w-full rounded-lg border border-slate-200 bg-black/90" />
                    ) : (
                      <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                        No video uploaded
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => videoInputRefs.current[index]?.click()}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        disabled={uploadingVideoIndex === index}
                      >
                        {uploadingVideoIndex === index ? 'Uploading...' : video ? 'Replace video' : 'Upload video'}
                      </button>
                      {formValues.videos.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const nextVideos = formValues.videos.filter((_, videoIndex) => videoIndex !== index)
                            handleChange('videos', nextVideos.length > 0 ? nextVideos : [''])
                          }}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      ) : null}
                      <input
                        ref={(node) => {
                          videoInputRefs.current[index] = node
                        }}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(event) => handleVideoFilePick(index, event)}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleChange('videos', [...formValues.videos, ''])} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">+ Add video slot</button>
                  {formValues.videos.length > 1 ? (
                    <button type="button" onClick={() => handleChange('videos', formValues.videos.slice(0, -1))} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Remove last slot</button>
                  ) : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 3 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>3) Spiritual & Historical Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-slate-600">Temple type</label>
                <input type="text" value={formValues.templeType} onChange={(event) => handleChange('templeType', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Shiva / Vishnu / Devi / Subramanya" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Built year</label>
                <input type="text" value={formValues.builtYear} onChange={(event) => handleChange('builtYear', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Founder</label>
                <input type="text" value={formValues.founder} onChange={(event) => handleChange('founder', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-slate-600">Mythological significance</label>
                <textarea value={formValues.mythologicalSignificance} onChange={(event) => handleChange('mythologicalSignificance', event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-slate-600">Historical significance</label>
                <textarea value={formValues.historicalSignificance} onChange={(event) => handleChange('historicalSignificance', event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Architecture style</label>
                <input type="text" value={formValues.architectureStyle} onChange={(event) => handleChange('architectureStyle', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Unique features</label>
                <input type="text" value={formValues.uniqueFeatures} onChange={(event) => handleChange('uniqueFeatures', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Sacred rivers / hills nearby</label>
                <input type="text" value={formValues.sacredNearby} onChange={(event) => handleChange('sacredNearby', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-slate-600">Associated legends</label>
                <textarea value={formValues.associatedLegends} onChange={(event) => handleChange('associatedLegends', event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 4 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>4) Darshan & Ritual Timings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formValues.darshanTimings.map((timing, index) => (
                <div key={`timing-${index}`} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Day</label>
                      <select
                        value={timing.day}
                        onChange={(event) => handleTimingChange(index, 'day', event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        {DAYS.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Morning open</label>
                      <input type="time" value={timing.morningOpen} onChange={(event) => handleTimingChange(index, 'morningOpen', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Morning close</label>
                      <input type="time" value={timing.morningClose} onChange={(event) => handleTimingChange(index, 'morningClose', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Evening open</label>
                      <input type="time" value={timing.eveningOpen} onChange={(event) => handleTimingChange(index, 'eveningOpen', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-600">Evening close</label>
                      <input type="time" value={timing.eveningClose} onChange={(event) => handleTimingChange(index, 'eveningClose', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={() => handleChange('darshanTimings', [...formValues.darshanTimings, emptyTiming()])} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">+ Add day timing</button>
                {formValues.darshanTimings.length > 1 ? (
                  <button type="button" onClick={() => handleChange('darshanTimings', formValues.darshanTimings.slice(0, -1))} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Remove last</button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div><label className="text-sm font-semibold text-slate-600">Morning Aarti</label><input type="text" value={formValues.morningAarti} onChange={(event) => handleChange('morningAarti', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-semibold text-slate-600">Afternoon Aarti</label><input type="text" value={formValues.afternoonAarti} onChange={(event) => handleChange('afternoonAarti', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-semibold text-slate-600">Evening Aarti</label><input type="text" value={formValues.eveningAarti} onChange={(event) => handleChange('eveningAarti', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                <div className="md:col-span-2"><label className="text-sm font-semibold text-slate-600">Special Sevas</label><input type="text" value={formValues.specialSevas} onChange={(event) => handleChange('specialSevas', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                <div><label className="text-sm font-semibold text-slate-600">Festival-specific timings</label><input type="text" value={formValues.festivalSpecificTimings} onChange={(event) => handleChange('festivalSpecificTimings', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 5 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>5) Entry & Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div><label className="text-sm font-semibold text-slate-600">General entry fee</label><input type="text" value={formValues.generalEntryFee} onChange={(event) => handleChange('generalEntryFee', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Special darshan fee</label><input type="text" value={formValues.specialDarshanFee} onChange={(event) => handleChange('specialDarshanFee', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">VIP darshan fee</label><input type="text" value={formValues.vipDarshanFee} onChange={(event) => handleChange('vipDarshanFee', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['parkingAvailable', 'Parking available'],
                ['wheelchairAccessible', 'Wheelchair accessible'],
                ['cloakroomAvailable', 'Cloakroom available'],
                ['restroomsAvailable', 'Restrooms available'],
                ['drinkingWaterAvailable', 'Drinking water'],
                ['prasadamCounterAvailable', 'Prasadam counter'],
                ['photographyAllowed', 'Photography allowed'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(formValues[key as keyof TempleFormValues])}
                    onChange={(event) => handleChange(key as keyof TempleFormValues, event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="text-sm font-semibold text-slate-600">Mobile restrictions</label><input type="text" value={formValues.mobileRestrictions} onChange={(event) => handleChange('mobileRestrictions', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Security notes</label><input type="text" value={formValues.securityNotes} onChange={(event) => handleChange('securityNotes', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Dress code (Men)</label><input type="text" value={formValues.dressCodeMen} onChange={(event) => handleChange('dressCodeMen', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Dress code (Women)</label><input type="text" value={formValues.dressCodeWomen} onChange={(event) => handleChange('dressCodeWomen', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 6 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>6) Festivals & Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="text-sm font-semibold text-slate-600">Major festivals (comma separated)</label><input type="text" value={formValues.majorFestivals} onChange={(event) => handleChange('majorFestivals', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Festival dates</label><input type="text" value={formValues.festivalDates} onChange={(event) => handleChange('festivalDates', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Annual Brahmotsavam</label><input type="text" value={formValues.annualBrahmotsavam} onChange={(event) => handleChange('annualBrahmotsavam', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Rathotsavam details</label><input type="text" value={formValues.rathotsavamDetails} onChange={(event) => handleChange('rathotsavamDetails', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Crowd expectation level</label><input type="text" value={formValues.crowdExpectationLevel} onChange={(event) => handleChange('crowdExpectationLevel', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Special poojas</label><input type="text" value={formValues.specialPoojas} onChange={(event) => handleChange('specialPoojas', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div className="md:col-span-2"><label className="text-sm font-semibold text-slate-600">Special decoration days</label><input type="text" value={formValues.specialDecorationDays} onChange={(event) => handleChange('specialDecorationDays', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 7 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>7) Best Time to Visit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="text-sm font-semibold text-slate-600">Best months</label><input type="text" value={formValues.bestMonths} onChange={(event) => handleChange('bestMonths', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Best time of day</label><input type="text" value={formValues.bestTimeOfDay} onChange={(event) => handleChange('bestTimeOfDay', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Peak crowd days</label><input type="text" value={formValues.peakCrowdDays} onChange={(event) => handleChange('peakCrowdDays', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Avoid days</label><input type="text" value={formValues.avoidDays} onChange={(event) => handleChange('avoidDays', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div className="md:col-span-2"><label className="text-sm font-semibold text-slate-600">Weather conditions</label><input type="text" value={formValues.weatherConditions} onChange={(event) => handleChange('weatherConditions', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 8 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>8) Nearby Attractions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="text-sm font-semibold text-slate-600">Nearby temples</label><input type="text" value={formValues.nearbyTemples} onChange={(event) => handleChange('nearbyTemples', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Nearby beaches / hills</label><input type="text" value={formValues.nearbyBeachesOrHills} onChange={(event) => handleChange('nearbyBeachesOrHills', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Nearby restaurants</label><input type="text" value={formValues.nearbyRestaurants} onChange={(event) => handleChange('nearbyRestaurants', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Nearby HostHaven hotels</label><input type="text" value={formValues.nearbyHotels} onChange={(event) => handleChange('nearbyHotels', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Distance from railway station</label><input type="text" value={formValues.distanceRailwayStation} onChange={(event) => handleChange('distanceRailwayStation', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Distance from bus stand</label><input type="text" value={formValues.distanceBusStand} onChange={(event) => handleChange('distanceBusStand', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div className="md:col-span-2"><label className="text-sm font-semibold text-slate-600">Distance from airport</label><input type="text" value={formValues.distanceAirport} onChange={(event) => handleChange('distanceAirport', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 9 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>9) SEO & Discoverability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="text-sm font-semibold text-slate-600">Meta title</label><input type="text" value={formValues.metaTitle} onChange={(event) => handleChange('metaTitle', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Canonical URL</label><input type="url" value={formValues.canonicalUrl} onChange={(event) => handleChange('canonicalUrl', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div className="md:col-span-2"><label className="text-sm font-semibold text-slate-600">Meta description</label><textarea value={formValues.metaDescription} onChange={(event) => handleChange('metaDescription', event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div className="md:col-span-2"><label className="text-sm font-semibold text-slate-600">Search keywords (comma separated)</label><input type="text" value={formValues.searchKeywords} onChange={(event) => handleChange('searchKeywords', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">OpenGraph image URL</label><input type="url" value={formValues.openGraphImage} onChange={(event) => handleChange('openGraphImage', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Structured data (JSON-LD)</label><textarea value={formValues.structuredDataJsonLd} onChange={(event) => handleChange('structuredDataJsonLd', event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 10 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>10) Devotee Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="text-sm font-semibold text-slate-600">Devotee tips</label><textarea value={formValues.devoteeTips} onChange={(event) => handleChange('devoteeTips', event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Things to carry</label><textarea value={formValues.thingsToCarry} onChange={(event) => handleChange('thingsToCarry', event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Things not allowed</label><textarea value={formValues.thingsNotAllowed} onChange={(event) => handleChange('thingsNotAllowed', event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Ideal visit duration</label><input type="text" value={formValues.idealVisitDuration} onChange={(event) => handleChange('idealVisitDuration', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Suggested itinerary</label><textarea value={formValues.suggestedItinerary} onChange={(event) => handleChange('suggestedItinerary', event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Local food recommendations</label><textarea value={formValues.localFoodRecommendations} onChange={(event) => handleChange('localFoodRecommendations', event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div className="md:col-span-2"><label className="text-sm font-semibold text-slate-600">FAQs</label><textarea value={formValues.faqs} onChange={(event) => handleChange('faqs', event.target.value)} rows={5} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 10 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>11) Accessibility & Safety</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="text-sm font-semibold text-slate-600">Emergency contact</label><input type="text" value={formValues.emergencyContact} onChange={(event) => handleChange('emergencyContact', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Temple office phone</label><input type="text" value={formValues.templeOfficePhone} onChange={(event) => handleChange('templeOfficePhone', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Lost & found desk</label><input type="text" value={formValues.lostAndFoundDesk} onChange={(event) => handleChange('lostAndFoundDesk', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="text-sm font-semibold text-slate-600">Medical facility nearby</label><input type="text" value={formValues.medicalFacilityNearby} onChange={(event) => handleChange('medicalFacilityNearby', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div className="md:col-span-2"><label className="text-sm font-semibold text-slate-600">Police station nearby</label><input type="text" value={formValues.policeStationNearby} onChange={(event) => handleChange('policeStationNearby', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 10 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>12) Ratings & Reviews (Auto)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Average rating, total reviews, top review highlight, and recent reviews are auto-populated from user review data.
            </div>
          </CardContent>
        </Card>

        <Card className={activeStep === 10 ? '' : 'hidden'}>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formValues.active}
                onChange={(event) => handleChange('active', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Active (visible to users)
            </label>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Previous section
              </button>
            ) : null}
            {activeStep < 10 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Continue to {stepTitles[activeStep]}
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/temples')}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          {activeStep === 10 ? (
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving ? 'Saving...' : id ? 'Update temple' : 'Create temple'}
            </button>
          ) : null}
          </div>
        </div>
      </form>
    </div>
  )
}
