import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Bell, CheckCircle, Clock, Mail, MessageSquare, Calendar, CreditCard, Home, User } from 'lucide-react'
import { notificationsService, type NotificationItem } from '../lib/notifications'
import { FiltersBar } from '../components/ui/FiltersBar'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/PageLoader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import api from '../lib/api'

type NotificationFilter = 'all' | 'unread' | 'read'
type PushTarget = 'all' | 'users' | 'vendors' | 'admins'

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [confirmMarkAll, setConfirmMarkAll] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [pushImageFile, setPushImageFile] = useState<File | null>(null)
  const [pushImagePreview, setPushImagePreview] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [pushForm, setPushForm] = useState<{
    title: string
    message: string
    target: PushTarget
    type: string
  }>({
    title: '',
    message: '',
    target: 'all',
    type: 'admin_announcement',
  })

  const handlePushImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setPushImageFile(null)
      setPushImagePreview('')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be 5MB or less.')
      event.target.value = ''
      return
    }

    setPushImageFile(file)
    setPushImagePreview(URL.createObjectURL(file))
  }

  const fetchNotifications = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await notificationsService.getNotifications({
        page,
        limit: pageSize,
        isRead: filter === 'all' ? undefined : filter === 'read',
      })
      setNotifications(data.notifications ?? [])
      setTotal(data.pagination?.total ?? data.notifications?.length ?? 0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load notifications.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [page, pageSize, filter])

  const filteredNotifications = useMemo(() => notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notification.userName || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }), [notifications, searchTerm])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId)
      setNotifications((prev) => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n))
      toast.success('Notification marked as read.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to mark notification as read.')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead()
      setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to mark notifications as read.')
    } finally {
      setConfirmMarkAll(false)
    }
  }

  const handleSendPush = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pushForm.title.trim() || !pushForm.message.trim()) {
      toast.error('Title and message are required.')
      return
    }

    try {
      setIsSending(true)
      let imageUrl: string | undefined

      if (pushImageFile) {
        setIsUploadingImage(true)
        const formData = new FormData()
        formData.append('file', pushImageFile)
        const uploadRes = await api.post('/v1/uploads/single?folder=notifications', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrl = uploadRes.data?.data?.url ?? uploadRes.data?.url
      }

      const result = await notificationsService.sendPushNotification({
        title: pushForm.title.trim(),
        message: pushForm.message.trim(),
        target: pushForm.target,
        imageUrl,
      })
      toast.success(`Push notification sent to ${result?.sentCount ?? 0} recipients.`)
      setPushForm({
        title: '',
        message: '',
        target: pushForm.target,
        type: pushForm.type,
      })
      setPushImageFile(null)
      setPushImagePreview('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send push notification.')
    } finally {
      setIsSending(false)
      setIsUploadingImage(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_cancelled':
        return <Calendar className="w-5 h-5" />
      case 'payment_received':
      case 'payment_failed':
        return <CreditCard className="w-5 h-5" />
      case 'vendor_registered':
      case 'vendor_approved':
        return <User className="w-5 h-5" />
      case 'review_submitted':
        return <MessageSquare className="w-5 h-5" />
      case 'support_ticket':
        return <Mail className="w-5 h-5" />
      case 'property_approved':
        return <Home className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'vendor_approved':
      case 'property_approved':
        return 'bg-green-100 text-green-600'
      case 'booking_cancelled':
      case 'payment_failed':
        return 'bg-red-100 text-red-600'
      case 'payment_received':
        return 'bg-blue-100 text-blue-600'
      case 'review_submitted':
        return 'bg-yellow-100 text-yellow-600'
      case 'support_ticket':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length
  const hasFilters = useMemo(() => searchTerm.length > 0 || filter !== 'all', [searchTerm, filter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Monitor and respond to platform activity notifications."
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => setConfirmMarkAll(true)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Mark all as read
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-xl font-semibold text-slate-900">{total || notifications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Unread</p>
              <p className="text-xl font-semibold text-slate-900">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Read</p>
              <p className="text-xl font-semibold text-slate-900">{notifications.filter(n => n.isRead).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Web Push Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendPush} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-1">
              <label className="text-xs font-medium text-slate-500">Audience</label>
              <select
                value={pushForm.target}
                onChange={(event) =>
                  setPushForm((prev) => ({ ...prev, target: event.target.value as PushTarget }))
                }
                title="Notification audience"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">All Users</option>
                <option value="users">Customers</option>
                <option value="vendors">Vendors</option>
                <option value="admins">Admins</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-medium text-slate-500">Title</label>
              <input
                type="text"
                value={pushForm.title}
                onChange={(event) => setPushForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Notification title"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-500">Message</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={pushForm.message}
                  onChange={(event) => setPushForm((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="Message to send"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={isSending || isUploadingImage}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {isSending || isUploadingImage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
            <div className="md:col-span-4">
              <label className="text-xs font-medium text-slate-500">Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePushImageChange}
                title="Upload notification image"
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              {pushImagePreview ? (
                <div className="mt-2">
                  <img src={pushImagePreview} alt="Notification preview" className="h-24 rounded-lg border object-cover" />
                </div>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search notifications"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <select
            value={filter}
            onChange={(event) => {
              setPage(1)
              setFilter(event.target.value as NotificationFilter)
            }}
            title="Notification filter"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load notifications"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchNotifications}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No notifications match your filters' : 'No notifications yet'}
          description={
            hasFilters ? 'Try adjusting your search or filter.' : 'Notifications will appear here once generated.'
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All notifications</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between ${!notification.isRead ? 'bg-blue-50/40' : ''}`}
              >
                <div className="flex gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getIconColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                      {!notification.isRead ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                    {typeof notification.data?.imageUrl === 'string' && notification.data.imageUrl ? (
                      <div className="mt-2">
                        <img
                          src={notification.data.imageUrl}
                          alt="Notification"
                          className="max-h-44 rounded-lg border object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>by {notification.userName || 'System'}</span>
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isRead ? (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Mark as read
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && filteredNotifications.length > 0 ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total || filteredNotifications.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1)
            setPageSize(size)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirmMarkAll}
        onOpenChange={setConfirmMarkAll}
        title="Mark all notifications as read?"
        description="All unread notifications will be marked as read."
        confirmText="Mark all as read"
        onConfirm={handleMarkAllAsRead}
      />
    </div>
  )
}
