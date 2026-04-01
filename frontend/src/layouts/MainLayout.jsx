import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  Bell,
  LogOut,
  ChefHat,
  Truck,
  LayoutDashboard,
  Search,
} from 'lucide-react'
import { logout } from '../slices/authSlice'
import { selectCartCount } from '../slices/cartSlice'
import { selectUnreadCount } from '../slices/notificationsSlice'

export default function MainLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const cartCount = useSelector(selectCartCount)
  const unreadCount = useSelector(selectUnreadCount)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    dispatch(logout())
    setUserMenuOpen(false)
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const navLinks = [
    { to: '/', label: 'Trang chu' },
    { to: '/cart', label: 'Gio hang' },
  ]

  const adminLink = isAuthenticated && user?.role === 'admin'
    ? { to: '/admin', label: 'Quan ly', icon: LayoutDashboard }
    : null

  const shipperLink = isAuthenticated && user?.role === 'shipper'
    ? { to: '/shipper', label: 'Shipper', icon: Truck }
    : null

  const allNavLinks = [...navLinks]
  if (adminLink) allNavLinks.push(adminLink)
  if (shipperLink) allNavLinks.push(shipperLink)

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-card sticky top-0 z-50 border-b border-charcoal-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <ChefHat className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-primary font-heading">Res-booking</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {allNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === link.to
                      ? 'bg-primary/10 text-primary'
                      : 'text-charcoal-600 hover:bg-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4 inline mr-1" />}
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <form onSubmit={handleSearch} className="hidden lg:block relative">
                <input
                  type="text"
                  placeholder="Tim kiem mon an..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-charcoal-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-56 bg-charcoal-50/50"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              </form>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-charcoal-600 hover:text-primary transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-secondary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Wishlist */}
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  className="p-2 text-charcoal-600 hover:text-primary transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </Link>
              )}

              {/* Notifications */}
              {isAuthenticated && (
                <Link
                  to="/notifications"
                  className="relative p-2 text-charcoal-600 hover:text-primary transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative ml-2">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 hover:bg-charcoal-100 rounded-full px-2 py-1 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-charcoal-700">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 text-charcoal-400" />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-charcoal-100 py-1 z-50"
                      >
                        <div className="px-4 py-2 border-b border-charcoal-100">
                          <p className="text-sm font-medium text-charcoal-900">{user?.name}</p>
                          <p className="text-xs text-charcoal-500">{user?.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          Tai khoan
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Bell className="w-4 h-4" />
                          Don hang cua toi
                        </Link>
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Quan ly
                          </Link>
                        )}
                        {user?.role === 'shipper' && (
                          <Link
                            to="/shipper"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Truck className="w-4 h-4" />
                            Shipper
                          </Link>
                        )}
                        <div className="border-t border-charcoal-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Dang xuat
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-charcoal-700 hover:text-primary transition-colors"
                  >
                    Dang nhap
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors shadow-sm hover:shadow"
                  >
                    Dang ky
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-charcoal-600"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-charcoal-100 overflow-hidden bg-white"
            >
              <div className="px-4 py-4 space-y-1">
                <form onSubmit={handleSearch} className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Tim kiem mon an..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                </form>
                {allNavLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block py-2.5 px-3 text-sm font-medium text-charcoal-700 hover:bg-charcoal-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.icon && <link.icon className="w-4 h-4 inline mr-2" />}
                    {link.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <div className="flex gap-2 pt-2">
                    <Link
                      to="/login"
                      className="flex-1 py-2.5 text-sm font-medium text-center text-charcoal-700 border border-charcoal-200 rounded-xl"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dang nhap
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 py-2.5 text-sm font-medium text-center bg-primary text-white rounded-xl"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dang ky
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-charcoal-900 text-charcoal-300 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold text-white font-heading">Res-booking</span>
              </div>
              <p className="text-sm text-charcoal-400 leading-relaxed">
                He thong dat mon va quan ly nha hang hien dai, nhanh chong va tien loi.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 font-heading">Lien he</h3>
              <p className="text-sm text-charcoal-400">Email: contact@resbooking.com</p>
              <p className="text-sm text-charcoal-400">Dien thoai: 0123-456-789</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 font-heading">Huong dan</h3>
              <p className="text-sm text-charcoal-400">Ve chung toi</p>
              <p className="text-sm text-charcoal-400">Chinh sach bao mat</p>
              <p className="text-sm text-charcoal-400">Dieu khoan su dung</p>
            </div>
          </div>
          <div className="border-t border-charcoal-800 mt-8 pt-8 text-center text-sm text-charcoal-500">
            &copy; 2026 Res-booking. Tat ca quyen duoc bao luu.
          </div>
        </div>
      </footer>
    </div>
  )
}
