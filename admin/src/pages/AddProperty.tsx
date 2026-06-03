import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { propertiesService, type PropertyMedia, type PropertyRoom } from '../lib/properties'
import { vendorsService } from '../lib/vendors'
import { mediaUploadService } from '../lib/mediaUpload'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { ImageUpload, type UploadedImage } from '../components/ui/ImageUpload'
import { MapPicker } from '../components/ui/MapPicker'
import { FormInput } from '../components/ui/FormInput'
import { getFieldErrors } from '../lib/errorUtils'

const PROPERTY_FORM_STORAGE_KEY = 'property_form_autosave'

const loadSavedPropertyForm = (): Partial<PropertyFormValues> | null => {
  try {
    const saved = localStorage.getItem(PROPERTY_FORM_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && parsed.savedAt && Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
        return parsed.values
      }
    }
  } catch (e) {
    console.error('Failed to load saved property form:', e)
  }
  return null
}

const savePropertyFormToStorage = (values: PropertyFormValues) => {
  try {
    localStorage.setItem(PROPERTY_FORM_STORAGE_KEY, JSON.stringify({
      values,
      savedAt: Date.now()
    }))
  } catch (e) {
    console.error('Failed to save property form:', e)
  }
}

const clearSavedPropertyForm = () => {
  try {
    localStorage.removeItem(PROPERTY_FORM_STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear saved property form:', e)
  }
}

const policyKeySchema = z.enum([
  'FREE_CANCELLATION',
  'MODERATE',
  'STRICT',
  'NON_REFUNDABLE',
])

const propertySchema = z.object({
  name: z.string().min(2, 'Property name is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only'),
  type: z.enum(['hotel', 'home', 'temple']),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(5, 'Address is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Valid pincode is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  shortDesc: z.string().optional(),
  searchText: z.string().optional(),
  basePrice: z.number().min(1, 'Base price is required'),
  currency: z.string().min(1, 'Currency is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED']),
  isFeatured: z.boolean(),
  isVerified: z.boolean(),
  cancellationPolicyType: policyKeySchema,
  freeBeforeHours: z.number().min(0),
  refundPercentBefore: z.number().min(0).max(100),
  refundPercentAfter: z.number().min(0).max(100),
  houseType: z.string().optional(),
  listingType: z.string().optional(),
  viewType: z.string().optional(),
  totalGuests: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  taxPercent: z.number().optional(),
  vendorId: z.string().optional(),
})

type PropertyFormValues = z.infer<typeof propertySchema>

type ApiError = {
  response?: {
    data?: {
      message?: string
      error?: {
        message?: string
      }
    }
  }
  message?: string
}

type EditableRoom = {
  id: string
  name: string
  description: string
  type: string
  capacity: number
  extraBedCapacity: number
  pricePerNight: number
  weekendPrice: number
  totalRooms: number
  availableRooms: number
  amenities: string[]
  images: string[]
  video?: string
  pendingImages?: File[]
}

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item): string => {
      let name = ''
      if (typeof item === 'string') name = item.trim()
      else if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        if (typeof record.name === 'string') name = record.name.trim()
        else if (typeof record.label === 'string') name = record.label.trim()
        else if (typeof record.value === 'string') name = record.value.trim()
      }
      if (!name) return ''
      return name.replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    })
    .filter((s): s is string => Boolean(s))
}

const DEFAULT_POLICY_BY_TYPE: Record<PropertyFormValues['cancellationPolicyType'], { freeBeforeHours: number; refundPercentBefore: number; refundPercentAfter: number }> = {
  FREE_CANCELLATION: { freeBeforeHours: 24, refundPercentBefore: 100, refundPercentAfter: 0 },
  MODERATE: { freeBeforeHours: 48, refundPercentBefore: 100, refundPercentAfter: 50 },
  STRICT: { freeBeforeHours: 72, refundPercentBefore: 100, refundPercentAfter: 0 },
  NON_REFUNDABLE: { freeBeforeHours: 0, refundPercentBefore: 0, refundPercentAfter: 0 },
}

