type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`hm-skeleton ${className}`} aria-hidden />;
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

export function SkeletonText({ lines = 3, className = "" }: SkeletonTextProps) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-4 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}
