import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  Navigation,
  BellRing,
  ChevronUp,
  ArrowUp,
  Map,
  WifiOff,
  Route as RouteIcon,
  RefreshCw,
} from 'lucide-react'

// TODO: Replace with real Google Maps integration
// import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { fetchAllOrders, acceptOrder, completeOrder } from '../../slices/ordersSlice'
import { socket, initSocket } from '../../lib/socket'
import { ORDER_STATUS } from '../../constants'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function ShipperDashboardPage() {
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)
  const { user } = useSelector((state) => state.auth)

  const [activeTab, setActiveTab] = useState('pending')
  const [actionLoading, setActionLoading] = useState(null)
  const [newOrderBanner, setNewOrderBanner] = useState(null)
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [myLocation, setMyLocation] = useState(null)
  const [showReconnectBanner, setShowReconnectBanner] = useState(false)
  const mainRef = useRef(null)

  // Geolocation helper
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // handle error silently
      )
    }
  }, [])

  const isToday = (date) => {
    const d = new Date(date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }

  const todayDeliveries = orders.filter(
    (o) => o.status === 'delivered' && o.shipper?._id === user?._id && isToday(o.updatedAt)
  ).length

  // ── Socket handlers (named for proper cleanup) ──────────────
  const handleNewDelivery = useCallback((order) => {
    if (!isOnline) return
    toast.success(
      (t) => (
        <div className="flex items-center justify-between w-full min-w-[280px]">
          <div>
            <span className="font-semibold">Đơn mới!</span>
            <span className="ml-2 text-gray-600">#{order._id?.slice(-8).toUpperCase()}</span>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t.id)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="ml-4 px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
          >
            Xem ngay
          </button>
        </div>
      ),
      { duration: 8000 }
    )
    setNewOrderBanner(order)
    setTimeout(() => setNewOrderBanner(null), 8000)
    dispatch(fetchAllOrders({ limit: 100 }))
  }, [dispatch, isOnline])

  const handleOrderStatusUpdate = useCallback((updatedOrder) => {
    dispatch(fetchAllOrders({ limit: 100 }))
    if (updatedOrder.status === 'cancelled') {
      toast.error(`Đơn #${updatedOrder._id?.slice(-8).toUpperCase()} đã bị hủy bởi admin`)
    } else {
      toast.success(`Đơn #${updatedOrder._id?.slice(-8).toUpperCase()} đã cập nhật: ${updatedOrder.status}`)
    }
  }, [dispatch])

  const handleOrderAssigned = useCallback((order) => {
    if (!isOnline) return
    toast.success(`Đơn hàng #${order._id?.slice(-8).toUpperCase()} đã được giao cho bạn`)
    dispatch(fetchAllOrders({ limit: 100 }))
  }, [dispatch, isOnline])

  const handleSocketConnect = useCallback(() => {
    setIsConnected(true)
    setShowReconnectBanner(false)
  }, [])

  const handleSocketDisconnect = useCallback(() => {
    setIsConnected(false)
    setShowReconnectBanner(true)
  }, [])

  // ── Socket initialization ────────────────────────────────────
  useEffect(() => {
    initSocket()
    dispatch(fetchAllOrders({ limit: 100 }))
    socket.emit('joinShipperRoom')

    // Attach all named listeners
    socket.on('connect', handleSocketConnect)
    socket.on('disconnect', handleSocketDisconnect)
    socket.on('newDelivery', handleNewDelivery)
    socket.on('orderStatusUpdate', handleOrderStatusUpdate)
    socket.on('orderAssigned', handleOrderAssigned)

    // Attempt geolocation on mount
    getCurrentLocation()

    return () => {
      socket.emit('leaveShipperRoom')
      socket.off('connect', handleSocketConnect)
      socket.off('disconnect', handleSocketDisconnect)
      socket.off('newDelivery', handleNewDelivery)
      socket.off('orderStatusUpdate', handleOrderStatusUpdate)
      socket.off('orderAssigned', handleOrderAssigned)
    }
  }, [dispatch, handleNewDelivery, handleOrderStatusUpdate, handleOrderAssigned, handleSocketConnect, handleSocketDisconnect, getCurrentLocation])

  // ── Network / online status ─────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Bạn đã online trở lại')
      dispatch(fetchAllOrders({ limit: 100 }))
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Bạn đang offline. Đơn hàng sẽ được cập nhật khi có mạng.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [dispatch])

  const pendingOrders = orders.filter(
    (o) => o.status === ORDER_STATUS.PICKING && !o.shipper
  )
  const myActiveOrders = orders.filter(
    (o) => o.status === ORDER_STATUS.DELIVERING && o.shipper?._id === user?._id
  )
  const displayedOrders = activeTab === 'pending' ? pendingOrders : myActiveOrders

  // ── Accept all pending orders ────────────────────────────────
  const handleAcceptAll = async () => {
    if (pendingOrders.length === 0) return
    for (const order of pendingOrders) {
      try {
        await dispatch(acceptOrder(order._id)).unwrap()
      } catch {
        // individual failures toast in handleAccept
      }
    }
    toast.success(`Đã nhận ${pendingOrders.length} đơn hàng`)
    dispatch(fetchAllOrders({ limit: 100 }))
  }

  // ── Optimistic accept ───────────────────────────────────────
  const handleAccept = async (orderId) => {
    setActionLoading(orderId)
    try {
      await dispatch(acceptOrder(orderId)).unwrap()
      toast.success('Bạn đã nhận đơn hàng này')
      setActiveTab('active')
    } catch (error) {
      toast.error(error || 'Nhận đơn thất bại')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Optimistic complete ─────────────────────────────────────
  const handleComplete = async (orderId) => {
    setActionLoading(orderId)
    try {
      await dispatch(completeOrder(orderId)).unwrap()
      toast.success('Đã xác nhận giao hàng thành công')
    } catch (error) {
      toast.error(error || 'Xác nhận thất bại')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Shipper online/offline toggle ───────────────────────────
  const handleShipperStatusChange = (status) => {
    const online = status === 'online'
    setIsOnline(online)
    socket.emit('shipperStatusChange', { shipperId: user?._id, status: online ? 'online' : 'offline' })
    if (!online) {
      toast('Bạn đã chuyển sang chế độ offline. Không nhận đơn mới.')
    } else {
      toast.success('Bạn đã online trở lại')
    }
  }

  return (
    <div className="space-y-4 md:space-y-6" ref={mainRef}>
      {/* ── Reconnection banner ──────────────────────────── */}
      {showReconnectBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-3"
        >
          <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
          <span className="text-sm text-yellow-700">Đang kết nối lại...</span>
        </motion.div>
      )}

      {/* ── Offline banner ───────────────────────────────── */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3"
        >
          <WifiOff className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">
            Bạn đang offline. Đơn hàng sẽ được cập nhật khi có mạng.
          </span>
        </motion.div>
      )}

      {/* New Order Notification Banner */}
      <AnimatePresence>
        {newOrderBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-secondary to-orange-400 text-white rounded-xl p-4 shadow-lg flex items-center justify-between cursor-pointer"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
              setNewOrderBanner(null)
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-base">Ban co don moi!</p>
                <p className="text-sm text-white/80">
                  #{newOrderBanner._id?.slice(-8).toUpperCase()} - {formatCurrency(newOrderBanner.total)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Bam xem</span>
              <ChevronUp className="w-5 h-5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-charcoal-900">Shipper</h1>
        <p className="text-charcoal-500 text-sm mt-0.5">
          {user?.name} - Hom nay {todayDeliveries} don da giao
        </p>
      </div>

      {/* Stats - compact on mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-3 md:p-5 shadow-sm"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-charcoal-900">{pendingOrders.length}</p>
            <p className="text-xs text-charcoal-400 hidden md:block">Don cho nhan</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-3 md:p-5 shadow-sm"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <Truck className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-charcoal-900">{myActiveOrders.length}</p>
            <p className="text-xs text-charcoal-400 hidden md:block">Dang giao</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-3 md:p-5 shadow-sm"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <p className="text-xl md:text-2xl font-bold text-charcoal-900">{todayDeliveries}</p>
            <p className="text-xs text-charcoal-400 hidden md:block">Da giao hom nay</p>
          </div>
        </motion.div>
      </div>

      {/* Tabs - full width, mobile friendly */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
            activeTab === 'pending'
              ? 'bg-yellow-500 text-white shadow-sm'
              : 'bg-white text-charcoal-600 hover:bg-charcoal-50 shadow-sm'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Cho nhan</span>
          {pendingOrders.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-700'}`}>
              {pendingOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
            activeTab === 'active'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-white text-charcoal-600 hover:bg-charcoal-50 shadow-sm'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Dang giao</span>
          {myActiveOrders.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
              {myActiveOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
            activeTab === 'map'
              ? 'bg-green-500 text-white shadow-sm'
              : 'bg-white text-charcoal-600 hover:bg-charcoal-50 shadow-sm'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Ban do</span>
        </button>

        {/* Accept All button */}
        {activeTab === 'pending' && pendingOrders.length > 1 && (
          <button
            onClick={handleAcceptAll}
            className="ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors min-h-[44px]"
          >
            Nhan tat ca ({pendingOrders.length})
          </button>
        )}
      </div>

      {/* ── Map tab ───────────────────────────────────────── */}
      {activeTab === 'map' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl overflow-hidden shadow-sm"
        >
          {/* Map header */}
          <div className="bg-white/90 backdrop-blur-sm px-4 py-3 border-b border-charcoal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-charcoal-900 text-sm md:text-base">Ban do giao hang</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {myLocation && (
                <div className="hidden sm:flex items-center gap-1 text-blue-600">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                  Vi tri cua ban
                </div>
              )}
              <button
                onClick={getCurrentLocation}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Cap nhat vi tri
              </button>
            </div>
          </div>

          {/* TODO: Replace with real Google Maps integration */}
          {/* Real integration: use @react-google-maps/api with Google Maps API key */}
          {/* <GoogleMap center={myLocation || defaultCenter} zoom={14} mapContainerStyle={{ height: '100%' }} /> */}

          {/* Static map placeholder */}
          <div className="relative h-[400px] md:h-[500px] bg-gradient-to-br from-green-50 to-blue-50">
            {/* Simulated map grid */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Simulated roads */}
            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#64748b" strokeWidth="8"/>
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#64748b" strokeWidth="8"/>
              <line x1="20%" y1="0" x2="20%" y2="100%" stroke="#94a3b8" strokeWidth="4"/>
              <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#94a3b8" strokeWidth="4"/>
            </svg>

            {/* My location pin */}
            {myLocation && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative z-10" />
                </div>
              </div>
            )}

            {/* Delivery pins for active orders */}
            {myActiveOrders.map((order, idx) => (
              <div
                key={order._id}
                className="absolute z-20 cursor-pointer"
                style={{
                  top: `${20 + idx * 18}%`,
                  left: `${30 + idx * 12}%`,
                }}
                onClick={() => {
                  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(order.shippingAddress?.address || '')}`
                  window.open(mapsUrl, '_blank')
                }}
              >
                <div className="relative group">
                  <div className="w-10 h-10 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    #{order._id?.slice(-8).toUpperCase()}
                  </div>
                </div>
              </div>
            ))}

            {/* Map overlay text */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
              <p className="text-sm text-charcoal-500">
                Ban do dang duoc tai... (Can Google Maps API key de hien thi day du)
              </p>
              {myActiveOrders.length > 0 && (
                <p className="text-xs text-charcoal-400 mt-1">
                  {myActiveOrders.length} diem giao hang gan nhau
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Orders list */}
      {activeTab !== 'map' && (
        <>
          {/* Route indicator when multiple active orders */}
          {activeTab === 'active' && myActiveOrders.length >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3"
            >
              <RouteIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-700">
                {myActiveOrders.length} don giao gan nhau -{' '}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&waypoints=${myActiveOrders
                    .map((o) => encodeURIComponent(o.shippingAddress?.address || ''))
                    .join('|')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium hover:text-blue-800"
                >
                  Xem tuyen duong
                </a>
              </span>
            </motion.div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-10 md:p-12 text-center">
              <Package className="w-14 h-14 text-charcoal-200 mx-auto mb-4" />
              <p className="text-charcoal-500">
                {activeTab === 'pending'
                  ? 'Khong co don hang cho nhan'
                  : 'Khong co don hang dang giao'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedOrders.map((order, index) => {
            const statusBarColor = activeTab === 'pending'
              ? 'bg-yellow-400'
              : 'bg-blue-500'
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden flex"
              >
                {/* Status color bar */}
                <div className={`w-1.5 ${statusBarColor} flex-shrink-0`} />

                <Link to={`/shipper/order/${order._id}`} className="flex-1 p-4">
                  {/* Top row: order code + time */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-charcoal-900">
                        #{order._id?.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-charcoal-400">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Customer info */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-medium text-charcoal-800 text-sm">
                        {order.shippingAddress?.name}
                      </span>
                      <span className="text-charcoal-400 text-sm">
                        {order.shippingAddress?.phone}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-charcoal-400 mt-0.5 flex-shrink-0" />
                      <span className="text-charcoal-600 text-xs">{order.shippingAddress?.address}</span>
                    </div>
                    {order.note && (
                      <p className="text-xs text-charcoal-400 italic mt-1 pl-6">
                        Ghi chu: {order.note}
                      </p>
                    )}
                  </div>

                  {/* Items summary */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <img
                          key={i}
                          src={item.food?.image || 'https://via.placeholder.com/40'}
                          alt={item.food?.name}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                        />
                      ))}
                      {order.items?.length > 3 && (
                        <span className="text-xs text-charcoal-400 flex-shrink-0">
                          +{order.items.length - 3}
                        </span>
                      )}
                    </div>
                    <span className="ml-auto font-bold text-primary text-base flex-shrink-0">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </Link>

                {/* Action button area */}
                <div className="p-4 flex flex-col justify-center border-l border-charcoal-100">
                  {activeTab === 'pending' ? (
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => handleAccept(order._id)}
                      loading={actionLoading === order._id}
                      icon={Truck}
                      className="min-h-[56px] w-full md:w-auto md:px-4"
                    >
                      <span className="hidden md:inline">Nhan giao hang</span>
                      <span className="md:hidden text-sm">Nhan</span>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="primary"
                      onClick={() => handleComplete(order._id)}
                      loading={actionLoading === order._id}
                      icon={CheckCircle}
                      className="min-h-[56px] w-full md:w-auto md:px-4"
                    >
                      <span className="hidden md:inline">Da giao hang</span>
                      <span className="md:hidden text-sm">Xong</span>
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
          )}
        </>
      )}
    </div>
  )
}
