interface LoadingSkeletonProps {
  variant?: 'hotel-card' | 'review-card' | 'room-card' | 'text' | 'hero'
  count?: number
  className?: string
}

function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-sm overflow-hidden shadow-card">
      {/* Image */}
      <div className="aspect-hotel-card bg-neutral-200 animate-shimmer"
           style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
      />
      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="h-3 w-16 bg-neutral-200 rounded animate-shimmer"
             style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
        />
        <div className="h-6 w-3/4 bg-neutral-200 rounded animate-shimmer"
             style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
        />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 bg-neutral-200 rounded-sm animate-shimmer"
                 style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
            />
          ))}
        </div>
        <div className="h-4 w-full bg-neutral-200 rounded animate-shimmer"
             style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
        />
        <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
          <div className="h-6 w-28 bg-neutral-200 rounded animate-shimmer"
               style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
          />
          <div className="h-9 w-24 bg-neutral-200 rounded animate-shimmer"
               style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
          />
        </div>
      </div>
    </div>
  )
}

function ReviewCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-sm border border-neutral-100 shadow-card">
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-4 h-4 bg-neutral-200 rounded-sm animate-shimmer"
               style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
          />
        ))}
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full bg-neutral-200 rounded animate-shimmer"
             style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
        />
        <div className="h-3 w-full bg-neutral-200 rounded animate-shimmer"
             style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
        />
        <div className="h-3 w-3/4 bg-neutral-200 rounded animate-shimmer"
             style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-neutral-200 animate-shimmer"
             style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
        />
        <div className="space-y-1">
          <div className="h-3 w-24 bg-neutral-200 rounded animate-shimmer"
               style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
          />
          <div className="h-2 w-16 bg-neutral-200 rounded animate-shimmer"
               style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
          />
        </div>
      </div>
    </div>
  )
}

function RoomCardSkeleton() {
  return (
    <div className="bg-white rounded-sm border border-neutral-100 shadow-card overflow-hidden flex flex-col sm:flex-row">
      <div className="w-full sm:w-56 h-48 sm:h-auto bg-neutral-200 flex-shrink-0 animate-shimmer"
           style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
      />
      <div className="flex-1 p-5 space-y-3">
        <div className="h-6 w-2/3 bg-neutral-200 rounded animate-shimmer"
             style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
        />
        <div className="h-4 w-1/2 bg-neutral-200 rounded animate-shimmer"
             style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
        />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-16 bg-neutral-200 rounded animate-shimmer"
                 style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
            />
          ))}
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
          <div className="h-8 w-32 bg-neutral-200 rounded animate-shimmer"
               style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
          />
          <div className="h-10 w-28 bg-neutral-200 rounded animate-shimmer"
               style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
          />
        </div>
      </div>
    </div>
  )
}

function TextSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-full bg-neutral-200 rounded animate-shimmer"
           style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
      />
      <div className="h-4 w-5/6 bg-neutral-200 rounded animate-shimmer"
           style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
      />
      <div className="h-4 w-4/5 bg-neutral-200 rounded animate-shimmer"
           style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }}
      />
    </div>
  )
}

const VARIANTS = {
  'hotel-card': HotelCardSkeleton,
  'review-card': ReviewCardSkeleton,
  'room-card': RoomCardSkeleton,
  'text': TextSkeleton,
  'hero': () => <div className="h-[70vh] bg-neutral-200 animate-shimmer" style={{ backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)' }} />,
}

export default function LoadingSkeleton({
  variant = 'hotel-card',
  count = 1,
  className = '',
}: LoadingSkeletonProps) {
  const Component = VARIANTS[variant]

  if (count === 1) {
    return (
      <div className={className}>
        <Component />
      </div>
    )
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={className}>
          <Component />
        </div>
      ))}
    </>
  )
}
