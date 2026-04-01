import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { ChefHat, Star, TrendingUp, Truck, ShieldCheck, Phone } from 'lucide-react'
import { fetchFoods, setFilters } from '../slices/foodsSlice'
import FoodCard from '../features/foods/FoodCard'
import SearchFilterBar from '../features/foods/SearchFilterBar'
import Pagination from '../components/ui/Pagination'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { SkeletonCard } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { UtensilsCrossed } from 'lucide-react'

export default function HomePage() {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const { foods, loading, filters, pagination } = useSelector((state) => state.foods)

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('createdAt-desc')
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    const searchTerm = searchParams.get('search')
    if (searchTerm) {
      setSearch(searchTerm)
      dispatch(setFilters({ search: searchTerm }))
    }
  }, [searchParams, dispatch])

  useEffect(() => {
    const [sortField, sortOrder] = sort.split('-')
    dispatch(
      fetchFoods({
        ...filters,
        search,
        category,
        sort: sortField,
        order: sortOrder,
        page: 1,
      })
    )
  }, [search, category, sort, dispatch])

  const handlePageChange = (page) => {
    dispatch(fetchFoods({ ...filters, search, category, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const features = [
    { icon: Truck, title: 'Giao hang nhanh chong', desc: 'Giao hang trong 30 phut' },
    { icon: ShieldCheck, title: 'Thuc an chat luong', desc: 'Dam bao ve sinh an toan thuc pham' },
    { icon: Star, title: 'Danh gia cao', desc: 'Hien thi danh gia tu khach hang' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-orange-700 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Dat mon an <span className="text-yellow-300">ngon</span> ngay tai nha
            </h1>
            <p className="text-lg text-white/80 mb-8">
              He thong dat mon online hien dai, thuc don da dang, giao hang nhanh chong den cua ban.
            </p>
            <div className="flex gap-4">
              <a
                href="#menu"
                className="px-6 py-3 bg-white text-primary font-semibold rounded-full hover:bg-yellow-300 transition-colors"
              >
                Xem thuc don
              </a>
              <a
                href="tel:0123456789"
                className="px-6 py-3 bg-white/20 font-semibold rounded-full hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Lien he
              </a>
            </div>
          </motion.div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10">
          <ChefHat className="w-64 h-64" />
        </div>
      </section>

      {/* Features */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-primary" />
              Thuc don
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendingUp className="w-4 h-4 text-secondary" />
              Mon an hot nhat
            </div>
          </div>

          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            total={pagination.total}
          />

          {/* Food Grid */}
          <div className="mt-6">
            {loading ? (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : foods.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="Khong tim thay mon an"
                description="Thu thay doi tu khoa tim kiem hoac danh muc loc"
              />
            ) : (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                {foods.map((food, index) => (
                  <motion.div
                    key={food._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <FoodCard food={food} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
