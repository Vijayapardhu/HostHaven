import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  CalendarClock,
  Clock3,
  DollarSign,
  Edit2,
  FileText,
  Globe,
  Mail,
  Percent,
  Plus,
  Save,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  Zap,
  ZapOff,
} from "lucide-react";
import {
  settingsService,
  type PlatformSettings,
  type EmailTemplate,
  type FeatureFlag,
  type AdvancedSettings,
  DEFAULT_ADVANCED_SETTINGS,
} from "../lib/settings";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/PageLoader";
import { EmptyState } from "../components/ui/EmptyState";
import { getUserFriendlyError } from "../lib/errorUtils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import * as Dialog from "@radix-ui/react-dialog";

const mergeAdvancedSettings = (value?: AdvancedSettings): AdvancedSettings => ({
  booking: {
    ...DEFAULT_ADVANCED_SETTINGS.booking,
    ...(value?.booking ?? {}),
  },
  seo: {
    ...DEFAULT_ADVANCED_SETTINGS.seo,
    ...(value?.seo ?? {}),
  },
  social: {
    ...DEFAULT_ADVANCED_SETTINGS.social,
    ...(value?.social ?? {}),
  },
});

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [editingFeature, setEditingFeature] = useState<FeatureFlag | null>(
    null,
  );
  const [newFeature, setNewFeature] = useState<{
    name: string;
    description: string;
  } | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await settingsService.getSettings();
      setSettings({
        ...data,
        advancedSettings: mergeAdvancedSettings(data.advancedSettings),
      });
      setEmailTemplates(data.emailTemplates ?? []);
      setFeatureFlags(data.featureFlags ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const patchSettings = (
    updater: (current: PlatformSettings) => PlatformSettings,
  ) => {
    setSettings((prev) => (prev ? updater(prev) : prev));
  };

  const updateAdvanced = (
    updater: (advanced: AdvancedSettings) => AdvancedSettings,
  ) => {
    patchSettings((current) => ({
      ...current,
      advancedSettings: updater(mergeAdvancedSettings(current.advancedSettings)),
    }));
  };

  const handleSave = async () => {
    if (!settings) return;
    
    const errors: string[] = [];
    if (!settings.platformName || settings.platformName.trim().length < 2) {
      errors.push('Platform name is required');
    }
    if (!settings.supportEmail || !settings.supportEmail.includes('@')) {
      errors.push('Valid support email is required');
    }
    if (!settings.supportPhone || settings.supportPhone.length < 10) {
      errors.push('Valid support phone is required');
    }
    if (settings.commissionRate === undefined || settings.commissionRate < 0) {
      errors.push('Commission rate is required');
    }
    if (settings.minPayoutAmount === undefined || settings.minPayoutAmount < 0) {
      errors.push('Minimum payout amount is required');
    }
    
    if (errors.length > 0) {
      toast.error(`Missing: ${errors.join(', ')}`);
      return;
    }
    
    setIsSaving(true);
    try {
      const payload: PlatformSettings = {
        ...settings,
        advancedSettings: mergeAdvancedSettings(settings.advancedSettings),
        emailTemplates,
        featureFlags,
        allowedCities: settings.allowedCities && settings.allowedCities.length > 0 
          ? settings.allowedCities 
          : undefined,
      };
      const updated = await settingsService.updateSettings(payload);
      setSettings({
        ...updated,
        advancedSettings: mergeAdvancedSettings(updated.advancedSettings),
      });
      setEmailTemplates(updated.emailTemplates ?? emailTemplates);
      setFeatureFlags(updated.featureFlags ?? featureFlags);
      toast.success("Settings updated successfully.");
    } catch (err: any) {
      console.error('Settings save error:', err);
      toast.error(getUserFriendlyError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    setIsSaving(true);
    try {
      const updatedTemplates = emailTemplates.map((t) =>
        t.id === editingTemplate.id ? editingTemplate : t
      );
      await settingsService.updateSettings({
        ...settings,
        emailTemplates: updatedTemplates,
      } as any);
      setEmailTemplates(updatedTemplates);
      setEditingTemplate(null);
      toast.success("Template updated and saved.");
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFeature = async () => {
    if (!editingFeature) return;
    setIsSaving(true);
    try {
      const updatedFlags = featureFlags.map((f) =>
        f.id === editingFeature.id ? editingFeature : f
      );
      await settingsService.updateSettings({
        ...settings,
        featureFlags: updatedFlags,
      } as any);
      setFeatureFlags(updatedFlags);
      setEditingFeature(null);
      toast.success("Feature flag updated and saved.");
    } catch (error) {
      console.error("Failed to save feature:", error);
      toast.error("Failed to save feature flag");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFeature = async () => {
    if (!newFeature || !newFeature.name.trim()) return;
    setIsSaving(true);
    try {
      const newFlag: FeatureFlag = {
        id: `flag-${Date.now()}`,
        name: newFeature.name.trim(),
        description: newFeature.description.trim(),
        isEnabled: false,
      };
      const updatedFlags = [...featureFlags, newFlag];
      await settingsService.updateSettings({
        ...settings,
        featureFlags: updatedFlags,
      } as any);
      setFeatureFlags(updatedFlags);
      setNewFeature(null);
      toast.success("Feature flag added and saved.");
    } catch (error) {
      console.error("Failed to add feature:", error);
      toast.error("Failed to add feature flag");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    setIsSaving(true);
    try {
      const updatedFlags = featureFlags.filter((f) => f.id !== id);
      await settingsService.updateSettings({
        ...settings,
        featureFlags: updatedFlags,
      } as any);
      setFeatureFlags(updatedFlags);
      toast.success("Feature flag removed.");
    } catch (error) {
      console.error("Failed to delete feature:", error);
      toast.error("Failed to delete feature flag");
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = useMemo(() => Boolean(settings), [settings]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage platform-wide rules, contacts, payouts, SEO defaults, and feature controls."
      />

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error || !settings ? (
        <EmptyState
          title="Unable to load settings"
          description={error || "Settings are not available yet."}
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
                <SettingsIcon className="h-4 w-4 text-slate-500" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(event) =>
                    patchSettings((current) => ({
                      ...current,
                      platformName: event.target.value,
                    }))
                  }
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
                <label className="block text-sm font-medium text-slate-700">
                  Platform Commission Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.commissionRate}
                  onChange={(event) =>
                    patchSettings((current) => ({
                      ...current,
                      commissionRate: Number(event.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Percentage of each booking retained as commission.
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  Vendor Registration Fee
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={settings.vendorRegistrationFee ?? 0}
                    onChange={(event) =>
                      patchSettings((current) => ({
                        ...current,
                        vendorRegistrationFee: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  One-time registration fee for new vendors. Set to 0 for free registration.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-slate-500" />
                Customer Tax (GST)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Enable Customer Tax
                  </p>
                  <p className="text-xs text-slate-500">
                    Apply GST tax to all hotel and home bookings.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.advancedSettings?.tax?.enabled ?? false}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      tax: {
                        enabled: event.target.checked,
                        percent: advanced.tax?.percent ?? 12,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
              </label>

              {settings.advancedSettings?.tax?.enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    GST Tax Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.advancedSettings?.tax?.percent ?? 12}
                    onChange={(event) =>
                      updateAdvanced((advanced) => ({
                        ...advanced,
                        tax: {
                          enabled: advanced.tax?.enabled ?? true,
                          percent: Number(event.target.value),
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Tax will be split as CGST and SGST on invoices.
                  </p>
                </div>
              )}
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
                <label className="block text-sm font-medium text-slate-700">
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(event) =>
                    patchSettings((current) => ({
                      ...current,
                      supportEmail: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Support Phone
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={settings.supportPhone}
                  onChange={(event) => {
                    const val = event.target.value.replace(/\D/g, '').slice(0, 10);
                    patchSettings((current) => ({
                      ...current,
                      supportPhone: val,
                    }));
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settings.advancedSettings?.contact?.supportCompanyName || ""}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      contact: {
                        supportEmail: advanced.contact?.supportEmail || settings.supportEmail,
                        supportPhone: advanced.contact?.supportPhone || settings.supportPhone,
                        supportAddress: advanced.contact?.supportAddress || "",
                        supportHours: advanced.contact?.supportHours || "",
                        supportCompanyName: event.target.value,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Support Address
                </label>
                <textarea
                  value={settings.advancedSettings?.contact?.supportAddress || ""}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      contact: {
                        supportEmail: advanced.contact?.supportEmail || settings.supportEmail,
                        supportPhone: advanced.contact?.supportPhone || settings.supportPhone,
                        supportAddress: event.target.value,
                        supportHours: advanced.contact?.supportHours || "",
                        supportCompanyName: advanced.contact?.supportCompanyName || "",
                      },
                    }))
                  }
                  className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Support Hours
                </label>
                <input
                  type="text"
                  value={settings.advancedSettings?.contact?.supportHours || ""}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      contact: {
                        supportEmail: advanced.contact?.supportEmail || settings.supportEmail,
                        supportPhone: advanced.contact?.supportPhone || settings.supportPhone,
                        supportAddress: advanced.contact?.supportAddress || "",
                        supportHours: event.target.value,
                        supportCompanyName: advanced.contact?.supportCompanyName || "",
                      },
                    }))
                  }
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
                  <p className="text-sm font-semibold text-slate-900">
                    Email Notifications
                  </p>
                  <p className="text-xs text-slate-500">
                    Receive email updates about platform activity.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(event) =>
                    patchSettings((current) => ({
                      ...current,
                      emailNotifications: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Push Notifications
                  </p>
                  <p className="text-xs text-slate-500">
                    Receive push notifications for urgent matters.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(event) =>
                    patchSettings((current) => ({
                      ...current,
                      pushNotifications: event.target.checked,
                    }))
                  }
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
                <label className="block text-sm font-medium text-slate-700">
                  Minimum Payout Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.minPayoutAmount}
                  onChange={(event) =>
                    patchSettings((current) => ({
                      ...current,
                      minPayoutAmount: Number(event.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Payout Frequency
                </label>
                <select
                  value={settings.payoutFrequency}
                  onChange={(event) =>
                    patchSettings((current) => ({
                      ...current,
                      payoutFrequency: event.target
                        .value as PlatformSettings["payoutFrequency"],
                    }))
                  }
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
                <Globe className="h-4 w-4 text-slate-500" />
                Platform Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Default State
                </label>
                <input
                  type="text"
                  value={settings.defaultState || 'Andhra Pradesh'}
                  onChange={(event) =>
                    patchSettings((current) => ({
                      ...current,
                      defaultState: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Allowed Cities (comma-separated)
                </label>
                <textarea
                  value={settings.allowedCities?.join(', ') || ''}
                  onChange={(event) =>
                    patchSettings((current) => ({
                      ...current,
                      allowedCities: event.target.value.split(',').map(c => c.trim()).filter(Boolean),
                    }))
                  }
                  placeholder="Visakhapatnam, Vijayawada, Guntur, ..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Only these cities will be available for property listings
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-slate-500" />
                Booking Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Auto-confirm bookings
                  </p>
                  <p className="text-xs text-slate-500">
                    Automatically confirm bookings without manual review.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.advancedSettings?.booking.autoConfirmBookings}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      booking: {
                        ...advanced.booking,
                        autoConfirmBookings: event.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Allow instant refunds
                  </p>
                  <p className="text-xs text-slate-500">
                    Enable faster refund handling for eligible cancellations.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={
                    settings.advancedSettings?.booking.allowInstantRefunds
                  }
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      booking: {
                        ...advanced.booking,
                        allowInstantRefunds: event.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Max Advance Booking Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={
                      settings.advancedSettings?.booking.maxAdvanceBookingDays
                    }
                    onChange={(event) =>
                      updateAdvanced((advanced) => ({
                        ...advanced,
                        booking: {
                          ...advanced.booking,
                          maxAdvanceBookingDays: Number(event.target.value),
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Cancellation Window (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={
                      settings.advancedSettings?.booking.cancellationWindowHours
                    }
                    onChange={(event) =>
                      updateAdvanced((advanced) => ({
                        ...advanced,
                        booking: {
                          ...advanced.booking,
                          cancellationWindowHours: Number(event.target.value),
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-500" />
                SEO Defaults
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Default Meta Title
                </label>
                <input
                  type="text"
                  value={settings.advancedSettings?.seo.metaTitle ?? ""}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      seo: {
                        ...advanced.seo,
                        metaTitle: event.target.value,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Default Meta Description
                </label>
                <textarea
                  rows={3}
                  value={settings.advancedSettings?.seo.metaDescription ?? ""}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      seo: {
                        ...advanced.seo,
                        metaDescription: event.target.value,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Canonical Base URL
                </label>
                <input
                  type="url"
                  value={settings.advancedSettings?.seo.canonicalBaseUrl ?? ""}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      seo: {
                        ...advanced.seo,
                        canonicalBaseUrl: event.target.value.trim() || undefined,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="https://hosthaven.in"
                />
              </div>

              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Allow search indexing
                  </p>
                  <p className="text-xs text-slate-500">
                    When disabled, generated pages will be marked as noindex.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.advancedSettings?.seo.indexable}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      seo: {
                        ...advanced.seo,
                        indexable: event.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-500" />
                Social Links
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={settings.advancedSettings?.social.facebookUrl ?? ""}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      social: {
                        ...advanced.social,
                        facebookUrl: event.target.value.trim() || undefined,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.advancedSettings?.social.instagramUrl ?? ""}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      social: {
                        ...advanced.social,
                        instagramUrl: event.target.value.trim() || undefined,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={settings.advancedSettings?.social.youtubeUrl ?? ""}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      social: {
                        ...advanced.social,
                        youtubeUrl: event.target.value.trim() || undefined,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  X (Twitter) URL
                </label>
                <input
                  type="url"
                  value={settings.advancedSettings?.social.xUrl ?? ""}
                  onChange={(event) =>
                    updateAdvanced((advanced) => ({
                      ...advanced,
                      social: {
                        ...advanced.social,
                        xUrl: event.target.value.trim() || undefined,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
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
                  <div
                    key={template.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
                  >
                    <div className="min-w-[200px] flex-1">
                      <p className="font-semibold text-slate-900">
                        {template.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {template.subject}
                      </p>
                      <p className="text-xs text-slate-400">
                        Trigger: {template.trigger}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingTemplate(template)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                        title="Edit template"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={template.isActive}
                          onChange={() =>
                            setEmailTemplates((prev) =>
                              prev.map((item) =>
                                item.id === template.id
                                  ? { ...item, isActive: !item.isActive }
                                  : item,
                              ),
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                        Active
                      </label>
                    </div>
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setNewFeature({ name: "", description: "" })}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" /> Add Feature
                </button>
              </div>
              {featureFlags.length === 0 ? (
                <p className="text-sm text-slate-500">No feature flags configured.</p>
              ) : (
                featureFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {flag.isEnabled ? (
                        <Zap className="h-5 w-5 text-amber-500" />
                      ) : (
                        <ZapOff className="h-5 w-5 text-slate-300" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{flag.name}</p>
                        <p className="text-sm text-slate-500">
                          {flag.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingFeature(flag)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                        title="Edit feature"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeature(flag.id)}
                        className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                        title="Delete feature"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={flag.isEnabled}
                          onChange={() =>
                            setFeatureFlags((prev) =>
                              prev.map((item) =>
                                item.id === flag.id
                                  ? { ...item, isEnabled: !item.isEnabled }
                                  : item,
                              ),
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-slate-900"
                        />
                        Enabled
                      </label>
                    </div>
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
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-slate-800"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </div>

          <Dialog.Root
            open={Boolean(editingTemplate)}
            onOpenChange={(open) => {
              if (!open) setEditingTemplate(null);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Edit Email Template
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={editingTemplate?.name ?? ""}
                      onChange={(e) =>
                        editingTemplate &&
                        setEditingTemplate({
                          ...editingTemplate,
                          name: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editingTemplate?.subject ?? ""}
                      onChange={(e) =>
                        editingTemplate &&
                        setEditingTemplate({
                          ...editingTemplate,
                          subject: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Trigger
                    </label>
                    <input
                      type="text"
                      value={editingTemplate?.trigger ?? ""}
                      disabled
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={editingTemplate?.isActive ?? false}
                      onChange={(e) =>
                        editingTemplate &&
                        setEditingTemplate({
                          ...editingTemplate,
                          isActive: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    Active
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Save
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Dialog.Root
            open={Boolean(editingFeature)}
            onOpenChange={(open) => {
              if (!open) setEditingFeature(null);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Edit Feature Flag
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Feature Name
                    </label>
                    <input
                      type="text"
                      value={editingFeature?.name ?? ""}
                      onChange={(e) =>
                        editingFeature &&
                        setEditingFeature({
                          ...editingFeature,
                          name: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <textarea
                      value={editingFeature?.description ?? ""}
                      onChange={(e) =>
                        editingFeature &&
                        setEditingFeature({
                          ...editingFeature,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={editingFeature?.isEnabled ?? false}
                      onChange={(e) =>
                        editingFeature &&
                        setEditingFeature({
                          ...editingFeature,
                          isEnabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                    />
                    Enabled
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingFeature(null)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFeature}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Save
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Dialog.Root
            open={Boolean(newFeature)}
            onOpenChange={(open) => {
              if (!open) setNewFeature(null);
            }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Add New Feature Flag
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Feature Name
                    </label>
                    <input
                      type="text"
                      value={newFeature?.name ?? ""}
                      onChange={(e) =>
                        newFeature &&
                        setNewFeature({ ...newFeature, name: e.target.value })
                      }
                      placeholder="e.g., New Checkout Flow"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <textarea
                      value={newFeature?.description ?? ""}
                      onChange={(e) =>
                        newFeature &&
                        setNewFeature({
                          ...newFeature,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe what this feature does..."
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFeature(null)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    disabled={!newFeature?.name.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-indigo-700"
                  >
                    Add Feature
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      )}
    </div>
  );
}
