import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Truck, ShieldCheck, Phone, ChevronRight, Flame, Sparkles, Gift, MapPin, Zap } from 'lucide-react'
import { fetchFoods, setFilters } from '../slices/foodsSlice'
import FoodCard from '../features/foods/FoodCard'
import Pagination from '../components/ui/Pagination'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { SkeletonCard } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { CATEGORIES } from '../constants'
import axiosClient from '../api/axiosClient'

const SERVICE_MODES = [
  { value: 'delivery', label: 'Giao hàng', icon: Truck },
  { value: 'pickup', label: 'Lấy tại cửa hàng', icon: MapPin },
  { value: 'dinein', label: 'Ăn tại bàn', icon: Star },
]

const mockPromo = {
  code: 'FLASH50K',
  label: 'Giảm 50K cho đơn từ 200K',
  discount: 50000,
  minOrder: 200000,
}

export default function HomePage() {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const { foods, loading, filters, pagination } = useSelector((state) => state.foods)

  const [heroSearch, setHeroSearch] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sort, setSort] = useState('createdAt-desc')
  const [currentPage, setCurrentPage] = useState(1)

  // Branch selector
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false)

  // Service mode
  const [serviceMode, setServiceMode] = useState('delivery')

  // Bestsellers & combos
  const [bestsellers, setBestsellers] = useState([])
  const [combos, setCombos] = useState([])

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

  // Load branches from API
  useEffect(() => {
    const savedBranch = localStorage.getItem('res_booking_branch')
    axiosClient.get('/branches').then(res => {
      const list = res.data.data || []
      setBranches(list)
      if (savedBranch) {
        const parsed = list.find(b => b._id === savedBranch)
        if (parsed) setSelectedBranch(parsed)
        else if (list.length > 0) setSelectedBranch(list[0])
      } else if (list.length > 0) {
        setSelectedBranch(list[0])
      }
    }).catch(() => setBranches([]))
  }, [])

  // Load bestsellers & combos
  useEffect(() => {
    axiosClient.get('/foods?sort=soldCount&order=desc&limit=20').then(res => {
      const all = res.data.data?.foods || []
      setBestsellers(all.slice(0, 6))
    }).catch(() => {})
    axiosClient.get('/foods?category=combo&limit=20').then(res => {
      const all = res.data.data?.foods || []
      setCombos(all.slice(0, 6))
    }).catch(() => {})
  }, [])

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch)
    localStorage.setItem('res_booking_branch', branch._id)
    setBranchDropdownOpen(false)
  }

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
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="flex-1 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
                  <Flame className="w-4 h-4 text-secondary" />
                  Mon an noi tieng Viet Nam
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 font-heading">
                  Ha he <span className="text-secondary">ngon nhat</span>
                  <br />
                  ngay tai nha ban
                </h1>
                <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-lg">
                  Kham pha thuc don da dang voi hang tram mon an Viet Nam,
                  duoc che bien tu nguyen lieu tuoi ngon nhat.
                </p>

                {/* Service Mode Toggle */}
                <div className="flex gap-2 mb-6">
                  {SERVICE_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setServiceMode(mode.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        serviceMode === mode.value
                          ? 'bg-white text-primary shadow-sm'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      <mode.icon className="w-4 h-4" />
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Search bar */}
                <form onSubmit={handleSearch} className="relative max-w-xl">
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Tim mon an yeu thich cua ban..."
                    className="w-full pl-5 pr-32 py-4 bg-white rounded-2xl shadow-lg text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-4 focus:ring-white/20 text-base"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-colors shadow-sm"
                  >
                    Tim kiem
                  </button>
                </form>

                {/* Quick stats */}
                <div className="flex gap-6 mt-8 text-white/70 text-sm">
                  <div>
                    <span className="text-white font-bold text-lg">50+</span> Mon an
                  </div>
                  <div className="w-px bg-white/20" />
                  <div>
                    <span className="text-white font-bold text-lg">1k+</span> Khach hang
                  </div>
                  <div className="w-px bg-white/20" />
                  <div>
                    <span className="text-white font-bold text-lg">30 phut</span> Giao hang
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative food illustration placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:flex flex-col items-center justify-center"
            >
              <div className="relative">
                <div className="w-72 h-72 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <div className="text-center">
                    <span className="text-7xl block mb-2">🍲</span>
                    <span className="text-white/70 text-sm font-medium">Nguyen lieu tuoi ngon</span>
                  </div>
                </div>
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-4 -right-4 bg-secondary text-white px-3 py-1.5 rounded-xl shadow-lg text-sm font-bold"
                >
                  Giam 20%
                </motion.div>
                <motion.div
                  animate={{ y: [4, -4, 4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-4 -left-4 bg-white text-charcoal-900 px-3 py-1.5 rounded-xl shadow-lg text-sm font-bold"
                >
                  Free ship!
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Branch Selector ────────────────────────────────── */}
      <section className="py-4 bg-white border-b border-charcoal-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative inline-block">
            <button
              onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-charcoal-100 hover:bg-charcoal-200 rounded-xl text-sm font-medium text-charcoal-700 transition-colors"
            >
              <MapPin className="w-4 h-4 text-primary" />
              {selectedBranch ? (
                <span>{selectedBranch.name}</span>
              ) : (
                <span>Chon chi nhanh</span>
              )}
              <ChevronRight className={`w-4 h-4 transition-transform ${branchDropdownOpen ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {branchDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-charcoal-200 z-50 overflow-hidden"
                >
                  {branches.length === 0 ? (
                    <div className="p-4 text-sm text-charcoal-500 text-center">Dang tai chi nhanh...</div>
                  ) : (
                    branches.map((branch) => (
                      <button
                        key={branch._id}
                        onClick={() => handleBranchSelect(branch)}
                        className={`w-full text-left px-4 py-3 hover:bg-charcoal-50 transition-colors ${
                          selectedBranch?._id === branch._id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <p className={`text-sm font-semibold ${selectedBranch?._id === branch._id ? 'text-primary' : 'text-charcoal-900'}`}>
                          {branch.name}
                        </p>
                        <p className="text-xs text-charcoal-500 mt-0.5">{branch.address}</p>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── Promo/Flash Sale Banner ─────────────────────────── */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 rounded-2xl overflow-hidden px-8 py-6 shadow-lg"
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)'
              }} />
            </div>

            <div className="relative flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Zap className="w-10 h-10 text-white" />
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      FLASH SALE
                    </span>
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      Het hot sau: 02:34:17
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-xl font-heading">
                    Khuyen mai dac biet hom nay!
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                  <p className="text-white/80 text-xs mb-0.5">Ma giam gia</p>
                  <p className="text-white font-bold text-lg tracking-wider">{mockPromo.code}</p>
                  <p className="text-white/80 text-xs mt-0.5">{mockPromo.label}</p>
                </div>
                <Link
                  to="/cart"
                  className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors shadow-sm"
                >
                  Ap dung ngay <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust badges ───────────────────────────────────── */}
      <section className="pb-2 bg-white border-b border-charcoal-100">
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

      {/* ── Bestseller Section ─────────────────────────────── */}
      {bestsellers.length > 0 && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-secondary" />
                <h2 className="text-xl font-bold text-charcoal-900 font-heading">Ban chay nhat</h2>
              </div>
              <Link
                to="/?sort=soldCount&order=desc"
                className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
              >
                Xem tat ca <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {bestsellers.map((food, index) => (
                <motion.div
                  key={food._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="flex-shrink-0 w-56"
                >
                  <FoodCard food={food} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Combo Section ──────────────────────────────────── */}
      {combos.length > 0 && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-bold text-charcoal-900 font-heading">Combo tiet kiem</h2>
              </div>
              <Link
                to="/?category=combo"
                className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
              >
                Xem tat ca <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {combos.map((food, index) => (
                <motion.div
                  key={food._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="flex-shrink-0 w-56"
                >
                  <FoodCard food={food} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Categories ──────────────────────────────────────── */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              <h2 className="text-xl font-bold text-charcoal-900 font-heading">Danh muc</h2>
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
              Tat ca
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
                  ? CATEGORIES.find((c) => c.value === selectedCategory)?.label || 'Mon an'
                  : 'Tat ca mon an'}
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
                <option value="createdAt-desc">Moi nhat</option>
                <option value="soldCount-desc">Ban chay</option>
                <option value="price-asc">Gia: Thap den Cao</option>
                <option value="price-desc">Gia: Cao den Thap</option>
                <option value="ratingAverage-desc">Danh gia cao</option>
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
                title="Khong tim thay mon an"
                description="Thu thay doi tu khoa tim kiem hoac danh muc loc"
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
                    Ban co mon an yeu thich?
                  </h3>
                  <p className="text-white/80">
                    Dat ngay hom nay, nhanh chong giao den cua ban trong 30 phut.
                  </p>
                </div>
                <Link
                  to="/cart"
                  className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-dark transition-colors shadow-lg"
                >
                  Dat ngay <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  )
}
