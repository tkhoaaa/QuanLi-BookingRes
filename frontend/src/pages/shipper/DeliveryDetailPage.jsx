import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Navigation,
  ShoppingBag,
  CreditCard,
  Clock,
  Truck,
  CheckCircle,
  Map,
} from 'lucide-react'
import { fetchAllOrders, acceptOrder, completeOrder } from '../../slices/ordersSlice'
import { socket } from '../../lib/socket'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDateTime, cn } from '../../lib/utils'
import axiosClient from '../../api/axiosClient'
import toast from 'react-hot-toast'

export default function DeliveryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)
  const { user } = useSelector((state) => state.auth)

  const [actionLoading, setActionLoading] = useState(false)
  const [myLocation, setMyLocation] = useState(null)
  const [locationUpdated, setLocationUpdated] = useState(false)

  // GPS location helper — gets position and sends to backend API
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Trinh duyet khong ho tro dinh vi')
      return
    }
    setLocationUpdated(false)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMyLocation(coords)
        // Send location to backend
        try {
          await axiosClient.post(`/delivery/${id}/location`, coords)
          setLocationUpdated(true)
          toast.success('Da cap nhat vi tri')
          setTimeout(() => setLocationUpdated(false), 3000)
        } catch (err) {
          toast.error('Khong the gui vi tri len server')
          console.error(err)
        }
      },
      () => toast.error('Khong the lay vi tri hien tai')
    )
  }

  useEffect(() => {
    if (orders.length === 0) {
      dispatch(fetchAllOrders({ limit: 100 }))
    }
    // Socket listener for real-time updates
    const handleOrderUpdate = (updatedOrder) => {
      if (updatedOrder._id === id) {
        dispatch(fetchAllOrders({ limit: 100 }))
        if (updatedOrder.status === 'cancelled') {
          toast.error('Don hang da bi huy boi admin')
        }
      }
    }
    socket.on('orderStatusUpdate', handleOrderUpdate)
    socket.on('orderAssigned', handleOrderUpdate)
    return () => {
      socket.off('orderStatusUpdate', handleOrderUpdate)
      socket.off('orderAssigned', handleOrderUpdate)
    }
  }, [dispatch, orders.length, id])

  const order = orders.find((o) => o._id === id)

  const handleAccept = async () => {
    setActionLoading(true)
    try {
      await dispatch(acceptOrder(id)).unwrap()
      toast.success('Ban da nhan don hang nay')
    } catch (error) {
      toast.error(error || 'Nhan don that bai')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    setActionLoading(true)
    try {
      await dispatch(completeOrder(id)).unwrap()
      toast.success('Da xac nhan giao hang thanh cong')
      navigate('/shipper')
    } catch (error) {
      toast.error(error || 'Xac nhan that bai')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && !order) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShoppingBag className="w-16 h-16 text-charcoal-200 mb-4" />
        <p className="text-charcoal-500">Khong tim thay don hang</p>
        <Link to="/shipper" className="mt-4 text-primary font-medium">
          Quay lai dashboard
        </Link>
      </div>
    )
  }

  const isPending = order.status === 'picking' && !order.shipper
  const isActive = order.status === 'delivering' && order.shipper?._id === user?._id

  return (
    <div className="pb-28">
      {/* Back header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-charcoal-500 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-charcoal-900">
            Don #{order._id?.slice(-8).toUpperCase()}
          </h1>
          <p className="text-xs text-charcoal-400">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        <StatusBadge status={order.status} />
      </div>

      {/* Map section - GPS readiness */}
      {/* TODO: Replace with real Google Maps embed iframe */}
      {/* <iframe width="100%" height="250" style={{border:0}} loading="lazy"
        allowFullScreen referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(order.shippingAddress?.address)}`} /> */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl overflow-hidden shadow-sm mb-3"
      >
        {/* Map header */}
        <div className="bg-white/90 backdrop-blur-sm px-4 py-3 border-b border-charcoal-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-charcoal-900">Ban do giao hang</h2>
          </div>
          <div className="flex items-center gap-2">
            {myLocation && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Vi tri cua ban
              </div>
            )}
            <button
              onClick={getCurrentLocation}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors',
                locationUpdated
                  ? 'bg-green-500 text-white'
                  : 'bg-primary text-white hover:bg-primary-dark'
              )}
            >
              <Navigation className="w-3 h-3" />
              <span className="hidden sm:inline">
                {locationUpdated ? 'Da cap nhat' : 'Cap nhat vi tri'}
              </span>
            </button>
          </div>
        </div>

        {/* Static map placeholder */}
        <div className="relative h-[200px] md:h-[250px] bg-gradient-to-br from-green-50 to-blue-50">
          {/* Simulated map grid */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="detailGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#detailGrid)" />
            </svg>
          </div>

          {/* Simulated roads */}
          <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#64748b" strokeWidth="8"/>
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#64748b" strokeWidth="8"/>
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

          {/* Destination marker */}
          <div className="absolute top-[35%] left-[55%] z-10">
            <div className="relative flex flex-col items-center">
              <div className="w-10 h-10 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500 mt-[-1px]" />
            </div>
          </div>

          {/* Address overlay */}
          <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-charcoal-600 font-medium truncate">
              {order.shippingAddress?.address}
            </p>
          </div>
        </div>

        {/* Chi duong button - opens Google Maps with geolocation */}
        <div className="p-3">
          <a
            href={myLocation
              ? `https://www.google.com/maps/dir/?api=1&origin=${myLocation.lat},${myLocation.lng}&destination=${encodeURIComponent(order.shippingAddress?.address)}`
              : `https://www.google.com/maps?q=${encodeURIComponent(order.shippingAddress?.address)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors"
          >
            <Navigation className="w-5 h-5" />
            Chi duong
            {myLocation ? ' (tu vi tri cua ban)' : ' (mo Google Maps)'}
          </a>
        </div>
      </motion.div>

      {/* Delivery address */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-sm mb-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-charcoal-900 mb-1">
              {order.shippingAddress?.name}
            </p>
            <p className="text-sm text-charcoal-600 mb-1">
              {order.shippingAddress?.phone}
            </p>
            <p className="text-sm text-charcoal-500">
              {order.shippingAddress?.address}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <a
            href={`tel:${order.shippingAddress?.phone}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl font-medium text-sm hover:bg-green-600 transition-colors min-h-[52px]"
          >
            <Phone className="w-5 h-5" />
            Goi
          </a>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(order.shippingAddress?.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors min-h-[52px]"
          >
            <Navigation className="w-5 h-5" />
            Chi duong
          </a>
        </div>

        {order.note && (
          <div className="mt-3 pt-3 border-t border-charcoal-100">
            <p className="text-sm text-charcoal-500 italic">
              Ghi chu: {order.note}
            </p>
          </div>
        )}
      </motion.div>

      {/* Order items */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-xl p-4 shadow-sm mb-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="w-5 h-5 text-charcoal-400" />
          <h2 className="font-semibold text-charcoal-900">
            {order.items?.length || 0} mon
          </h2>
        </div>

        <div className="space-y-3">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <img
                src={item.food?.image || 'https://via.placeholder.com/48'}
                alt={item.food?.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal-900 text-sm truncate">
                  {item.food?.name || item.name}
                </p>
                <p className="text-xs text-charcoal-400">
                  x{item.quantity}
                </p>
              </div>
              <p className="font-medium text-charcoal-900 text-sm flex-shrink-0">
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-charcoal-100 flex justify-between">
          <span className="font-semibold text-charcoal-900">Tong</span>
          <span className="font-bold text-primary text-lg">
            {formatCurrency(order.total)}
          </span>
        </div>
      </motion.div>

      {/* Payment info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-4 shadow-sm mb-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-charcoal-400" />
          <h2 className="font-semibold text-charcoal-900">Thanh toan</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-charcoal-700">
              {order.paymentMethod === 'COD' ? 'Tien mat (COD)' : 'Thanh toan online'}
            </p>
            <p className="text-xs text-charcoal-400">
              {order.paymentMethod === 'COD' ? 'Tien mat khi giao' : 'Da thanh toan'}
            </p>
          </div>
          <p className="font-bold text-charcoal-900 text-lg">
            {formatCurrency(order.total)}
          </p>
        </div>
      </motion.div>

      {/* Order timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-xl p-4 shadow-sm mb-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-charcoal-400" />
          <h2 className="font-semibold text-charcoal-900">Thong tin don</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-charcoal-500">Dat luc</span>
            <span className="text-charcoal-700">{formatDateTime(order.createdAt)}</span>
          </div>
          {order.acceptedAt && (
            <div className="flex justify-between">
              <span className="text-charcoal-500">Nhan don</span>
              <span className="text-charcoal-700">{formatDateTime(order.acceptedAt)}</span>
            </div>
          )}
          {order.completedAt && (
            <div className="flex justify-between">
              <span className="text-charcoal-500">Hoan thanh</span>
              <span className="text-charcoal-700">{formatDateTime(order.completedAt)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-charcoal-500">Phuong thuc</span>
            <span className="text-charcoal-700">
              {order.fulfillmentType === 'pickup' ? 'Tai quay' : 'Giao hang'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Sticky action buttons */}
      <div className="fixed bottom-20 md:bottom-4 left-0 right-0 px-4 z-40">
        <div className="bg-white rounded-2xl shadow-lg border border-charcoal-100 p-3 max-w-lg mx-auto">
          {isPending && (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleAccept}
              loading={actionLoading}
              icon={Truck}
              className="w-full min-h-[56px] text-base font-bold"
            >
              Nhan giao hang
            </Button>
          )}
          {isActive && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleComplete}
              loading={actionLoading}
              icon={CheckCircle}
              className="w-full min-h-[56px] text-base font-bold"
            >
              Da giao hang
            </Button>
          )}
          {!isPending && !isActive && (
            <p className="text-center text-sm text-charcoal-500 py-2">
              Don hang nay da duoc xu ly
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
