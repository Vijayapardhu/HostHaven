import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Edit2,
  ExternalLink,
  FileCode2,
  Bell,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { settingsService, type CmsAudience, type CmsPage } from "../lib/settings";
import { notificationsService } from "../lib/notifications";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/PageLoader";
import { EmptyState } from "../components/ui/EmptyState";
import { FiltersBar } from "../components/ui/FiltersBar";
import { SearchInput } from "../components/ui/SearchInput";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import * as Dialog from "@radix-ui/react-dialog";

type AudienceFilter = "all" | CmsAudience;

type CmsFormState = {
  id?: string;
  title: string;
  slug: string;
  audience: CmsAudience;
  summary: string;
  content: string;
  coverImageUrl: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
};

const USER_BASE_URL =
  (import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined) ||
  "https://hosthaven.in";
const VENDOR_BASE_URL =
  (import.meta.env.VITE_PUBLIC_VENDOR_URL as string | undefined) ||
  "https://vendor.hosthaven.in";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createEmptyForm = (): CmsFormState => ({
  title: "",
  slug: "",
  audience: "user",
  summary: "",
  content: "",
  coverImageUrl: "",
  seoTitle: "",
  seoDescription: "",
  isPublished: false,
});

const normalizeInput = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toUpdatePayload = (form: CmsFormState) => ({
  title: form.title.trim(),
  slug: form.slug.trim(),
  audience: form.audience,
  summary: normalizeInput(form.summary),
  content: form.content.trim(),
  coverImageUrl: normalizeInput(form.coverImageUrl),
  seoTitle: normalizeInput(form.seoTitle),
  seoDescription: normalizeInput(form.seoDescription),
  isPublished: form.isPublished,
});

const getBaseUrl = (audience: CmsAudience) =>
  audience === "vendor" ? VENDOR_BASE_URL : USER_BASE_URL;

const buildCmsUrl = (audience: CmsAudience, slug: string) => {
  const base = getBaseUrl(audience).replace(/\/$/, "");
  return `${base}/${slug}`;
};

