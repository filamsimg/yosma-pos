import { cn } from "@/lib/utils"

interface SkeletonProps extends React.ComponentProps<"div"> {
  shimmer?: boolean;
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md",
        shimmer ? "shimmer" : "animate-pulse bg-muted",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

