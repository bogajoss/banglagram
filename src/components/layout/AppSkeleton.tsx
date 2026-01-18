import { Skeleton } from "@/components/ui/skeleton";

export default function AppSkeleton() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar Skeleton (Desktop) - Mimic generic sidebar */}
      <div className="hidden md:flex flex-col w-[72px] lg:w-[245px] h-screen fixed border-r border-border p-4 gap-4 z-50 bg-background">
        <div className="mb-8 mt-4 flex items-center gap-2 px-2">
          <Skeleton className="w-8 h-8 rounded-md shrink-0" />
          <Skeleton className="h-6 w-32 hidden lg:block" />
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-2 py-3">
              <Skeleton className="w-6 h-6 rounded-md shrink-0" />
              <Skeleton className="h-4 w-24 hidden lg:block" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Nav Skeleton */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background flex justify-around items-center px-4 z-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-6 h-6 rounded-full" />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-grow md:ml-[72px] lg:ml-[245px] flex justify-center pt-4 md:pt-8 pb-20 md:pb-0">
        <div className="w-full max-w-[470px] flex flex-col gap-6 px-4 md:px-0">
          {/* Stories Skeleton */}
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 shrink-0"
              >
                <Skeleton className="w-16 h-16 rounded-full border-2 border-background" />
                <Skeleton className="w-12 h-2" />
              </div>
            ))}
          </div>

          {/* Posts Skeleton */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="w-full rounded-xl overflow-hidden border border-border bg-card shadow-sm"
            >
              <div className="p-3 flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="w-24 h-3" />
                  <Skeleton className="w-16 h-2" />
                </div>
              </div>
              <Skeleton className="w-full aspect-square" />
              <div className="p-3 space-y-3">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-3/4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
