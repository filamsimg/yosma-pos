import { Skeleton } from "@/components/ui/skeleton";

interface TableRowsSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableRowsSkeleton({ rows = 6, columns = 6 }: TableRowsSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-100/80">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-3.5 align-middle">
              <Skeleton 
                className={`h-4 rounded-xs ${
                  colIndex === 0 
                    ? 'w-24' 
                    : colIndex === 1 
                    ? 'w-32' 
                    : colIndex === columns - 1 
                    ? 'w-16 ml-auto' 
                    : 'w-20'
                }`} 
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
