export default function Loading() {
  return (
    <div className="min-h-screen bg-section animate-pulse" aria-label="Loading...">
      {/* Navbar skeleton */}
      <div className="h-[4.5rem] bg-white shadow-sm flex items-center px-6">
        <div className="h-6 w-40 bg-neutral-200 rounded skeleton" />
        <div className="ml-auto flex items-center gap-6">
          <div className="h-4 w-16 bg-neutral-200 rounded skeleton hidden md:block" />
          <div className="h-4 w-16 bg-neutral-200 rounded skeleton hidden md:block" />
          <div className="h-4 w-16 bg-neutral-200 rounded skeleton hidden md:block" />
          <div className="h-9 w-24 bg-neutral-200 rounded skeleton" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="h-[70vh] bg-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 skeleton opacity-30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4">
          <div className="h-3 w-48 bg-white/20 rounded skeleton" />
          <div className="h-14 w-[480px] max-w-full bg-white/20 rounded skeleton" />
          <div className="h-14 w-96 max-w-full bg-white/20 rounded skeleton" />
          <div className="h-1 w-16 bg-white/20 rounded" />
          <div className="h-20 w-full max-w-3xl bg-white/10 rounded skeleton mt-4" />
        </div>
      </div>

      {/* Hotels section skeleton */}
      <div className="py-20 bg-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="text-center mb-12 space-y-3">
            <div className="h-3 w-20 bg-neutral-300 rounded skeleton mx-auto" />
            <div className="h-9 w-64 bg-neutral-300 rounded skeleton mx-auto" />
            <div className="h-0.5 w-16 bg-neutral-300 rounded mx-auto" />
            <div className="h-4 w-96 max-w-full bg-neutral-200 rounded skeleton mx-auto" />
          </div>

          {/* Hotel cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-sm overflow-hidden shadow-card">
                {/* Image */}
                <div className="aspect-hotel-card skeleton" />
                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="h-3 w-16 skeleton rounded" />
                  <div className="h-6 w-3/4 skeleton rounded" />
                  <div className="h-4 w-1/2 skeleton rounded" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-5 w-24 skeleton rounded" />
                    <div className="h-9 w-24 skeleton rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
