import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileCode2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";

type PublicCmsPage = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  coverImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  updatedAt: string;
};

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const API_URL = `${BASE_URL}/v1`;

const sanitizeHtml = (
  html: string,
): { bodyHtml: string; documentHtml: string; isFullDocument: boolean } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc
    .querySelectorAll(
      'script,iframe,object,embed,applet,form,button,input,textarea,select,link[rel="import"],meta[http-equiv="refresh"]'
    )
    .forEach((node) => node.remove());

  doc.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (["href", "src", "xlink:href"].includes(name) && /^javascript:/i.test(value)) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  const isFullDocument = /<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(html);
  return {
    bodyHtml: doc.body.innerHTML,
    documentHtml: doc.documentElement.outerHTML,
    isFullDocument,
  };
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
        const response = await fetch(`${API_URL}/cms/user/${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
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

  const title = page?.seoTitle || page?.title || "Custom Page";
  const description =
    page?.seoDescription ||
    page?.summary ||
    "HostHaven updates and custom announcements.";

  const sanitizedContent = useMemo(
    () =>
      page?.content
        ? sanitizeHtml(page.content)
        : { bodyHtml: '', documentHtml: '', isFullDocument: false },
    [page?.content]
  );

  return (
    <>
      <SEOHead title={title} description={description} />
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          {isLoading ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              Loading page...
            </div>
          ) : error || !page ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
              <FileCode2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <h1 className="text-2xl font-semibold">Page unavailable</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {error || "This page is unavailable right now."}
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          ) : (
            <section
              className="w-full"
              dangerouslySetInnerHTML={{ __html: sanitizedContent.bodyHtml }}
            />
          )}
        </div>
      </Layout>
    </>
  );
};

export default CmsPage;
