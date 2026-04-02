import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, MapPin, Phone, Package, ArrowRight } from 'lucide-react'
import { useSelector } from 'react-redux'
import { formatCurrency } from '../lib/utils'
import Button from '../components/ui/Button'

export default function OrderSuccessPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentOrder } = useSelector((state) => state.orders)
  const [showCheck, setShowCheck] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowCheck(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {/* Success card */}
        <div className="bg-white rounded-3xl shadow-card p-8 text-center">
          {/* Animated checkmark */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={showCheck ? { scale: 1 } : { scale: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={showCheck ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <CheckCircle className="w-14 h-14 text-green-500" strokeWidth={1.5} />
              </motion.div>
            </motion.div>
            {/* Burst effect */}
            {showCheck && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 1, scale: 0 }}
                    animate={{ opacity: 0, scale: 1.5, x: [0, (i % 2 === 0 ? 1 : -1) * 40], y: [0, (i < 2 ? -1 : 1) * 40] }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-green-400"
                    style={{ transform: `translate(-50%, -50%) rotate(${i * 60}deg)` }}
                  />
                ))}
              </>
            )}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-charcoal-900 font-heading mb-2"
          >
            Đặt hàng thành công!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-charcoal-500 mb-6"
          >
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
          </motion.p>

          {/* Order summary */}
          {currentOrder && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-cream rounded-2xl p-4 mb-6 text-left space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal-500">Mã đơn hàng</span>
                <span className="text-sm font-mono font-semibold text-charcoal-900">
                  #{id?.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal-500">Tổng tiền</span>
                <span className="text-base font-bold text-secondary font-heading">
                  {formatCurrency(currentOrder.total)}
                </span>
              </div>
              {currentOrder.fulfillmentType === 'delivery' && currentOrder.shippingAddress && (
                <div className="flex items-start gap-2 pt-2 border-t border-charcoal-200">
                  <MapPin className="w-4 h-4 text-charcoal-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-charcoal-600">
                    {currentOrder.shippingAddress.address}
                  </div>
                </div>
              )}
              {currentOrder.fulfillmentType === 'pickup' && (
                <div className="flex items-center gap-2 pt-2 border-t border-charcoal-200">
                  <Package className="w-4 h-4 text-charcoal-400" />
                  <span className="text-sm text-charcoal-600">Nhận hàng tại cửa hàng</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3"
          >
            <Button
              className="w-full"
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate(`/orders/${id}`)}
            >
              Theo dõi đơn hàng
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/')}
            >
              Tiếp tục mua sắm
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
