import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ChefHat,
  Truck,
  Package,
  XCircle,
  MapPin,
  Phone,
  Sparkles,
  User,
  Navigation,
  CreditCard,
  AlertCircle,
} from 'lucide-react'
import { fetchOrderDetail, cancelOrder } from '../slices/ordersSlice'
import { socket } from '../lib/socket'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatCurrency, formatDateTime } from '../lib/utils'
import { ORDER_STATUS } from '../constants'

const statusSteps = [
  { status: ORDER_STATUS.PENDING, label: 'Chờ xử lý', icon: Clock },
  { status: ORDER_STATUS.CONFIRMED, label: 'Đã xác nhận', icon: CheckCircle },
  { status: ORDER_STATUS.PREPARING, label: 'Đang chuẩn bị', icon: ChefHat },
  { status: ORDER_STATUS.PICKING, label: 'Đang lấy hàng', icon: Package },
  { status: ORDER_STATUS.DELIVERING, label: 'Đang giao', icon: Truck },
  { status: ORDER_STATUS.DELIVERED, label: 'Đã giao', icon: CheckCircle },
]

const statusOrder = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.PICKING,
  ORDER_STATUS.DELIVERING,
  ORDER_STATUS.DELIVERED,
]

export default function OrderTrackingPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentOrder, loading } = useSelector((state) => state.orders)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchOrderDetail(id))
  }, [id, dispatch])

  useEffect(() => {
    if (!currentOrder) return

    const handleOrderUpdate = () => {
      dispatch(fetchOrderDetail(id))
    }

    socket.on('orderUpdated', handleOrderUpdate)
    socket.emit('joinRoom', currentOrder._id)

    return () => {
      socket.off('orderUpdated', handleOrderUpdate)
      socket.emit('leaveRoom', currentOrder._id)
    }
  }, [currentOrder, dispatch, id])

  if (loading || !currentOrder) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentStepIndex = statusOrder.indexOf(currentOrder.status)
  const isCancelled = [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(currentOrder.status)

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/orders"
            className="w-10 h-10 bg-white rounded-xl shadow-card flex items-center justify-center hover:bg-charcoal-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-charcoal-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-charcoal-900 font-heading">Theo dõi đơn hàng</h1>
            <p className="text-sm text-charcoal-500">#{currentOrder._id?.slice(-8).toUpperCase()}</p>
          </div>
          <StatusBadge status={currentOrder.status} />
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 shadow-card mb-4"
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-secondary" />
              <h2 className="font-semibold text-charcoal-900 font-heading">Tiến trình đơn hàng</h2>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-charcoal-100" />
              <div
                className="absolute left-4 top-0 w-0.5 bg-primary transition-all duration-500"
                style={{ height: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }}
              />
              <div className="space-y-6">
                {statusSteps.map((step, i) => {
                  const isCompleted = i <= currentStepIndex
                  const isCurrent = i === currentStepIndex
                  return (
                    <motion.div
                      key={step.status}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-4 relative"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all ${
                          isCompleted
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-charcoal-100 text-charcoal-300'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                      >
                        <step.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isCompleted ? 'text-charcoal-900' : 'text-charcoal-400'}`}>
                          {step.label}
                        </p>
                        {isCurrent && currentOrder.updatedAt && (
                          <p className="text-xs text-charcoal-400">{formatDateTime(currentOrder.updatedAt)}</p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {isCancelled && (
          <div className="bg-red-50 rounded-2xl p-5 mb-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-red-700">Đơn hàng đã bị hủy</p>
              <p className="text-sm text-red-500">
                {currentOrder.status === ORDER_STATUS.CANCELLED
                  ? 'Đơn hàng đã bị hủy bởi bạn hoặc quản trị viên'
                  : 'Đơn hàng đã được hoàn tiền'}
              </p>
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="bg-white rounded-2xl p-5 shadow-card mb-4">
          <h2 className="font-semibold text-charcoal-900 mb-4 font-heading">Chi tiết đơn hàng</h2>
          <div className="space-y-3">
            {currentOrder.items?.map((item, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <img
                  src={item.food?.image || 'https://via.placeholder.com/50'}
                  alt={item.food?.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="font-medium text-charcoal-900">{item.food?.name}</p>
                  <p className="text-xs text-charcoal-500">
                    x{item.quantity} - {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <hr className="my-4 border-charcoal-100" />
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal-500">Tạm tính</span>
              <span className="text-charcoal-700">{formatCurrency(currentOrder.subtotal)}</span>
            </div>
            {currentOrder.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <span>-{formatCurrency(currentOrder.discountAmount)}</span>
              </div>
            )}
            {currentOrder.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-charcoal-500">Phí giao hàng</span>
                <span className="text-charcoal-700">{formatCurrency(currentOrder.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2.5 border-t border-charcoal-100">
              <span className="text-charcoal-900">Tổng cộng</span>
              <span className="text-secondary font-heading">{formatCurrency(currentOrder.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        {currentOrder.fulfillmentType === 'delivery' && currentOrder.shippingAddress && (
          <div className="bg-white rounded-2xl p-5 shadow-card mb-4">
            <h2 className="font-semibold text-charcoal-900 mb-3 font-heading">Địa chỉ giao hàng</h2>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-charcoal-900">
                  {currentOrder.shippingAddress?.name || currentOrder.user?.name || 'Khách'}
                </p>
                <p className="text-charcoal-500">{currentOrder.shippingAddress?.address || '-'}</p>
                <p className="text-charcoal-500 flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {currentOrder.shippingAddress?.phone || currentOrder.user?.phone || '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shipper Info Card */}
        {currentOrder.shipper && currentOrder.fulfillmentType === 'delivery' && (
          <div className="bg-white rounded-2xl p-5 shadow-card mb-4">
            <h2 className="font-semibold text-charcoal-900 mb-3 font-heading">Thông tin shipper</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-charcoal-900">{currentOrder.shipper.name || 'Shipper'}</p>
                <p className="text-sm text-charcoal-500 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`tel:${currentOrder.shipper.phone}`} className="text-primary hover:underline">
                    {currentOrder.shipper.phone || 'N/A'}
                  </a>
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${currentOrder.shipper.phone}`}
                  className="w-10 h-10 bg-green-50 hover:bg-green-100 rounded-xl flex items-center justify-center transition-colors"
                  title="Gọi shipper"
                >
                  <Phone className="w-4 h-4 text-green-600" />
                </a>
                {currentOrder.shippingAddress?.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentOrder.shippingAddress.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors"
                    title="Chỉ đường"
                  >
                    <Navigation className="w-4 h-4 text-blue-600" />
                  </a>
                )}
              </div>
            </div>
            {currentOrder.status === ORDER_STATUS.DELIVERING && (
              <div className="mt-4 flex items-center gap-3 bg-cyan-50 rounded-xl p-3">
                <Truck className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-cyan-700">Dự kiến giao: 15-25 phút</p>
                  <p className="text-xs text-cyan-500">Shipper đang trên đường giao đến bạn</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map Placeholder during delivery */}
        {currentOrder.fulfillmentType === 'delivery' && currentOrder.status === ORDER_STATUS.DELIVERING && (
          <div className="bg-white rounded-2xl p-3 shadow-card mb-4 overflow-hidden">
            <div className="w-full h-32 bg-charcoal-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-charcoal-300 mx-auto mb-1" />
                <p className="text-xs text-charcoal-400">Bản đồ theo dõi giao hàng</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div className="bg-white rounded-2xl p-5 shadow-card mb-4">
          <h2 className="font-semibold text-charcoal-900 mb-3 font-heading">Thanh toán</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-charcoal-400" />
                <span className="text-sm text-charcoal-600">Phương thức</span>
              </div>
              <span className="text-sm font-semibold text-charcoal-900">
                {currentOrder.paymentMethod === 'COD' ? 'COD (Tiền mặt)' :
                  currentOrder.paymentMethod === 'VNPay' ? 'VNPay' :
                    currentOrder.paymentMethod === 'MoMo' ? 'MoMo' : 'COD'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentOrder.isPaid ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-sm text-charcoal-600">Trạng thái</span>
              </div>
              <span className={`text-sm font-semibold ${currentOrder.isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                {currentOrder.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {currentOrder.status === ORDER_STATUS.PENDING && user?.role === 'customer' && (
          <div className="text-center">
            <Button variant="danger" className="px-8" onClick={() => dispatch(cancelOrder(currentOrder._id))}>
              Hủy đơn hàng
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
