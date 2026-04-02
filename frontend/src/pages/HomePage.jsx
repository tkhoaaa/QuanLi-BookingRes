import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Star, Truck, ShieldCheck, Phone, ChevronRight, Flame, Sparkles } from 'lucide-react'
import { fetchFoods, setFilters } from '../slices/foodsSlice'
import FoodCard from '../features/foods/FoodCard'
import Pagination from '../components/ui/Pagination'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { SkeletonCard } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { CATEGORIES } from '../constants'

export default function HomePage() {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const { foods, loading, filters, pagination } = useSelector((state) => state.foods)

  const [heroSearch, setHeroSearch] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sort, setSort] = useState('createdAt-desc')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const searchTerm = searchParams.get('search')
    if (searchTerm) {
      setHeroSearch(searchTerm)
    }
  }, [searchParams])

  useEffect(() => {
    const [sortField, sortOrder] = sort.split('-')
    dispatch(fetchFoods({
      search: heroSearch,
      category: selectedCategory,
      sort: sortField,
      order: sortOrder,
      page: currentPage,
      limit: 12,
    }))
  }, [heroSearch, selectedCategory, sort, currentPage, dispatch])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    dispatch(setFilters({ search: heroSearch }))
  }

  const handleCategoryClick = (value) => {
    setSelectedCategory(value === selectedCategory ? '' : value)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const features = [
    { icon: Truck, title: 'Giao hàng nhanh chóng', desc: 'Từ 25 - 35 phút' },
    { icon: ShieldCheck, title: 'Thực phẩm chất lượng', desc: 'Đảm bảo vệ sinh ATTP' },
    { icon: Star, title: 'Khách hàng yêu thích', desc: '4.8/5 sao đánh giá' },
  ]

  const categoryIcons = {
    'mon-chinh': '🍚',
    'mon-phu': '🥗',
    'do-uong': '🥤',
    'trang-mieng': '🍰',
    'mon-nhanh': '🍜',
    'combo': '🎁',
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-light">
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-secondary/30 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
                <Flame className="w-4 h-4 text-secondary" />
                Món ăn nổi tiếng Việt Nam
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 font-heading">
                Hả hê <span className="text-secondary">ngon nhất</span>
                <br />
                ngày tại nhà bạn
              </h1>
              <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-lg">
                Khám phá thực đơn đa dạng với hàng trăm món ăn Việt Nam,
                được chế biến từ nguyên liệu tươi ngon nhất.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="relative max-w-xl">
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Tìm món ăn yêu thích của bạn..."
                  className="w-full pl-5 pr-32 py-4 bg-white rounded-2xl shadow-lg text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-4 focus:ring-white/20 text-base"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-colors shadow-sm"
                >
                  Tìm kiếm
                </button>
              </form>

              {/* Quick stats */}
              <div className="flex gap-6 mt-8 text-white/70 text-sm">
                <div>
                  <span className="text-white font-bold text-lg">500+</span> Món ăn
                </div>
                <div className="w-px bg-white/20" />
                <div>
                  <span className="text-white font-bold text-lg">50k+</span> Khách hàng
                </div>
                <div className="w-px bg-white/20" />
                <div>
                  <span className="text-white font-bold text-lg">30 phút</span> Giao hàng
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust badges ───────────────────────────────────── */}
      <section className="py-5 bg-white border-b border-charcoal-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 p-3"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-charcoal-900 text-sm">{f.title}</p>
                  <p className="text-xs text-charcoal-500">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────── */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              <h2 className="text-xl font-bold text-charcoal-900 font-heading">Danh mục</h2>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleCategoryClick('')}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === ''
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
              }`}
            >
              Tất cả
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
                }`}
              >
                <span>{categoryIcons[cat.value] || '🍽️'}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Food Grid ──────────────────────────────────────── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-charcoal-900 font-heading">
                {selectedCategory
                  ? CATEGORIES.find((c) => c.value === selectedCategory)?.label || 'Món ăn'
                  : 'Tất cả món ăn'}
              </h2>
              <span className="px-2 py-0.5 bg-charcoal-100 text-charcoal-500 text-xs rounded-full">
                {pagination.total}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 text-sm border border-charcoal-200 rounded-lg bg-white text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="createdAt-desc">Mới nhất</option>
                <option value="soldCount-desc">Bán chạy</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="ratingAverage-desc">Đánh giá cao</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : foods.length === 0 ? (
              <EmptyState
                icon={() => <span className="text-4xl">🍽️</span>}
                title="Không tìm thấy món ăn"
                description="Thử thay đổi từ khóa tìm kiếm hoặc danh mục lọc"
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {foods.map((food, index) => (
                  <motion.div
                    key={food._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.4) }}
                  >
                    <FoodCard food={food} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────── */}
      {!loading && foods.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-r from-primary-dark to-primary rounded-2xl overflow-hidden px-8 py-10 text-white"
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
              </div>
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold font-heading mb-2">
                    Bạn có món ăn yêu thích?
                  </h3>
                  <p className="text-white/80">
                    Đặt ngay hôm nay, nhanh chóng giao đến của bạn trong 30 phút.
                  </p>
                </div>
                <Link
                  to="/cart"
                  className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-colors shadow-lg"
                >
                  Đặt ngay <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  )
}
