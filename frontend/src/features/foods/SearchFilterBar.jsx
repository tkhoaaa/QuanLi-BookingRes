import { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Search, LayoutGrid, List, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { CATEGORIES } from '../../constants'
import { setFilters } from '../../slices/foodsSlice'

export default function SearchFilterBar({
  search = '',
  onSearchChange,
  category = '',
  onCategoryChange,
  sort = 'createdAt-desc',
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  total = 0,
  className,
}) {
  const dispatch = useDispatch()
  const [localSearch, setLocalSearch] = useState(search)
  const searchTimeoutRef = useRef(null)

  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  const handleSearchChange = (value) => {
    setLocalSearch(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      if (onSearchChange) onSearchChange(value)
    }, 300)
  }

  const sortOptions = [
    { value: 'createdAt-desc', label: 'Mới nhất' },
    { value: 'createdAt-asc', label: 'Cũ nhất' },
    { value: 'price-asc', label: 'Giá thấp đến cao' },
    { value: 'price-desc', label: 'Giá cao xuống thấp' },
    { value: 'name-asc', label: 'Tên A-Z' },
    { value: 'name-desc', label: 'Tên Z-A' },
    { value: 'rating-desc', label: 'Đánh giá cao nhất' },
    { value: 'soldCount-desc', label: 'Bán chạy nhất' },
  ]

  return (
    <div className={cn('bg-white rounded-xl p-4 shadow-sm', className)}>
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {localSearch && (
            <button
              onClick={() => {
                handleSearchChange('')
                if (onSearchChange) onSearchChange('')
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
          className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[160px]"
        >
          <option value="">Tất cả danh mục</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSortChange && onSortChange(e.target.value)}
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
            onClick={() => onViewModeChange && onViewModeChange('grid')}
            className={cn(
              'p-2.5 transition-colors',
              viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange && onViewModeChange('list')}
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
          Tìm thấy <span className="font-medium text-gray-900">{total}</span> món ăn
        </p>
        {(localSearch || category) && (
          <button
            onClick={() => {
              setLocalSearch('')
              if (onSearchChange) onSearchChange('')
              if (onCategoryChange) onCategoryChange('')
            }}
            className="text-xs text-primary hover:text-primary-dark"
          >
            Xóa bỏ lọc
          </button>
        )}
      </div>
    </div>
  )
}
