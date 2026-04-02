import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Truck,
  Package,
  Clock,
  User,
  CreditCard,
} from 'lucide-react'
import { fetchOrderDetail, updateOrderStatus } from '../../slices/ordersSlice'
import { ORDER_STATUS_COLORS, ORDER_STATUS_TRANSITIONS } from '../../constants'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentOrder: order, loading } = useSelector((state) => state.orders)

  useEffect(() => {
    dispatch(fetchOrderDetail(id))
  }, [id, dispatch])

  const handleStatusUpdate = async (status) => {
    try {
      await dispatch(updateOrderStatus({ id: order._id, status })).unwrap()
      toast.success('Cập nhật trạng thái thành công')
    } catch (err) {
      toast.error(err || 'Cập nhật thất bại')
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
      <div className="text-center py-20 text-gray-500">
        Không tìm thấy đơn hàng
      </div>
    )
  }

  const statusConfig = ORDER_STATUS_COLORS[order.status] || {}

  const statusTimeline = [
    { key: 'pending', label: 'Chờ xử lý' },
    { key: 'confirmed', label: 'Đã xác nhận' },
    { key: 'preparing', label: 'Đang chuẩn bị' },
    { key: 'picking', label: 'Đang lấy hàng' },
    { key: 'delivering', label: 'Đang giao' },
    { key: 'delivered', label: 'Đã giao' },
  ]

  const statusOrder = ['pending', 'confirmed', 'preparing', 'picking', 'delivering', 'delivered']
  const currentStatusIdx = statusOrder.indexOf(order.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/orders"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Chi tiết đơn hàng
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-gray-500 text-sm mt-1">
            #{order._id?.slice(-8).toUpperCase()} - {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-gray-900">Món đã đặt</h2>
            </div>
            <div className="space-y-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <img
                    src={item.food?.image || item.food?.images?.[0] || 'https://via.placeholder.com/60'}
                    alt={item.food?.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.food?.name}</p>
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                    {item.toppings?.length > 0 && (
                      <p className="text-xs text-gray-400">
                        Topping: {item.toppings.map(t => t.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-medium text-gray-900 flex-shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tạm tính</span>
                <span className="text-gray-700">{formatCurrency(order.subtotal || order.total)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phí giao hàng</span>
                  <span className="text-gray-700">{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span className="text-gray-900">Tổng cộng</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </motion.div>

          {/* Status Timeline */}
          {order.status !== 'cancelled' && order.status !== 'refunded' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <h2 className="font-semibold text-gray-900 mb-4">Tiến trình đơn hàng</h2>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {statusTimeline.map((step, i) => {
                  const stepIdx = statusOrder.indexOf(step.key)
                  const isCompleted = stepIdx <= currentStatusIdx
                  const isCurrent = step.key === order.status
                  return (
                    <div key={step.key} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                          isCompleted
                            ? isCurrent
                              ? `${statusConfig.bg || 'bg-primary'} ${statusConfig.text || 'text-primary'}`
                              : 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isCompleted ? '✓' : i + 1}
                        </div>
                        <p className={`text-xs mt-1 text-center ${isCompleted ? 'text-gray-700 font-medium' : 'text-gray-400'}`}
                           style={{ maxWidth: '60px' }}>
                          {step.label}
                        </p>
                      </div>
                      {i < statusTimeline.length - 1 && (
                        <div className={`w-8 h-0.5 mx-1 flex-shrink-0 ${
                          stepIdx < currentStatusIdx ? 'bg-green-400' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Status update buttons */}
              <div className="mt-4 pt-4 border-t">
                <label className="text-sm text-gray-500 mb-2 block">Cập nhật trạng thái:</label>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value={order.status}>{ORDER_STATUS_COLORS[order.status]?.label || order.status}</option>
                  {(ORDER_STATUS_TRANSITIONS[order.status] || []).map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_COLORS[s]?.label || s}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Customer & Shipping Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-gray-900">Khách hàng</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">
                {order.user?.name || order.shippingAddress?.name || 'Khách'}
              </p>
              {order.user?.email && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{order.user.email}</span>
                </div>
              )}
              {order.user?.phone && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{order.user.phone}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Shipping Address */}
          {order.fulfillmentType === 'delivery' && order.shippingAddress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-gray-900">Địa chỉ giao hàng</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{order.shippingAddress.address}</span>
                </div>
                {order.shippingAddress.phone && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{order.shippingAddress.phone}</span>
                  </div>
                )}
                {order.note && (
                  <div className="flex items-start gap-2 text-gray-500 mt-2 pt-2 border-t">
                    <span className="text-xs font-medium">Ghi chú:</span>
                    <span className="text-xs">{order.note}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Pickup Branch */}
          {order.fulfillmentType === 'pickup' && order.branch && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-gray-900">Nhận tại cửa hàng</h2>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{order.branch.name}</p>
                {order.branch.address && (
                  <div className="flex items-start gap-2 text-gray-500">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{order.branch.address}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Payment */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-gray-900">Thanh toán</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Phương thức</span>
                <span className="font-medium text-gray-900 capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái</span>
                <span className={`font-medium ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Shipper Info */}
          {(order.shipper || order.status === 'picking' || order.status === 'delivering') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-gray-900">Shipper</h2>
              </div>
              {order.shipper ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900">{order.shipper.name}</p>
                  {order.shipper.phone && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{order.shipper.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Chưa có shipper nhận đơn</p>
              )}
            </motion.div>
          )}

          {/* Timestamps */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-gray-900">Thời gian</h2>
            </div>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Ngày đặt</span>
                <span className="text-gray-700">{formatDate(order.createdAt)}</span>
              </div>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex justify-between">
                  <span>Cập nhật cuối</span>
                  <span className="text-gray-700">{formatDate(order.updatedAt)}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
