import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
} from 'lucide-react'
import { fetchOrderDetail } from '../slices/ordersSlice'
import { socket } from '../lib/socket'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatCurrency, formatDateTime } from '../lib/utils'
import { ORDER_STATUS } from '../constants'

const statusSteps = [
  { status: ORDER_STATUS.PENDING, label: 'Cho xu ly', icon: Clock },
  { status: ORDER_STATUS.CONFIRMED, label: 'Da xac nhan', icon: CheckCircle },
  { status: ORDER_STATUS.PREPARING, label: 'Dang chuan bi', icon: ChefHat },
  { status: ORDER_STATUS.PICKING, label: 'Dang lay hang', icon: Package },
  { status: ORDER_STATUS.DELIVERING, label: 'Dang giao', icon: Truck },
  { status: ORDER_STATUS.DELIVERED, label: 'Da giao', icon: CheckCircle },
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
  const navigate = useNavigate()
  const { currentOrder, loading } = useSelector((state) => state.orders)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchOrderDetail(id))
  }, [id, dispatch])

  // Real-time socket updates
  useEffect(() => {
    if (!currentOrder) return

    const handleOrderUpdate = (updatedOrder) => {
      if (updatedOrder._id === currentOrder._id) {
        dispatch(fetchOrderDetail(id))
      }
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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentStepIndex = statusOrder.indexOf(currentOrder.status)
  const isCancelled = [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED].includes(currentOrder.status)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/orders"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Theo doi don hang</h1>
            <p className="text-sm text-gray-500">#{currentOrder._id?.slice(-8).toUpperCase()}</p>
          </div>
          <StatusBadge status={currentOrder.status} />
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm mb-6"
          >
            <h2 className="font-semibold text-gray-900 mb-6">Tien trinh don hang</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
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
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 relative"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                          isCompleted
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <step.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {isCurrent && currentOrder.updatedAt && (
                          <p className="text-xs text-gray-400">{formatDateTime(currentOrder.updatedAt)}</p>
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
          <div className="bg-red-50 rounded-xl p-6 mb-6 flex items-center gap-4">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="font-semibold text-red-700">Don hang da bi huy</p>
              <p className="text-sm text-red-500">
                {currentOrder.status === ORDER_STATUS.CANCELLED
                  ? 'Don hang da bi huy boi ban hoac quan tri vien'
                  : 'Don hang da duoc hoan tien'}
              </p>
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Chi tiet don hang</h2>
          <div className="space-y-3">
            {currentOrder.items?.map((item, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <img
                  src={item.food?.image || 'https://via.placeholder.com/50'}
                  alt={item.food?.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.food?.name}</p>
                  <p className="text-xs text-gray-500">
                    x{item.quantity} - {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <hr className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tam tinh</span>
              <span>{formatCurrency(currentOrder.subtotal)}</span>
            </div>
            {currentOrder.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giam gia</span>
                <span>-{formatCurrency(currentOrder.discountAmount)}</span>
              </div>
            )}
            {currentOrder.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Phi giao hang</span>
                <span>{formatCurrency(currentOrder.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Tong cong</span>
              <span className="text-primary">{formatCurrency(currentOrder.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        {currentOrder.fulfillmentType === 'delivery' && currentOrder.shippingAddress && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Dia chi giao hang</h2>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p>{currentOrder.shippingAddress?.name || currentOrder.user?.name || 'Khach'}</p>
                <p className="text-gray-500">{currentOrder.shippingAddress?.address || '-'}</p>
                <p className="text-gray-500 flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {currentOrder.shippingAddress?.phone || currentOrder.user?.phone || '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {currentOrder.status === ORDER_STATUS.PENDING && user?.role === 'customer' && (
          <div className="text-center">
            <Button variant="danger">Huy don hang</Button>
          </div>
        )}
      </div>
    </div>
  )
}
