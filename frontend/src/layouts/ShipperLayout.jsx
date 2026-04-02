import { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard,
  History,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Truck,
  Bell,
} from 'lucide-react'
import { logout } from '../slices/authSlice'
import { selectUnreadCount } from '../slices/notificationsSlice'

const sidebarLinks = [
  { to: '/shipper', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/shipper/history', label: 'Lịch sử giao hàng', icon: History },
]

export default function ShipperLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const unreadCount = useSelector(selectUnreadCount)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-cream">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-primary text-white flex-shrink-0 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-primary-dark">
          <Link to="/shipper" className="flex items-center gap-2">
            <Truck className="w-8 h-8 flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-lg font-bold whitespace-nowrap font-heading">Shipper</span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-primary-dark transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
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
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
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
        <div className="p-3 border-t border-primary-dark">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm whitespace-nowrap">Về trang chủ</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md shadow-card border-b border-charcoal-100 flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-charcoal-900 font-heading">
              {sidebarLinks.find((l) =>
                l.exact ? location.pathname === l.to : location.pathname.startsWith(l.to)
              )?.label || 'Shipper Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative p-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors">
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
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <span className="text-sm font-medium text-charcoal-700 hidden sm:block">
                  {user?.name}
                </span>
                <ChevronDown className="w-4 h-4 text-charcoal-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-charcoal-100 py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
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
