import Skeleton from "./Skeleton";

const FeedSkeleton = () => {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="bg-moboxd-card rounded-2xl overflow-hidden border border-[#2A2A35] shadow-lg"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />

              <Skeleton className="h-4 w-28 rounded-md" />
            </div>

            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* Image */}
          <Skeleton className="w-full aspect-[4/5] rounded-none" />

          {/* Card Body */}
          <div className="p-4">
            <Skeleton className="h-5 w-full rounded-md mb-3" />

            <Skeleton className="h-5 w-3/4 rounded-md mb-5" />

            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24 rounded-md" />

              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Skeleton
                    key={star}
                    className="w-4 h-4 rounded-sm"
                  />
                ))}
              </div>

              <Skeleton className="h-4 w-8 rounded-md" />
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-4 py-3 border-t border-[#2A2A35] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="w-6 h-4 rounded-md" />
              </div>

              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="w-6 h-4 rounded-md" />
              </div>
            </div>

            <div className="flex items-center gap-5">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="w-5 h-5 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeedSkeleton;