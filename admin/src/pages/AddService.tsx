import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { servicesService, type CreateServiceRequest, type Service } from '../lib/services'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { ImageUpload, type UploadedImage } from '../components/ui/ImageUpload'

const SERVICE_FORM_STORAGE_KEY = 'service_form_autosave'

const loadSavedServiceForm = (): Partial<ServiceFormValues> | null => {
  try {
    const saved = localStorage.getItem(SERVICE_FORM_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && parsed.savedAt && Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
        return parsed.values
      }
    }
  } catch (e) {
    console.error('Failed to load saved service form:', e)
  }
  return null
}

const saveServiceFormToStorage = (values: ServiceFormValues) => {
  try {
    localStorage.setItem(SERVICE_FORM_STORAGE_KEY, JSON.stringify({
      values,
      savedAt: Date.now()
    }))
  } catch (e) {
    console.error('Failed to save service form:', e)
  }
}

const clearSavedServiceForm = () => {
  try {
    localStorage.removeItem(SERVICE_FORM_STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear saved service form:', e)
  }
}

const serviceSchema = z.object({
  name: z.string().min(2, 'Service name is required.'),
  category: z.string().min(1, 'Category is required.'),
  description: z.string().min(10, 'Provide a short description.'),
  basePrice: z.number().min(1, 'Base price is required.'),
  advanceType: z.enum(['percentage', 'fixed']),
  advanceValue: z.number().min(0, 'Advance value is required.'),
  active: z.boolean(),
  images: z.array(z.string()).optional(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

export default function AddService() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const getInitialValues = (): ServiceFormValues => ({
    name: '',
    category: 'transport',
    description: '',
    basePrice: 0,
    advanceType: 'percentage',
    advanceValue: 30,
    active: true,
    images: [],
  })
  const [formValues, setFormValues] = useState<ServiceFormValues>(() => {
    const saved = loadSavedServiceForm()
    return saved ? { ...getInitialValues(), ...saved } : getInitialValues()
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serviceImages, setServiceImages] = useState<UploadedImage[]>([
    { url: '', alt: '', isPrimary: true },
    { url: '', alt: '', isPrimary: false },
    { url: '', alt: '', isPrimary: false },
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      saveServiceFormToStorage(formValues)
    }, 1000)
    return () => clearTimeout(timer)
  }, [formValues])

  useEffect(() => {
    if (id) {
      clearSavedServiceForm()
    }
  }, [id])

  const loadService = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await servicesService.getServiceById(id)
      setFormValues({
        name: data.name,
        category: data.category,
        description: data.description,
        basePrice: data.basePrice,
        advanceType: data.advanceType ?? 'percentage',
        advanceValue: data.advanceValue ?? 0,
        active: data.active,
      })
      if (data.images && data.images.length > 0) {
        setServiceImages(
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
      setError(err?.response?.data?.message || 'Unable to load service details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadService()
  }, [id])

  const handleChange = (key: keyof ServiceFormValues, value: string | number | boolean) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validateForm = () => {
    const result = serviceSchema.safeParse(formValues)
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

    const errorMessages = Object.keys(errors).map(field => {
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')
      return fieldName
    })
    
    if (errorMessages.length === 1) {
      toast.error(`Missing: ${errorMessages[0]}`)
    } else {
      toast.error(`Missing ${errorMessages.length} fields: ${errorMessages.slice(0, 3).join(', ')}${errorMessages.length > 3 ? '...' : ''}`)
    }
    return false
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) return
    setIsSaving(true)
    try {
      // Filter out empty images and get URLs
      const imageUrls = serviceImages
        .filter(img => img.url.trim().length > 0)
        .map(img => img.url)

      const payload: CreateServiceRequest = {
        name: formValues.name,
        category: formValues.category,
        description: formValues.description,
        basePrice: formValues.basePrice,
        advanceType: formValues.advanceType,
        advanceValue: formValues.advanceValue,
        active: formValues.active,
        images: imageUrls,
      }

      if (id) {
        await servicesService.updateService(id, payload)
        toast.success('Service updated successfully.')
      } else {
        await servicesService.createService(payload)
        toast.success('Service created successfully.')
      }
      clearSavedServiceForm()
      navigate('/services')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to save service.')
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
        title="Unable to load service"
        description={error}
        action={
          <button
            type="button"
            onClick={loadService}
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
        title={id ? 'Edit service' : 'Add service'}
        description="Services require advance payment and admin confirmation."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Service details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">Service name</label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {fieldErrors.name ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p> : null}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Category</label>
                <select
                  value={formValues.category}
                  onChange={(event) => handleChange('category', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="transport">Transport</option>
                  <option value="guide">Guide</option>
                  <option value="photography">Photography</option>
                  <option value="food">Food & Dining</option>
                  <option value="other">Other</option>
                </select>
                {fieldErrors.category ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.category}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Description</label>
                <textarea
                  value={formValues.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {fieldErrors.description ? (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-slate-600">Base price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formValues.basePrice}
                  onChange={(event) => handleChange('basePrice', Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {fieldErrors.basePrice ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.basePrice}</p> : null}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Advance type</label>
                <select
                  value={formValues.advanceType}
                  onChange={(event) => handleChange('advanceType', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Advance value {formValues.advanceType === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={formValues.advanceValue}
                  onChange={(event) => handleChange('advanceValue', Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {fieldErrors.advanceValue ? (
                  <p className="mt-1 text-xs text-rose-600">{fieldErrors.advanceValue}</p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              images={serviceImages}
              onChange={setServiceImages}
              maxImages={5}
              minImages={1}
              folder="hosthaven/services"
              label="Service Photos"
            />
          </CardContent>
        </Card>

        <Card>
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

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? 'Saving...' : id ? 'Update service' : 'Create service'}
          </button>
        </div>
      </form>
    </div>
  )
}
