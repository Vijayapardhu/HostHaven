/**
 * Placeholder shown while the homepage configuration loads, so the page never
 * flashes empty (or a fallback hero) before the real, admin-configured content
 * is ready.
 */
const HomeSkeleton = () => (
  <div className="container mx-auto px-4 py-6 space-y-10" aria-hidden="true">
    {/* Search / booking card */}
    <div className="rounded-2xl bg-card shadow-card border border-border/60 p-5 space-y-4">
      <div className="h-7 w-52 mx-auto rounded-lg bg-muted animate-pulse" />
      <div className="h-4 w-64 mx-auto rounded bg-muted/70 animate-pulse" />
      <div className="h-12 w-full rounded-xl bg-muted animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-12 w-full rounded-xl bg-muted animate-pulse" />
    </div>

    {/* Destinations grid */}
    <div className="space-y-4">
      <div className="h-6 w-56 rounded-lg bg-muted animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

export default HomeSkeleton;