const createEmptyRoom = (): EditableRoom => ({
  id: '',
  name: '',
  description: '',
  type: 'standard',
  capacity: 2,
  extraBedCapacity: 0,
  pricePerNight: 0,
  weekendPrice: 0,
  totalRooms: 1,
  availableRooms: 1,
  amenities: [] as string[],
  images: [] as string[],
  video: '',
  pendingImages: [],
})

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError
  return apiError?.response?.data?.error?.message || apiError?.response?.data?.message || apiError?.message || fallback
}

const resolveInitialType = (pathname: string): PropertyFormValues['type'] => {
  if (pathname.includes('/temple')) return 'temple'
  if (pathname.endsWith('/add-house')) return 'home'
  if (pathname.endsWith('/add-hotel')) return 'hotel'
  return 'hotel'
}

const mapVideoUrls = (videos?: PropertyMedia[]): UploadedImage[] =>
  Array.isArray(videos)
    ? videos.map((video) => ({
        url: video.url,
        alt: video.alt || '',
        isPrimary: false,
      }))
    : [
        { url: '', alt: '', isPrimary: false },
        { url: '', alt: '', isPrimary: false },
      ]

const mapUploadedImages = (images: PropertyMedia[] | undefined, propertyName: string): UploadedImage[] => {
  if (!images || images.length === 0) {
    return [
      { url: '', alt: '', isPrimary: true },
      { url: '', alt: '', isPrimary: false },
      { url: '', alt: '', isPrimary: false },
      { url: '', alt: '', isPrimary: false },
      { url: '', alt: '', isPrimary: false },
    ]
  }

  return images.map((img, index) => ({
    url: img.url,
    alt: img.alt || `${propertyName} image ${index + 1}`,
    isPrimary: img.isPrimary ?? index === 0,
  }))
}

const mapEditableRooms = (propertyRooms?: PropertyRoom[]): EditableRoom[] => {
  if (!Array.isArray(propertyRooms) || propertyRooms.length === 0) {
    return [createEmptyRoom()]
  }

  return propertyRooms.map((room) => ({
    id: room.id || '',
    name: room.name || '',
    description: room.description || '',
    type: room.type || 'standard',
    capacity: Number(room.capacity ?? 2),
    extraBedCapacity: Number(room.extraBedCapacity ?? 0),
    pricePerNight: Number(room.pricePerNight ?? 0),
    weekendPrice: Number(room.weekendPrice ?? 0),
    totalRooms: Number(room.totalRooms ?? 1),
    availableRooms: Number(room.availableRooms ?? room.totalRooms ?? 1),
    amenities: normalizeStringArray(room.amenities),
    images: normalizeStringArray(room.images),
    video: room.video || '',
  }))
}

const getInitialPropertyValues = (type?: string): PropertyFormValues => ({
  name: '',
  slug: '',
  type: type as 'hotel' | 'home' | 'temple' || 'hotel',
  city: '',
  address: '',
  state: 'Andhra Pradesh',
  pincode: '',
  description: '',
  shortDesc: '',
  searchText: '',
  basePrice: 0,
  currency: 'INR',
  latitude: undefined,
  longitude: undefined,
  amenities: [],
  highlights: [],
  metaTitle: '',
  metaDesc: '',
  status: 'DRAFT',
  isFeatured: false,
  isVerified: false,
  cancellationPolicyType: 'FREE_CANCELLATION',
  ...DEFAULT_POLICY_BY_TYPE.FREE_CANCELLATION,
  houseType: '',
  listingType: '',
  viewType: '',
  totalGuests: 4,
  bedrooms: 1,
  bathrooms: 1,
  checkInTime: '',
  checkOutTime: '',
  taxPercent: 18,
  vendorId: '',
})

