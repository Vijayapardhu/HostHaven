import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, Star } from 'lucide-react'
import { propertiesService, type Property } from '../lib/properties'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/PageLoader'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'

type PropertyStatus = 'approved' | 'pending' | 'rejected' | 'inactive'

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<PropertyStatus | null>(null)

  const fetchProperty = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await propertiesService.getPropertyById(id)
      setProperty(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load property details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProperty()
  }, [id])

  const statusLabel = useMemo(() => {
    if (!property) return ''
    if (property.status === 'approved') return 'Approved'
    if (property.status === 'pending') return 'Pending'
    if (property.status === 'rejected') return 'Rejected'
    return 'Inactive'
  }, [property])

  const statusVariant = useMemo(() => {
    if (!property) return 'neutral' as const
    if (property.status === 'approved') return 'success' as const
    if (property.status === 'pending') return 'warning' as const
    if (property.status === 'rejected') return 'danger' as const
    return 'neutral' as const
  }, [property])

  const confirmStatusChange = async () => {
    if (!property || !confirmAction) return
    try {
      if (confirmAction === 'approved') {
        await propertiesService.approveProperty(property.id)
      } else if (confirmAction === 'rejected') {
        await propertiesService.rejectProperty(property.id)
      } else {
        await propertiesService.updateProperty(property.id, { status: confirmAction })
      }
      setProperty({ ...property, status: confirmAction })
      toast.success('Property status updated.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to update property status.')
    } finally {
      setConfirmAction(null)
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
            onClick={fetchProperty}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        }
      />
    )
  }

  if (!property) {
    return <EmptyState title="Property not found" description="This property record does not exist." />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/properties')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <PageHeader
          title={property.name}
          description={property.address}
          actions={<StatusBadge label={statusLabel} variant={statusVariant} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Property overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{property.city}</span>
                </div>
                {property.description ? <p>{property.description}</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(property.amenities ?? []).length > 0 ? (
                  property.amenities?.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {amenity}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No amenities listed yet.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rating</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-900">
                    <Star className="h-4 w-4 text-amber-500" />
                    {property.rating ?? 0} ({property.reviewCount ?? 0})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Base price</span>
                  <span className="font-semibold text-slate-900">
                    ₹{property.pricing?.basePrice?.toLocaleString() ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Weekend price</span>
                  <span className="font-semibold text-slate-900">
                    ₹{property.pricing?.weekendPrice?.toLocaleString() ?? '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {property.status === 'approved' ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction('inactive')}
                    className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Deactivate property
                  </button>
                ) : property.status === 'inactive' ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAction('approved')}
                    className="w-full rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
                  >
                    Activate property
                  </button>
                ) : property.status === 'pending' ? (
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction('approved')}
                      className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve property
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction('rejected')}
                      className="w-full rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Reject property
                    </button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
        title={
          confirmAction === 'inactive'
            ? 'Deactivate this property?'
            : confirmAction === 'approved'
            ? 'Approve this property?'
            : 'Reject this property?'
        }
        description={
          confirmAction === 'inactive'
            ? 'The property will be hidden from listings.'
            : confirmAction === 'approved'
            ? 'The property will go live for users.'
            : 'The property will be rejected.'
        }
        confirmText={
          confirmAction === 'inactive'
            ? 'Deactivate property'
            : confirmAction === 'approved'
            ? 'Approve property'
            : 'Reject property'
        }
        variant={confirmAction === 'approved' ? 'default' : 'danger'}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