export default function CmsPages() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<CmsFormState>(createEmptyForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [publishLoadingId, setPublishLoadingId] = useState<string | null>(null);
  const [notifyLoadingId, setNotifyLoadingId] = useState<string | null>(null);

  const fetchPages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await settingsService.getCmsPages();
      setPages(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load CMS pages.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const filteredPages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return pages.filter((page) => {
      if (audienceFilter !== "all" && page.audience !== audienceFilter) {
        return false;
      }
      if (!query) return true;
      return (
        page.title.toLowerCase().includes(query) ||
        page.slug.toLowerCase().includes(query) ||
        (page.summary || "").toLowerCase().includes(query)
      );
    });
  }, [pages, searchTerm, audienceFilter]);

  const openCreate = () => {
    setSlugTouched(false);
    setFormState(createEmptyForm());
    setFormOpen(true);
  };

  const openEdit = (page: CmsPage) => {
    setSlugTouched(true);
    setFormState({
      id: page.id,
      title: page.title,
      slug: page.slug,
      audience: page.audience,
      summary: page.summary || "",
      content: page.content,
      coverImageUrl: page.coverImageUrl || "",
      seoTitle: page.seoTitle || "",
      seoDescription: page.seoDescription || "",
      isPublished: page.isPublished,
    });
    setFormOpen(true);
  };

  const handleTitleChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSave = async () => {
    if (!formState.title.trim() || !formState.slug.trim() || !formState.content.trim()) {
      toast.error("Title, slug, and content are required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = toUpdatePayload(formState);
      let saved: CmsPage;
      if (formState.id) {
        saved = await settingsService.updateCmsPage(formState.id, payload);
        setPages((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
        toast.success("CMS page updated.");
      } else {
        saved = await settingsService.createCmsPage(payload);
        setPages((prev) => [saved, ...prev]);
        toast.success("CMS page created.");
      }
      setFormOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save CMS page.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await settingsService.deleteCmsPage(confirmDeleteId);
      setPages((prev) => prev.filter((item) => item.id !== confirmDeleteId));
      toast.success("CMS page deleted.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete CMS page.");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleTogglePublish = async (page: CmsPage) => {
    setPublishLoadingId(page.id);
    try {
      const updated = await settingsService.updateCmsPage(page.id, {
        isPublished: !page.isPublished,
      });
      setPages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(
        updated.isPublished ? "Page published successfully." : "Page moved to draft.",
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update page status.");
    } finally {
      setPublishLoadingId(null);
    }
  };

  const handleCopyUrl = async (page: CmsPage) => {
    const url = buildCmsUrl(page.audience, page.slug);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Page URL copied.");
    } catch {
      toast.error("Unable to copy URL.");
    }
  };

  const handleNotifyAudience = async (page: CmsPage) => {
    setNotifyLoadingId(page.id);
    try {
      const livePage = page.isPublished
        ? page
        : await settingsService.updateCmsPage(page.id, { isPublished: true });

      if (!page.isPublished) {
        setPages((prev) =>
          prev.map((item) => (item.id === livePage.id ? livePage : item)),
        );
      }

      const pageUrl = buildCmsUrl(livePage.audience, livePage.slug);
      const target = livePage.audience === "vendor" ? "vendors" : "users";
      const result = await notificationsService.sendPushNotification({
        title: livePage.title,
        message: `${livePage.summary || "New update available"}\n${pageUrl}`,
        type: "cms_page_published",
        target,
      });
      toast.success(`Notification sent to ${result?.sentCount ?? 0} recipients.`);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to publish/notify audience.",
      );
    } finally {
      setNotifyLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CMS Pages"
        description="Create and publish custom user/vendor landing pages with shareable slugs."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Page
          </button>
        }
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by title, slug, or summary"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <select
            title="Filter by audience"
            aria-label="Filter CMS pages by audience"
            value={audienceFilter}
            onChange={(event) =>
              setAudienceFilter(event.target.value as AudienceFilter)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All audiences</option>
            <option value="user">Users</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load CMS pages"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchPages}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : filteredPages.length === 0 ? (
        <EmptyState
          title="No CMS pages found"
          description="Create your first custom page for users or vendors."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Create page
            </button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredPages.map((page) => {
            const url = buildCmsUrl(page.audience, page.slug);
            return (
              <Card key={page.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-slate-500" />
                      <span>{page.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        label={page.audience === "user" ? "User" : "Vendor"}
                        variant={page.audience === "user" ? "info" : "warning"}
                      />
                      <StatusBadge
                        label={page.isPublished ? "Published" : "Draft"}
                        variant={page.isPublished ? "success" : "neutral"}
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-900">/{page.slug}</p>
                    <p className="truncate text-xs text-slate-500">{url}</p>
                  </div>
                  {page.summary && (
                    <p className="text-sm text-slate-600">{page.summary}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Updated on {new Date(page.updatedAt).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(page)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(page)}
                      disabled={publishLoadingId === page.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      {publishLoadingId === page.id
                        ? "Saving..."
                        : page.isPublished
                          ? "Move to Draft"
                          : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(page)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy URL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNotifyAudience(page)}
                      disabled={notifyLoadingId === page.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      {notifyLoadingId === page.id
                        ? "Sending..."
                        : page.isPublished
                          ? "Notify Audience"
                          : "Publish & Notify"}
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </a>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(page.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog.Root open={formOpen} onOpenChange={setFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-3xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {formState.id ? "Edit CMS Page" : "Create CMS Page"}
            </Dialog.Title>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Title
                  </label>
                  <input
                    type="text"
                    title="Page title"
                    placeholder="Enter page title"
                    value={formState.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Slug
                  </label>
                  <input
                    type="text"
                    title="Page slug"
                    placeholder="enter-page-slug"
                    value={formState.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setFormState((prev) => ({
                        ...prev,
                        slug: slugify(event.target.value),
                      }));
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Audience
                  </label>
                  <select
                    title="Target audience"
                    aria-label="Select target audience"
                    value={formState.audience}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        audience: event.target.value as CmsAudience,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="user">Users</option>
                    <option value="vendor">Vendors</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    title="Cover image URL"
                    placeholder="https://example.com/cover.jpg"
                    value={formState.coverImageUrl}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        coverImageUrl: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Summary
                </label>
                <textarea
                  rows={2}
                  title="Page summary"
                  placeholder="Brief summary for cards and notifications"
                  value={formState.summary}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      summary: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Content (HTML)
                </label>
                <textarea
                  rows={10}
                  value={formState.content}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      content: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
                  placeholder="<h1>Special Offer</h1><p>Offer details...</p>"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    title="SEO title"
                    placeholder="Search optimized title"
                    value={formState.seoTitle}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        seoTitle: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    SEO Description
                  </label>
                  <input
                    type="text"
                    title="SEO description"
                    placeholder="Search optimized description"
                    value={formState.seoDescription}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        seoDescription: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formState.isPublished}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      isPublished: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Publish immediately
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-slate-800"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Page"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
        title="Delete CMS page?"
        description="This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
