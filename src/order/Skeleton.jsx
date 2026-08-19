/**
 * Skeleton placeholders.
 *
 * These mirror the real row/card dimensions so the layout does not jump when
 * data arrives — the ui-ux-pro-max "Performance / reserve space (CLS < 0.1)"
 * rule. A spinner cannot do this because it occupies no meaningful space.
 */

export function ProductSkeleton({ count = 8 }) {
  return (
    <div
      className="grid gap-2.5 min-[620px]:grid-cols-2 sm:gap-3"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-card bg-white p-3 shadow-sm sm:p-3.5"
        >
          <div className="skel size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="skel h-3.5 w-3/5 rounded" />
            <div className="skel mt-1.5 h-2.5 w-2/5 rounded" />
            <div className="skel mt-2 h-3 w-1/3 rounded" />
          </div>
          <div className="skel h-9 w-16 shrink-0 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function OrderSkeleton({ count = 3 }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading orders">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 border-b border-hairline pb-3">
            <div className="skel h-3.5 w-24 rounded" />
            <div className="skel h-5 w-16 rounded-full" />
            <div className="skel ml-auto h-3 w-28 rounded" />
          </div>
          <div className="skel h-3 w-4/5 rounded" />
          <div className="skel mt-2 h-3 w-3/5 rounded" />
          <div className="skel mt-3 h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function TileSkeleton({ count = 5 }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-tile">
          <div className="skel size-9 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="skel h-2.5 w-3/4 rounded" />
            <div className="skel mt-1.5 h-4 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
