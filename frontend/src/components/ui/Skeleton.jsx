import { cn } from '../../lib/utils'

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse bg-gray-200 rounded', className)}
      {...props}
    />
  )
}

export default Skeleton

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonRow({ columns = 5 }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-4 py-3 border-b bg-gray-50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  )
}
