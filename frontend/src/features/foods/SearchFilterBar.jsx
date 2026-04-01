import { Search, LayoutGrid, List, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { CATEGORIES } from '../../constants'

export default function SearchFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  total,
  className,
}) {
  const sortOptions = [
    { value: 'createdAt-desc', label: 'Moi nhat' },
    { value: 'createdAt-asc', label: 'Cu nhat' },
    { value: 'price-asc', label: 'Gia thap den cao' },
    { value: 'price-desc', label: 'Gia cao xuong thap' },
    { value: 'name-asc', label: 'Ten A-Z' },
    { value: 'name-desc', label: 'Ten Z-A' },
    { value: 'rating-desc', label: 'Danh gia cao nhat' },
  ]

  return (
    <div className={cn('bg-white rounded-xl p-4 shadow-sm', className)}>
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tim kiem mon an..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[160px]"
        >
          <option value="">Tat ca danh muc</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[160px]"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'p-2.5 transition-colors',
              viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'p-2.5 transition-colors',
              viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Tim thay <span className="font-medium text-gray-900">{total}</span> mon an
        </p>
        {(search || category) && (
          <button
            onClick={() => {
              onSearchChange('')
              onCategoryChange('')
            }}
            className="text-xs text-primary hover:text-primary-dark"
          >
            Xoa bo loc
          </button>
        )}
      </div>
    </div>
  )
}