export default function AddProperty() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const initialType = resolveInitialType(location.pathname)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [cityOptions, setCityOptions] = useState<string[]>([])
  const [amenityOptions, setAmenityOptions] = useState<string[]>([])
  const [vendorOptions, setVendorOptions] = useState<{ id: string; name: string }[]>([])
  const [newAmenity, setNewAmenity] = useState('')
  const [propertyVideos, setPropertyVideos] = useState<UploadedImage[]>([
    { url: '', alt: '', isPrimary: false },
    { url: '', alt: '', isPrimary: false },
  ])
  const [propertyImages, setPropertyImages] = useState<UploadedImage[]>([
    { url: '', alt: '', isPrimary: true },
    { url: '', alt: '', isPrimary: false },
    { url: '', alt: '', isPrimary: false },
    { url: '', alt: '', isPrimary: false },
    { url: '', alt: '', isPrimary: false },
  ])
  const [rooms, setRooms] = useState([createEmptyRoom()])
  const [formValues, setFormValues] = useState<PropertyFormValues>(() => {
    const saved = loadSavedPropertyForm()
    return saved ? { ...getInitialPropertyValues(initialType), ...saved } : getInitialPropertyValues(initialType)
  })

  useEffect(() => {
    propertiesService.getCityNames().then((cities) => {
      setCityOptions(cities)
    }).catch(() => {})
    propertiesService.getAmenityNames().then(setAmenityOptions).catch(() => {})
    vendorsService.getVendors({ limit: 100 }).then((res) => {
      const vendors = (res.data || []).map((v: any) => ({
        id: v.id,
        name: v.businessName || v.user?.name || 'Unknown Vendor',
      }))
      setVendorOptions(vendors)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!slug) {
      setFormValues((prev) => ({ ...prev, type: initialType }))
    }
  }, [slug, initialType])

  useEffect(() => {
    const timer = setTimeout(() => {
      savePropertyFormToStorage(formValues)
    }, 1000)
    return () => clearTimeout(timer)
  }, [formValues])

  useEffect(() => {
    if (slug) {
      clearSavedPropertyForm()
    }
  }, [slug])

  const loadProperty = async () => {
    if (!slug) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await propertiesService.getPropertyBySlug(slug)
      const houseDetails = data.houseDetails ?? {}
      const policy = data.cancellationPolicy ?? DEFAULT_POLICY_BY_TYPE.FREE_CANCELLATION
      const policyType = (Object.entries(DEFAULT_POLICY_BY_TYPE).find(([, value]) =>
        value.freeBeforeHours === Number(policy.freeBeforeHours ?? 0) &&
        value.refundPercentBefore === Number(policy.refundPercentBefore ?? 0) &&
        value.refundPercentAfter === Number(policy.refundPercentAfter ?? 0)
      )?.[0] ?? 'FREE_CANCELLATION') as PropertyFormValues['cancellationPolicyType']

      setFormValues({
        name: data.name,
        slug: data.slug || '',
        type: data.type,
        city: (data.city || '').toUpperCase(),
        address: data.address,
        state: data.state || 'Andhra Pradesh',
        pincode: data.pincode || '',
        description: data.description || '',
        shortDesc: data.shortDesc || '',
        searchText: data.searchText || '',
        basePrice: data.basePrice ?? 0,
        currency: data.currency || 'INR',
        latitude: data.latitude ?? data.mapLocation?.lat,
        longitude: data.longitude ?? data.mapLocation?.lng,
        amenities: data.amenities || [],
        highlights: data.highlights || [],
        metaTitle: data.metaTitle || '',
        metaDesc: data.metaDesc || '',
        status: (data.status?.toUpperCase() ?? 'DRAFT') as PropertyFormValues['status'],
        isFeatured: Boolean(data.isFeatured),
        isVerified: Boolean(data.isVerified),
        cancellationPolicyType: policyType,
        freeBeforeHours: Number(policy.freeBeforeHours ?? 0),
        refundPercentBefore: Number(policy.refundPercentBefore ?? 0),
        refundPercentAfter: Number(policy.refundPercentAfter ?? 0),
        houseType: String(houseDetails.houseType ?? ''),
        listingType: String(houseDetails.listingType ?? ''),
        viewType: String(houseDetails.viewType ?? ''),
        totalGuests: Number(houseDetails.totalGuests ?? 4),
        bedrooms: Number(houseDetails.bedrooms ?? 1),
        bathrooms: Number(houseDetails.bathrooms ?? 1),
        checkInTime: String(houseDetails.checkInTime ?? ''),
        checkOutTime: String(houseDetails.checkOutTime ?? ''),
        taxPercent: Number(houseDetails.taxPercent ?? 18),
        vendorId: data.vendorId || '',
      })
      setPropertyVideos(mapVideoUrls(data.videos))
      setPropertyImages(mapUploadedImages(data.images, data.name))
      setRooms(mapEditableRooms(data.rooms))
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load property details.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (slug) loadProperty()
  }, [slug])

  const handleChange = (key: keyof PropertyFormValues, value: string | number | boolean | string[] | undefined) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const autoBuildSlug = () => {
    const slug = formValues.name.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    handleChange('slug', slug)
  }

  const toggleAmenity = (amenity: string) => {
    const current = formValues.amenities || []
    handleChange('amenities', current.includes(amenity) ? current.filter((a) => a !== amenity) : [...current, amenity])
  }

  const addNewAmenity = async () => {
    const name = newAmenity.trim()
    if (!name) return
    try {
      const created = await propertiesService.createAmenity(name)
      const value = created?.name || name
      setAmenityOptions((prev) => Array.from(new Set([...prev, value])).sort())
      if (!(formValues.amenities || []).includes(value)) {
        handleChange('amenities', [...(formValues.amenities || []), value])
      }
      setNewAmenity('')
      toast.success('Amenity added successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Unable to add amenity.')
    }
  }

  const addRoom = () => setRooms((prev) => [...prev, createEmptyRoom()])
  const removeRoom = (index: number) => setRooms((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)
  const updateRoom = (index: number, key: string, value: string | number | string[]) => {
    setRooms((prev) => prev.map((room, i) => i === index ? { ...room, [key]: value } : room))
  }

  const validateForm = () => {
    const result = propertySchema.safeParse(formValues)
    const errors: Record<string, string> = {}
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = issue.path[0]
        if (key) errors[key.toString()] = issue.message
      })
    }

    const uploadedImages = propertyImages.filter((img) => img.url.trim().length > 0)
    if (uploadedImages.length === 0) {
      errors.images = 'At least one property image is required'
    }

    // Validate rooms if property type is not temple
    if (formValues.type !== 'temple') {
      rooms.forEach((room, index) => {
        if (room.name.trim()) {
          if (!room.pricePerNight || room.pricePerNight <= 0) {
            errors[`room_${index}_price`] = `Room ${index + 1}: Price is required`
          }
          if (!room.totalRooms || room.totalRooms <= 0) {
            errors[`room_${index}_totalRooms`] = `Room ${index + 1}: Total rooms is required`
          }
          if (!room.capacity || room.capacity <= 0) {
            errors[`room_${index}_capacity`] = `Room ${index + 1}: Capacity is required`
          }
        }
      })
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      const missingFields = Object.keys(errors)
      const errorMessages = missingFields.map(field => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')
        return fieldName
      })
      
      if (errorMessages.length === 1) {
        toast.error(`Missing required field: ${errorMessages[0]}`)
      } else {
        toast.error(`Missing ${errorMessages.length} required fields: ${errorMessages.slice(0, 3).join(', ')}${errorMessages.length > 3 ? '...' : ''}`)
      }
      return false
    }
    return true
  }

  const payload = useMemo(() => {
    const videos = propertyVideos.filter((video) => video.url.trim().length > 0).map((video, index) => ({
      url: video.url,
      alt: video.alt || `Property video ${index + 1}`,
    }))
    const filteredImages = propertyImages.filter((img) => img.url.trim().length > 0).map((img, index) => ({
      url: img.url,
      alt: img.alt || `${formValues.name} image ${index + 1}`,
      isPrimary: img.isPrimary || index === 0,
    }))
    const featureFlags = formValues.type === 'home'
      ? {
          houseType: formValues.houseType,
          listingType: formValues.listingType,
          viewType: formValues.viewType,
          totalGuests: formValues.totalGuests,
          bedrooms: formValues.bedrooms,
          bathrooms: formValues.bathrooms,
          checkInTime: formValues.checkInTime,
          checkOutTime: formValues.checkOutTime,
          taxPercent: formValues.taxPercent,
        }
      : undefined

    const normalizedRooms = formValues.type === 'temple'
      ? undefined
      : rooms
          .filter((room) => room.name.trim().length > 0 && room.pricePerNight > 0)
          .map((room) => ({
            ...(room.id ? { id: room.id } : {}),
            name: room.name.trim(),
            description: room.description || undefined,
            type: room.type,
            capacity: room.capacity,
            extraBedCapacity: room.extraBedCapacity,
            pricePerNight: room.pricePerNight,
            weekendPrice: room.weekendPrice || undefined,
            totalRooms: room.totalRooms,
            availableRooms: room.availableRooms,
            amenities: normalizeStringArray(room.amenities),
            images: room.images,
            video: room.video || undefined,
          }))

    return {
      name: formValues.name,
      slug: formValues.slug,
      type: formValues.type,
      city: formValues.city.toUpperCase(),
      address: formValues.address,
      state: formValues.state,
      pincode: formValues.pincode,
      description: formValues.description,
      shortDesc: formValues.shortDesc || undefined,
      searchText: formValues.searchText || undefined,
      basePrice: formValues.basePrice,
      currency: formValues.currency,
      amenities: formValues.amenities,
      highlights: formValues.highlights,
      images: filteredImages,
      videos,
      latitude: formValues.latitude,
      longitude: formValues.longitude,
      status: formValues.status?.toUpperCase(),
      isFeatured: formValues.isFeatured,
      isVerified: formValues.isVerified,
      metaTitle: formValues.metaTitle || undefined,
      metaDesc: formValues.metaDesc || undefined,
      vendorId: formValues.vendorId || undefined,
      featureFlags,
      houseDetails: featureFlags,
      cancellationPolicy: {
        freeBeforeHours: formValues.freeBeforeHours,
        refundPercentBefore: formValues.refundPercentBefore,
        refundPercentAfter: formValues.refundPercentAfter,
      },
      rooms: normalizedRooms,
    }
  }, [formValues, propertyImages, propertyVideos, rooms])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return
    setIsSaving(true)
    try {
      if (slug) {
        await propertiesService.updateProperty(slug, payload)
        toast.success('Property updated successfully.')
        clearSavedPropertyForm()
        navigate(`/properties/${slug}`)
      } else {
        const created = await propertiesService.createProperty(payload)
        toast.success('Property created successfully.')
        clearSavedPropertyForm()
        navigate(`/properties/${created.slug}`)
      }
    } catch (err) {
      const backendFieldErrors = getFieldErrors(err)
      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors(backendFieldErrors)
        toast.error(Object.values(backendFieldErrors)[0])
      } else {
        toast.error(getErrorMessage(err, 'Unable to save property.'))
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <PageLoader rows={6} />

  if (error) {
    return (
      <EmptyState
        title="Unable to load property"
        description={error}
        action={<button type="button" onClick={loadProperty} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Retry</button>}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={slug ? 'Edit property' : 'Add property'}
        description="Create and maintain the full Prisma-backed property record from admin."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Core Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FormInput
                  label="Property Name"
                  name="propertyName"
                  value={formValues.name}
                  onChange={(value) => handleChange('name', value)}
                  validateOnBlur
                  showValidationHint
                  required
                />
                {fieldErrors.name ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p> : null}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Slug</label>
                <div className="mt-1 flex gap-2">
                  <input type="text" value={formValues.slug} onChange={(e) => handleChange('slug', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <button type="button" onClick={autoBuildSlug} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Auto</button>
                </div>
                {fieldErrors.slug ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.slug}</p> : null}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Property Type *</label>
                <select value={formValues.type} onChange={(e) => handleChange('type', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="hotel">Hotel (managed property)</option>
                  <option value="home">Home Stay (owner managed)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">City *</label>
                <select value={formValues.city?.toUpperCase() || ''} onChange={(e) => handleChange('city', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Select city</option>
                  {cityOptions.map((city) => <option key={city} value={city.toUpperCase()}>{city.replace(/_/g, ' ')}</option>)}
                </select>
                {fieldErrors.city ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.city}</p> : null}
              </div>
              <div className="md:col-span-2">
                <FormInput
                  label="Full Address"
                  name="address"
                  value={formValues.address}
                  onChange={(value) => handleChange('address', value)}
                  validateOnBlur
                  showValidationHint
                  required
                />
                {fieldErrors.address ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.address}</p> : null}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">State</label>
                <input type="text" value={formValues.state} onChange={(e) => handleChange('state', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <FormInput
                  label="Pincode"
                  name="pincode"
                  value={formValues.pincode}
                  onChange={(value) => handleChange('pincode', value)}
                  validateOnBlur
                  showValidationHint
                  required
                />
                {fieldErrors.pincode ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.pincode}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Short Description</label>
                <input type="text" value={formValues.shortDesc || ''} onChange={(e) => handleChange('shortDesc', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Description</label>
                <textarea
                  value={formValues.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={5}
                  minLength={10}
                  maxLength={5000}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">10-5000 characters required</p>
                <p className="mt-1 text-xs text-slate-500 text-right">{formValues.description.length}/5000</p>
                {fieldErrors.description ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Search Text</label>
                <textarea value={formValues.searchText || ''} onChange={(e) => handleChange('searchText', e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media And Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload images={propertyImages} onChange={setPropertyImages} maxImages={15} minImages={1} folder="hosthaven/properties" label="Property Photos" />
            {fieldErrors.images ? <p className="-mt-2 text-xs text-rose-600">{fieldErrors.images}</p> : null}
            <ImageUpload images={propertyVideos} onChange={setPropertyVideos} maxImages={2} folder="hosthaven/properties/videos" resourceType="video" label="Property Videos" />
            <MapPicker latitude={formValues.latitude} longitude={formValues.longitude} onChange={(lat, lng) => { handleChange('latitude', lat); handleChange('longitude', lng) }} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing, SEO And Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">Base Price</label>
                <input type="number" min={0} value={formValues.basePrice} onChange={(e) => handleChange('basePrice', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Currency</label>
                <input type="text" value={formValues.currency} onChange={(e) => handleChange('currency', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Meta Title</label>
                <input type="text" value={formValues.metaTitle || ''} onChange={(e) => handleChange('metaTitle', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Meta Description</label>
                <textarea value={formValues.metaDesc || ''} onChange={(e) => handleChange('metaDesc', e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Vendor</label>
                <select value={formValues.vendorId || ''} onChange={(e) => handleChange('vendorId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">No Vendor</option>
                  {vendorOptions.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Status</label>
                <select value={formValues.status} onChange={(e) => handleChange('status', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  {['DRAFT', 'ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED'].map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={formValues.isFeatured} onChange={(e) => handleChange('isFeatured', e.target.checked)} /> Featured</label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={formValues.isVerified} onChange={(e) => handleChange('isVerified', e.target.checked)} /> Verified</label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amenities And Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600">Add New Amenity</label>
              <div className="flex gap-2 mt-1">
                <input type="text" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Add a new amenity" />
                <button type="button" onClick={addNewAmenity} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Add</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {amenityOptions.map((amenity) => (
                <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${(formValues.amenities || []).includes(amenity) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {amenity}
                </button>
              ))}
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Highlights</label>
              <textarea value={(formValues.highlights || []).join(', ')} onChange={(e) => handleChange('highlights', e.target.value.split(',').map((value) => value.trim()).filter(Boolean))} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Comma separated highlights" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">Preset</label>
                <select value={formValues.cancellationPolicyType} onChange={(e) => {
                  const nextType = e.target.value as PropertyFormValues['cancellationPolicyType']
                  const nextValues = DEFAULT_POLICY_BY_TYPE[nextType]
                  setFormValues((prev) => ({ ...prev, cancellationPolicyType: nextType, ...nextValues }))
                }} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  {Object.keys(DEFAULT_POLICY_BY_TYPE).map((key) => <option key={key} value={key}>{key}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Free Before Hours</label>
                <input type="number" min={0} value={formValues.freeBeforeHours} onChange={(e) => handleChange('freeBeforeHours', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Refund % Before</label>
                <input type="number" min={0} max={100} value={formValues.refundPercentBefore} onChange={(e) => handleChange('refundPercentBefore', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Refund % After</label>
                <input type="number" min={0} max={100} value={formValues.refundPercentAfter} onChange={(e) => handleChange('refundPercentAfter', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {formValues.type === 'home' ? (
          <Card>
            <CardHeader>
              <CardTitle>Home Attributes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-semibold text-slate-600">House Type</label>
                  <input value={formValues.houseType || ''} onChange={(e) => handleChange('houseType', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="House type" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Listing Type</label>
                  <input value={formValues.listingType || ''} onChange={(e) => handleChange('listingType', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Listing type" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">View Type</label>
                  <input value={formValues.viewType || ''} onChange={(e) => handleChange('viewType', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="View type" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Total Guests</label>
                  <input type="number" min={1} value={formValues.totalGuests || 0} onChange={(e) => handleChange('totalGuests', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Guests" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Bedrooms</label>
                  <input type="number" min={0} value={formValues.bedrooms || 0} onChange={(e) => handleChange('bedrooms', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Bedrooms" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Bathrooms</label>
                  <input type="number" min={0} value={formValues.bathrooms || 0} onChange={(e) => handleChange('bathrooms', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Bathrooms" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Check-in Time</label>
                  <input value={formValues.checkInTime || ''} onChange={(e) => handleChange('checkInTime', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Check-in time" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Check-out Time</label>
                  <input value={formValues.checkOutTime || ''} onChange={(e) => handleChange('checkOutTime', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Check-out time" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Tax Percent</label>
                  <input type="number" min={0} value={formValues.taxPercent || 0} onChange={(e) => handleChange('taxPercent', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Tax percent" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {formValues.type !== 'temple' ? (
          <Card>
            <CardHeader>
              <CardTitle>Rooms</CardTitle>
              <p className="text-sm text-slate-500">Add room types with pricing and availability. Leave rooms empty for "First Come First Serve" properties.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {rooms.map((room, index) => (
                <div key={room.id || index} className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Room {index + 1}</h3>
                    {rooms.length > 1 ? <button type="button" onClick={() => removeRoom(index)} className="text-xs font-semibold text-rose-600">Remove</button> : null}
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600">Room Name *</label>
                      <input value={room.name} onChange={(e) => updateRoom(index, 'name', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="e.g., Deluxe Suite" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Room Type</label>
                      <input value={room.type} onChange={(e) => updateRoom(index, 'type', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="e.g., standard, deluxe, suite" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Base Capacity (guests) *</label>
                      <input type="number" min={1} value={room.capacity} onChange={(e) => updateRoom(index, 'capacity', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Max guests per room" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Extra Bed Capacity</label>
                      <input type="number" min={0} value={room.extraBedCapacity} onChange={(e) => updateRoom(index, 'extraBedCapacity', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Extra beds allowed" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Base Price (₹) *</label>
                      <input type="number" min={0} value={room.pricePerNight} onChange={(e) => updateRoom(index, 'pricePerNight', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Regular night price" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Weekend Price (₹)</label>
                      <input type="number" min={0} value={room.weekendPrice} onChange={(e) => updateRoom(index, 'weekendPrice', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Fri-Sun price" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Total Rooms *</label>
                      <input type="number" min={1} value={room.totalRooms} onChange={(e) => updateRoom(index, 'totalRooms', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="How many rooms of this type" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Available Now</label>
                      <input type="number" min={0} value={room.availableRooms} onChange={(e) => updateRoom(index, 'availableRooms', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Currently bookable rooms" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Room Description</label>
                      <textarea value={room.description} onChange={(e) => updateRoom(index, 'description', e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Describe the room features, bed size, view, etc." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Room Amenities</label>
                      <textarea value={room.amenities.join(', ')} onChange={(e) => updateRoom(index, 'amenities', e.target.value.split(',').map((value) => value.trim()).filter(Boolean))} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="e.g., AC, WiFi, TV, Geyser (comma separated)" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Room Images (URLs, comma separated)</label>
                      <input value={room.images.join(', ')} onChange={(e) => updateRoom(index, 'images', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="https://image1.jpg, https://image2.jpg" />
                      {room.images.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {room.images.map((img, idx) => (
                            <div key={idx} className="relative">
                              <img src={img} alt={`Room ${idx}`} className="w-12 h-12 object-cover rounded border" />
                              <button type="button" onClick={() => updateRoom(index, 'images', room.images.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="text-xs font-medium text-slate-600 mt-2 block">Or upload images</label>
                      <input type="file" accept="image/*" multiple onChange={async (e) => {
                        const files = e.target.files
                        if (!files?.length) return
                        try {
                          const uploaded = await mediaUploadService.uploadMultiple(Array.from(files), { folder: 'rooms' })
                          const newUrls = [...room.images, ...uploaded.map((u) => u.url)]
                          updateRoom(index, 'images', newUrls)
                          toast.success('Images uploaded')
                        } catch {
                          toast.error('Upload failed')
                        }
                      }} className="mt-1 w-full text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Room Video URL</label>
                      <input value={room.video || ''} onChange={(e) => updateRoom(index, 'video', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="https://youtube.com/..." />
                      {room.video && (
                        <video src={room.video} className="w-32 h-16 object-cover rounded mt-1" controls />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addRoom} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">+ Add Another Room</button>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/properties')} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={isSaving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
            {isSaving ? 'Saving...' : slug ? 'Update Property' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  )
}
