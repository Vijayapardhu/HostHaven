import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { propertiesService, type Property } from '../lib/properties'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { ImageUpload, type UploadedImage } from '../components/ui/ImageUpload'

const propertySchema = z.object({
  name: z.string().min(2, 'Property name is required'),
  type: z.enum(['hotel', 'home']),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(5, 'Address is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(4, 'Valid pincode is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  basePrice: z.number().min(1, 'Base price is required'),
  weekendPrice: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  amenities: z.array(z.string()).optional(),
  status: z.string().optional(),
})

type PropertyFormValues = z.infer<typeof propertySchema>

const CITY_OPTIONS = ['Vijayawada', 'Nandiyala', 'Vetlapalem', 'Guntur', 'Kakinada', 'Rajahmundry', 'Tirupati', 'Visakhapatnam']

const AMENITIES_OPTIONS = [
  'WiFi', 'AC', 'Parking', 'Pool', 'Gym', 'Restaurant', 'Room Service', 'Bar',
  'Laundry', 'Garden', 'Balcony', 'Kitchen', 'Pet Friendly', 'Beach Access',
  'Mountain View', 'Lake View', 'Hot Tub', 'Spa', 'Airport Shuttle', 'Business Center'
]

export default function AddProperty() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<PropertyFormValues>({
    name: '',
    type: 'hotel',
    city: '',
    address: '',
    state: 'Andhra Pradesh',
    pincode: '',
    description: '',
    basePrice: 0,
    weekendPrice: 0,
    latitude: undefined,
    longitude: undefined,
    amenities: [],
    status: 'DRAFT',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [propertyImages, setPropertyImages] = useState<UploadedImage[]>([
    { url: '', alt: '', isPrimary: true },
    { url: '', alt: '', isPrimary: false },
    { url: '', alt: '', isPrimary: false },
    { url: '', alt: '', isPrimary: false },
    { url: '', alt: '', isPrimary: false },
  ])

  const loadProperty = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await propertiesService.getPropertyById(id)
      setFormValues({
        name: data.name,
        type: data.type,
        city: data.city,
        address: data.address,
        state: 'Andhra Pradesh',
        pincode: '',
        description: data.description || '',
        basePrice: data.pricing?.basePrice || 0,
        weekendPrice: data.pricing?.weekendPrice,
        latitude: data.mapLocation?.lat,
        longitude: data.mapLocation?.lng,
        amenities: data.amenities || [],
        status: data.status,
      })
      if (data.images && data.images.length > 0) {
        setPropertyImages(
          data.images.map((img: any, index: number) => {
            const url = typeof img === 'string' ? img : img?.url || ''
            return {
              url,
              alt: typeof img === 'string' ? `${data.name} image ${index + 1}` : img?.alt || `${data.name} image ${index + 1}`,
              isPrimary: typeof img === 'string' ? index === 0 : !!img?.isPrimary,
            }
          })
        )
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load property details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadProperty()
    }
  }, [id])

  const handleChange = (key: keyof PropertyFormValues, value: string | number | boolean | string[]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const toggleAmenity = (amenity: string) => {
    const current = formValues.amenities || []
    if (current.includes(amenity)) {
      handleChange('amenities', current.filter((a) => a !== amenity))
    } else {
      handleChange('amenities', [...current, amenity])
    }
  }

  const validateForm = () => {
    const result = propertySchema.safeParse(formValues)
    if (result.success) {
      setFieldErrors({})
      return true
    }
    const errors: Record<string, string> = {}
    result.error.issues.forEach((issue) => {
      const key = issue.path[0]
      if (key) errors[key.toString()] = issue.message
    })
    setFieldErrors(errors)
    return false
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return
    setIsSaving(true)

    const payload = {
      name: formValues.name,
      type: formValues.type.toUpperCase(),
      city: formValues.city.toUpperCase(),
      address: formValues.address,
      state: formValues.state,
      pincode: formValues.pincode,
      description: formValues.description,
      basePrice: formValues.basePrice,
      weekendPrice: formValues.weekendPrice,
      amenities: formValues.amenities,
      images: propertyImages.filter(img => img.url.trim().length > 0).map((img, index) => ({
        url: img.url,
        alt: img.alt || `${formValues.name} image ${index + 1}`,
        isPrimary: img.isPrimary || index === 0
      })),
      mapLocation: formValues.latitude && formValues.longitude ? {
        lat: formValues.latitude,
        lng: formValues.longitude,
      } : undefined,
      status: formValues.status || 'DRAFT',
    }

    try {
      if (id) {
        await propertiesService.updateProperty(id, payload)
        toast.success('Property updated successfully.')
        navigate(`/properties/${id}`)
      } else {
        await propertiesService.createProperty(payload)
        toast.success('Property created successfully.')
        navigate('/properties')
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Unable to save property.'
      if (String(message).toLowerCase().includes('not supported')) {
        toast.error('Backend property create is not enabled yet.')
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
        title="Unable to load property"
        description={error}
        action={
          <button
            type="button"
            onClick={loadProperty}
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
        title={id ? 'Edit property' : 'Add property'}
        description="Create a new hotel or home stay property."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Property Name</label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g., Grand Hotel Vijayawada"
                />
                {fieldErrors.name ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p> : null}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">Property Type</label>
                <select
                  value={formValues.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="hotel">Hotel</option>
                  <option value="home">Home Stay</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">City</label>
                <select
                  value={formValues.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select city</option>
                  {CITY_OPTIONS.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {fieldErrors.city ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.city}</p> : null}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Full Address</label>
                <input
                  type="text"
                  value={formValues.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Street address"
                />
                {fieldErrors.address ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.address}</p> : null}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">State</label>
                <input
                  type="text"
                  value={formValues.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">Pincode</label>
                <input
                  type="text"
                  value={formValues.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="500001"
                />
                {fieldErrors.pincode ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.pincode}</p> : null}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Description</label>
                <textarea
                  value={formValues.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Describe your property..."
                />
                {fieldErrors.description ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p> : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={propertyImages}
              onChange={setPropertyImages}
              maxImages={10}
              minImages={1}
              folder="hosthaven/properties"
              label="Property Photos"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">Base Price (₹) per night</label>
                <input
                  type="number"
                  min={0}
                  value={formValues.basePrice}
                  onChange={(e) => handleChange('basePrice', Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {fieldErrors.basePrice ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.basePrice}</p> : null}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">Weekend Price (₹) per night</label>
                <input
                  type="number"
                  min={0}
                  value={formValues.weekendPrice || ''}
                  onChange={(e) => handleChange('weekendPrice', Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formValues.latitude || ''}
                  onChange={(e) => handleChange('latitude', Number(e.target.value) || undefined)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g., 16.5062"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formValues.longitude || ''}
                  onChange={(e) => handleChange('longitude', Number(e.target.value) || undefined)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g., 80.6480"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${(formValues.amenities || []).includes(amenity)
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {['DRAFT', 'ACTIVE', 'INACTIVE'].map((status) => (
                <label key={status} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={formValues.status === status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="h-4 w-4 border-slate-300"
                  />
                  {status === 'DRAFT' ? 'Draft' : status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/properties')}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? 'Saving...' : id ? 'Update Property' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  )
}
