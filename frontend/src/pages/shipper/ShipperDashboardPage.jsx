import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  Truck,
  Package,
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  Navigation,
} from 'lucide-react'
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

  const isToday = (date) => {
    const d = new Date(date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }

  const todayDeliveries = orders.filter(
    (o) => o.status === 'delivered' && o.shipper?._id === user?._id && isToday(o.updatedAt)
  ).length

  useEffect(() => {
    initSocket()
    dispatch(fetchAllOrders({ limit: 100 }))
    socket.emit('joinShipperRoom')

    const handleNewDelivery = (order) => {
      toast.success(`Bạn có đơn giao hàng mới: #${order._id?.slice(-8).toUpperCase()}`)
      dispatch(fetchAllOrders({ limit: 100 }))
    }

    const handleOrderStatusUpdate = (updatedOrder) => {
      dispatch(fetchAllOrders({ limit: 100 }))
    }

    const handleOrderAssigned = (order) => {
      toast.success(`Đơn hàng #${order._id?.slice(-8).toUpperCase()} đã được giao cho bạn`)
      dispatch(fetchAllOrders({ limit: 100 }))
    }

    socket.on('newDelivery', handleNewDelivery)
    socket.on('orderStatusUpdate', handleOrderStatusUpdate)
    socket.on('orderAssigned', handleOrderAssigned)

    return () => {
      socket.emit('leaveShipperRoom')
      socket.off('newDelivery', handleNewDelivery)
      socket.off('orderStatusUpdate', handleOrderStatusUpdate)
      socket.off('orderAssigned', handleOrderAssigned)
    }
  }, [dispatch])

  const pendingOrders = orders.filter(
    (o) => o.status === ORDER_STATUS.PICKING && !o.shipper
  )
  const myActiveOrders = orders.filter(
    (o) => o.status === ORDER_STATUS.DELIVERING && o.shipper?._id === user?._id
  )
  const displayedOrders = activeTab === 'pending' ? pendingOrders : myActiveOrders

  const handleAccept = async (orderId) => {
    setActionLoading(orderId)
    try {
      await dispatch(acceptOrder(orderId)).unwrap()
      toast.success('Bạn đã nhận đơn hàng này')
      dispatch(fetchAllOrders({ limit: 100 }))
    } catch (error) {
      toast.error(error || 'Nhận đơn thất bại')
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = async (orderId) => {
    setActionLoading(orderId)
    try {
      await dispatch(completeOrder(orderId)).unwrap()
      toast.success('Đã xác nhận giao hàng thành công')
      dispatch(fetchAllOrders({ limit: 100 }))
    } catch (error) {
      toast.error(error || 'Xác nhận thất bại')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shipper Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Xin chào, {user?.name} - Hôm nay bạn có {pendingOrders.length} đơn chờ nhận
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
              <p className="text-sm text-gray-500">Đơn chờ nhận</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myActiveOrders.length}</p>
              <p className="text-sm text-gray-500">Đang giao</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{todayDeliveries}</p>
              <p className="text-sm text-gray-500">Đã giao hôm nay</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-1" />
          Đơn chờ nhận ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Truck className="w-4 h-4 inline mr-1" />
          Đang giao ({myActiveOrders.length})
        </button>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">
            {activeTab === 'pending'
              ? 'Không có đơn hàng nào chờ nhận'
              : 'Không có đơn hàng đang giao'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order, index) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-gray-400">Mã đơn</span>
                  <p className="font-bold text-gray-900">
                    #{order._id?.slice(-8).toUpperCase()}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* Customer info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{order.shippingAddress?.name}</span>
                  <span className="text-gray-500">{order.shippingAddress?.phone}</span>
                  <a
                    href={`tel:${order.shippingAddress?.phone}`}
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Gọi
                  </a>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-600 flex-1">{order.shippingAddress?.address}</span>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(order.shippingAddress?.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    Chỉ đường
                  </a>
                </div>
                {order.note && (
                  <div className="flex items-start gap-2 text-sm text-gray-500 italic">
                    <Navigation className="w-4 h-4 mt-0.5" />
                    <span>Ghi chú: {order.note}</span>
                  </div>
                )}
              </div>

              {/* Items summary */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto">
                {order.items?.slice(0, 3).map((item, i) => (
                  <img
                    key={i}
                    src={item.food?.image || 'https://via.placeholder.com/40'}
                    alt={item.food?.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ))}
                {order.items?.length > 3 && (
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    +{order.items.length - 3} món
                  </span>
                )}
                <span className="ml-auto font-bold text-primary text-lg flex-shrink-0">
                  {formatCurrency(order.total)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-xs text-gray-400">
                  Đặt lúc {formatDateTime(order.createdAt)}
                </span>
                {activeTab === 'pending' ? (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => handleAccept(order._id)}
                    loading={actionLoading === order._id}
                    icon={Truck}
                  >
                    Nhận giao hàng
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => handleComplete(order._id)}
                    loading={actionLoading === order._id}
                    icon={CheckCircle}
                  >
                    Đã giao hàng
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
