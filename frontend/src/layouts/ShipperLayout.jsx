import { useState, useEffect } from 'react'
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
  ClipboardList,
  Wallet,
} from 'lucide-react'
import { logout } from '../slices/authSlice'
import { selectUnreadCount } from '../slices/notificationsSlice'
import { socket } from '../lib/socket'
import toast from 'react-hot-toast'

const sidebarLinks = [
  { to: '/shipper', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/shipper/history', label: 'Lịch sử giao hàng', icon: History },
  { to: '/shipper/earnings', label: 'Thu nhập', icon: Wallet },
]

const bottomTabs = [
  { to: '/shipper', label: 'Queue', icon: ClipboardList, exact: true },
  { to: '/shipper/history', label: 'Lịch sử', icon: History, exact: true },
  { to: '/shipper/earnings', label: 'Thu nhập', icon: Wallet, exact: true },
]

export default function ShipperLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const unreadCount = useSelector(selectUnreadCount)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [shipperOnline, setShipperOnline] = useState(true)

  // Track browser online/offline
  useEffect(() => {
    const handleOnline = () => setShipperOnline(true)
    const handleOffline = () => setShipperOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleShipperStatusChange = (status) => {
    const online = status === 'online'
    setShipperOnline(online)
    socket.emit('shipperStatusChange', { shipperId: user?._id, status: online ? 'online' : 'offline' })
    if (!online) {
      toast('Ban da chuyen sang che do offline. Khong nhan don moi.')
    } else {
      toast.success('Ban da online tro lai')
    }
  }

  const handleLogout = () => {
    socket.emit('shipperStatusChange', { shipperId: user?._id, status: 'offline' })
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-cream">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-primary text-white flex-shrink-0 transition-all duration-300 flex flex-col hidden md:flex`}
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
            to="/shipper"
            className="flex items-center gap-3 px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm whitespace-nowrap">Về trang chủ</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="bg-white/90 backdrop-blur-md shadow-card border-b border-charcoal-100 flex items-center justify-between px-4 h-14 md:hidden">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-primary" />
            <h1 className="text-base font-semibold text-charcoal-900 font-heading">
              {sidebarLinks.find((l) =>
                l.exact ? location.pathname === l.to : location.pathname.startsWith(l.to)
              )?.label || 'Shipper'}
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

            <div className="relative ml-1">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 hover:bg-charcoal-100 rounded-full p-1 transition-colors"
              >
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
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

        {/* Desktop Header */}
        <header className="bg-white/90 backdrop-blur-md shadow-card border-b border-charcoal-100 flex items-center justify-between px-6 h-16 hidden md:flex">
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

            {/* Shipper online/offline toggle */}
            <div className="flex items-center gap-1.5 bg-charcoal-50 rounded-lg px-2 py-1 ml-1">
              <div className={`w-2.5 h-2.5 rounded-full ${shipperOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              <select
                value={shipperOnline ? 'online' : 'offline'}
                onChange={(e) => handleShipperStatusChange(e.target.value)}
                className="text-xs bg-transparent text-charcoal-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div className="relative ml-1">
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-cream pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-charcoal-200 flex z-50 md:hidden safe-area-bottom">
          {bottomTabs.map((tab) => {
            const isActive = tab.exact
              ? location.pathname === tab.to
              : location.pathname.startsWith(tab.to)
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-charcoal-400'
                }`}
              >
                <tab.icon className="w-6 h-6 mb-1" />
                <span className="font-medium">{tab.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
