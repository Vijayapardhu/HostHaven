import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { templesService, type Temple } from '../lib/temples'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { EmptyState } from '../components/ui/EmptyState'

const templeSchema = z.object({
  name: z.string().min(2, 'Temple name is required.'),
  description: z.string().min(10, 'Description is required.'),
  city: z.string().min(2, 'City is required.'),
  address: z.string().min(5, 'Address is required.'),
  active: z.boolean(),
})

type TempleFormValues = z.infer<typeof templeSchema>

export default function AddTemple() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<TempleFormValues>({
    name: '',
    description: '',
    city: '',
    address: '',
    active: true,
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const loadTemple = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await templesService.getTempleById(id)
      setFormValues({
        name: data.name,
        description: data.description,
        city: data.city,
        address: data.address,
        active: data.active,
      })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load temple details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTemple()
  }, [id])

  const handleChange = (key: keyof TempleFormValues, value: string | boolean) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validateForm = () => {
    const result = templeSchema.safeParse(formValues)
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
    try {
      if (id) {
        await templesService.updateTemple(id, formValues)
        toast.success('Temple updated successfully.')
      } else {
        await templesService.createTemple(formValues)
        toast.success('Temple created successfully.')
      }
      navigate('/temples')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to save temple.')
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
        description="Temples are content-only and do not support bookings."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Temple details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div>
                <label className="text-sm font-semibold text-slate-600">City</label>
                <input
                  type="text"
                  value={formValues.city}
                  onChange={(event) => handleChange('city', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {fieldErrors.city ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.city}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Address</label>
                <input
                  type="text"
                  value={formValues.address}
                  onChange={(event) => handleChange('address', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                {fieldErrors.address ? <p className="mt-1 text-xs text-rose-600">{fieldErrors.address}</p> : null}
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
            onClick={() => navigate('/temples')}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? 'Saving...' : id ? 'Update temple' : 'Create temple'}
          </button>
        </div>
      </form>
    </div>
  )
}
