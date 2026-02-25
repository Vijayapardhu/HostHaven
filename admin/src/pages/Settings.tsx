import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Bell, FileText, Mail, Percent, Save, Settings, Shield } from 'lucide-react'
import { settingsService, type PlatformSettings, type EmailTemplate, type FeatureFlag } from '../lib/settings'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoader } from '../components/ui/PageLoader'
import { EmptyState } from '../components/ui/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchSettings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await settingsService.getSettings()
      setSettings(data)
      setEmailTemplates(data.emailTemplates ?? [])
      setFeatureFlags(data.featureFlags ?? [])
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load settings.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setIsSaving(true)
    try {
      const payload: PlatformSettings = {
        ...settings,
        emailTemplates,
        featureFlags,
      }
      const updated = await settingsService.updateSettings(payload)
      setSettings(updated)
      setEmailTemplates(updated.emailTemplates ?? emailTemplates)
      setFeatureFlags(updated.featureFlags ?? featureFlags)
      toast.success('Settings updated successfully.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = useMemo(() => Boolean(settings), [settings])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage platform settings and configuration."
      />

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error || !settings ? (
        <EmptyState
          title="Unable to load settings"
          description={error || 'Settings are not available yet.'}
          action={
            <button
              type="button"
              onClick={fetchSettings}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-500" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Platform Name</label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(event) => setSettings({ ...settings, platformName: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-slate-500" />
                Commission & Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Platform Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.commissionRate}
                  onChange={(event) => setSettings({ ...settings, commissionRate: Number(event.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">Percentage of each booking retained as commission.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                Support Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Support Phone</label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(event) => setSettings({ ...settings, supportPhone: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-500" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Email Notifications</p>
                  <p className="text-xs text-slate-500">Receive email updates about platform activity.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(event) => setSettings({ ...settings, emailNotifications: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Push Notifications</p>
                  <p className="text-xs text-slate-500">Receive push notifications for urgent matters.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(event) => setSettings({ ...settings, pushNotifications: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-slate-500" />
                Payout Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Minimum Payout Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.minPayoutAmount}
                  onChange={(event) => setSettings({ ...settings, minPayoutAmount: Number(event.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Payout Frequency</label>
                <select
                  value={settings.payoutFrequency}
                  onChange={(event) => setSettings({ ...settings, payoutFrequency: event.target.value as PlatformSettings['payoutFrequency'] })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                Email Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {emailTemplates.length === 0 ? (
                <p className="text-sm text-slate-500">No templates configured.</p>
              ) : (
                emailTemplates.map((template) => (
                  <div key={template.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{template.name}</p>
                      <p className="text-sm text-slate-500">{template.subject}</p>
                      <p className="text-xs text-slate-400">Trigger: {template.trigger}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={template.isActive}
                        onChange={() =>
                          setEmailTemplates((prev) =>
                            prev.map((item) =>
                              item.id === template.id ? { ...item, isActive: !item.isActive } : item
                            )
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      Active
                    </label>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-500" />
                Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {featureFlags.length === 0 ? (
                <p className="text-sm text-slate-500">No feature flags configured.</p>
              ) : (
                featureFlags.map((flag) => (
                  <div key={flag.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">{flag.name}</p>
                      <p className="text-sm text-slate-500">{flag.description}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={flag.isEnabled}
                        onChange={() =>
                          setFeatureFlags((prev) =>
                            prev.map((item) =>
                              item.id === flag.id ? { ...item, isEnabled: !item.isEnabled } : item
                            )
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                      Enabled
                    </label>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !canSave}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
