import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileCode2 } from "lucide-react";

type PublicCmsPage = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  coverImageUrl?: string;
  updatedAt: string;
};

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000/v1").replace(
  /\/$/,
  "",
);

const sanitizeHtml = (html: string): string => {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
};

const CmsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PublicCmsPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!slug) {
        setError("Page not found.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_URL}/cms/vendor/${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
          },
        );
        const json = await response.json();
        if (!response.ok || !json?.success || !json?.data) {
          throw new Error(json?.error?.message || "Page not found.");
        }
        if (!cancelled) {
          setPage(json.data as PublicCmsPage);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Unable to load page.");
          setPage(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
            Loading page...
          </div>
        ) : error || !page ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
            <FileCode2 className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h1 className="text-2xl font-semibold">Page unavailable</h1>
            <p className="mt-2 text-sm text-slate-400">
              {error || "This page is unavailable right now."}
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Vendor Login
            </Link>
          </div>
        ) : (
          <article className="space-y-6">
            {page.coverImageUrl && (
              <img
                src={page.coverImageUrl}
                alt={page.title}
                className="h-64 w-full rounded-2xl object-cover md:h-80"
              />
            )}
            <header className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Updated {new Date(page.updatedAt).toLocaleDateString()}
              </p>
              <h1 className="text-3xl font-bold md:text-4xl">{page.title}</h1>
              {page.summary && (
                <p className="text-lg text-slate-300">{page.summary}</p>
              )}
            </header>
            <section
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
            />
          </article>
        )}
      </div>
    </div>
  );
};

export default CmsPage;
