import { Skeleton } from "@/components/ui/skeleton";

/** Same footprint as the Booker, shown in the static HTML until it renders. */
export function BookingSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
    >
      <div className="flex min-w-0 flex-col gap-10">
        <div>
          <Skeleton className="aspect-[2/1] w-full rounded-lg" />
          <Skeleton className="mt-3 h-4 w-56 rounded-sm" />
        </div>
        <div>
          <Skeleton className="h-5 w-16 rounded-sm" />
          <div className="mt-3 flex gap-2 overflow-hidden py-1">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-[5.5rem] w-[4.5rem] shrink-0 rounded-md" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-5 w-20 rounded-sm" />
          <Skeleton className="mt-3 h-[3.25rem] w-full max-w-xs rounded-full" />
        </div>
        <div>
          <Skeleton className="h-5 w-24 rounded-sm" />
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton key={i} className="h-11 rounded-md" />
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="hidden h-[26rem] rounded-lg lg:block" />
    </div>
  );
}
