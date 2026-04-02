import { useEffect, useState, useRef, useMemo } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  Ticket,
  MapPin,
  Menu,
  X,
  LogOut,
  Bell,
  ChevronDown,
  ChevronRight,
  ChefHat,
  User,
  Plus,
  ShoppingCart,
  Tag,
  Search,
  FileText,
} from 'lucide-react'
import { logout } from '../slices/authSlice'
import { selectUnreadCount } from '../slices/notificationsSlice'
import axiosClient from '../api/axiosClient'
import toast from 'react-hot-toast'

const sidebarLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/foods', label: 'Món ăn', icon: UtensilsCrossed },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/promos', label: 'Mã giảm giá', icon: Ticket },
  { to: '/admin/branches', label: 'Chi nhánh', icon: MapPin },
  { to: '/admin/audit-logs', label: 'Nhật ký hệ thống', icon: FileText },
  { to: '/admin/categories', label: 'Danh mục', icon: Tag },
]

function buildBreadcrumbs(pathname) {
  const crumbs = [{ label: 'Admin', to: '/admin' }]
  if (pathname === '/admin') return crumbs

  const segments = pathname.replace('/admin', '').split('/').filter(Boolean)

  if (segments[0] === 'orders' && segments[1]) {
    crumbs.push({ label: 'Đơn hàng', to: '/admin/orders' })
    crumbs.push({ label: `Chi tiết #${segments[1].slice(-8).toUpperCase()}`, to: null })
  } else if (segments[0] === 'foods') {
    crumbs.push({ label: 'Món ăn', to: '/admin/foods' })
    if (segments[1]) {
      crumbs.push({ label: 'Chi tiết', to: null })
    }
  } else {
    const link = sidebarLinks.find(l =>
      l.to !== '/admin' && pathname.startsWith(l.to)
    )
    if (link) {
      crumbs.push({ label: link.label, to: link.to })
    }
    if (segments.length > 1) {
      crumbs.push({ label: segments[1], to: null })
    }
  }
  return crumbs
}

export default function AdminLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const unreadCount = useSelector(selectUnreadCount)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Global search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ orders: [], foods: [], users: [] })
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced global search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ orders: [], foods: [], users: [] })
      setShowSearchDropdown(false)
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const q = searchQuery.trim()
        const [ordersRes, foodsRes, usersRes] = await Promise.allSettled([
          axiosClient.get(`/admin/orders?search=${encodeURIComponent(q)}&limit=3`),
          axiosClient.get(`/foods?search=${encodeURIComponent(q)}&limit=3`),
          axiosClient.get(`/admin/users?search=${encodeURIComponent(q)}&limit=3`),
        ])

        setSearchResults({
          orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data.data?.orders || ordersRes.value.data.data || []) : [],
          foods: foodsRes.status === 'fulfilled' ? (foodsRes.value.data.data?.foods || foodsRes.value.data.data || []) : [],
          users: usersRes.status === 'fulfilled' ? (usersRes.value.data?.users || usersRes.value.data || []) : [],
        })

        const hasResults =
          (ordersRes.status === 'fulfilled' && (ordersRes.value.data.data?.orders?.length || ordersRes.value.data.data?.length || 0) > 0) ||
          (foodsRes.status === 'fulfilled' && (foodsRes.value.data.data?.foods?.length || foodsRes.value.data.data?.length || 0) > 0) ||
          (usersRes.status === 'fulfilled' && (usersRes.value.data?.users?.length || usersRes.value.data?.length || 0) > 0)

        setShowSearchDropdown(hasResults)
      } catch {
        setSearchResults({ orders: [], foods: [], users: [] })
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery])

  const handleSearchResultClick = (type, item) => {
    setShowSearchDropdown(false)
    setSearchQuery('')
    switch (type) {
      case 'order':
        navigate(`/admin/orders/${item._id}`)
        break
      case 'food':
        navigate(`/admin/foods`)
        break
      case 'user':
        navigate(`/admin/users`)
        break
      default:
        break
    }
  }

  const currentPageLabel = sidebarLinks.find(l =>
    l.exact ? location.pathname === l.to : location.pathname.startsWith(l.to)
  )?.label || 'Admin'

  return (
    <div className="flex h-screen bg-cream">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-charcoal-900 text-white flex-shrink-0 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-charcoal-800">
          <Link to="/admin" className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-primary flex-shrink-0" />
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold whitespace-nowrap font-heading"
              >
                Res-booking
              </motion.span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-charcoal-800 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = link.exact
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-charcoal-300 hover:bg-charcoal-800 hover:text-white'
                }`}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium whitespace-nowrap">{link.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-charcoal-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-charcoal-300 hover:bg-charcoal-800 hover:text-white rounded-lg transition-colors"
          >
            <ChefHat className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm whitespace-nowrap">Về trang chủ</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white/90 backdrop-blur-md shadow-card border-b border-charcoal-100 px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-charcoal-900 font-heading hidden sm:block">
              {currentPageLabel}
            </h1>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 1 && (
              <nav className="hidden lg:flex items-center gap-1 text-sm text-gray-500">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
                    {crumb.to ? (
                      <Link
                        to={crumb.to}
                        className="hover:text-primary transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-700 font-medium">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Global Search */}
            <div ref={searchRef} className="relative hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery && (searchResults.orders.length || searchResults.foods.length || searchResults.users.length)) {
                      setShowSearchDropdown(true)
                    }
                  }}
                  className="w-64 pl-10 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 focus:bg-white transition-all"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-1 left-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-y-auto"
                >
                  {searchResults.orders.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">
                        Đơn hàng
                      </div>
                      {searchResults.orders.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => handleSearchResultClick('order', item)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-gray-900">
                            #{item._id?.slice(-8).toUpperCase()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {item.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.foods.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">
                        Món ăn
                      </div>
                      {searchResults.foods.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => handleSearchResultClick('food', item)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          <span className="text-xs text-gray-400 ml-2">{item.category || item.categoryName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.users.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b">
                        Người dùng
                      </div>
                      {searchResults.users.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => handleSearchResultClick('user', item)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-medium">
                            {item.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/admin/orders"
                className="relative p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
                title="+ Tạo đơn"
              >
                <ShoppingCart className="w-5 h-5" />
              </Link>
              <Link
                to="/admin/foods"
                className="relative p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
                title="+ Thêm món"
              >
                <Plus className="w-5 h-5" />
              </Link>
              <Link
                to="/admin/promos"
                className="relative p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
                title="+ Tạo khuyến mãi"
              >
                <Tag className="w-5 h-5" />
              </Link>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1 hidden lg:block" />

            <Link
              to="/notifications"
              className="relative p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:bg-charcoal-100 rounded-lg px-3 py-1.5 transition-colors"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="text-sm font-medium text-charcoal-700 hidden sm:block">
                  {user?.name}
                </span>
                <ChevronDown className="w-4 h-4 text-charcoal-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-charcoal-100 py-1 z-50">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Tài khoản
                  </Link>
                  <div className="border-t border-charcoal-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-cream">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
