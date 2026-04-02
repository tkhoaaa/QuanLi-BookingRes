import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, MapPin, Package, ArrowRight, Clock, Share2, Facebook, MessageCircle } from 'lucide-react'
import { useSelector } from 'react-redux'
import { formatCurrency, cn } from '../lib/utils'
import Button from '../components/ui/Button'

// Confetti particle colors
const CONFETTI_COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']

function Confetti() {
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.2 + Math.random() * 0.8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 60,
    })), []
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: -20, x: `${p.x}vw`, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            y: '110vh',
            x: `${p.x + p.drift}vw`,
            rotate: p.rotation + 720,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          className="absolute"
          style={{ width: p.size, height: p.size, backgroundColor: p.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px' }}
        />
      ))}
    </div>
  )
}

export default function OrderSuccessPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentOrder } = useSelector((state) => state.orders)
  const [showCheck, setShowCheck] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setShowCheck(true), 100)
    const timer2 = setTimeout(() => setShowConfetti(true), 200)
    const timer3 = setTimeout(() => setShowConfetti(false), 3500)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  const estimatedTime = currentOrder?.fulfillmentType === 'delivery' ? '25 - 35 phút' : '15 - 20 phút'
  const orderNumber = id?.slice(-8).toUpperCase() || 'UNKNOWN'

  const handleShare = (type) => {
    const text = `Mình vừa đặt món tại Res-booking! Đơn hàng #${orderNumber} - ${currentOrder?.total ? formatCurrency(currentOrder.total) : ''}`
    if (type === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`, '_blank')
    } else if (type === 'zalo') {
      // Zalo doesn't have a public share API, so we show a toast-like alert
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`Zalo Share: ${text}`)
      }
    }
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          {/* Success card */}
          <div className="bg-white rounded-3xl shadow-card p-8 text-center relative overflow-hidden">
            {/* Decorative gradient strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />

            {/* Animated checkmark */}
            <div className="relative w-28 h-28 mx-auto mb-6 mt-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={showCheck ? { scale: 1 } : { scale: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center shadow-lg"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={showCheck ? { scale: 1 } : { scale: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                  <CheckCircle className="w-16 h-16 text-green-500" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
              {/* Burst rays */}
              {showCheck && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.8, scale: 0 }}
                      animate={{ opacity: 0, scale: 1.5 }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                      className="absolute top-1/2 left-1/2 w-1 h-4 rounded-full bg-green-400"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                        transformOrigin: '50% 100%',
                      }}
                    />
                  ))}
                </>
              )}
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-charcoal-900 font-heading mb-1"
            >
              Đặt hàng thành công!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-charcoal-500 mb-2"
            >
              Cảm ơn bạn đã đặt hàng. Đơn hàng đang được xử lý.
            </motion.p>

            {/* Order number badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2 rounded-full mb-6"
            >
              <span className="text-sm text-charcoal-500">Mã đơn hàng</span>
              <span className="text-base font-mono font-bold text-primary tracking-wider">
                #{orderNumber}
              </span>
            </motion.div>

            {/* Order summary */}
            {currentOrder && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-cream rounded-2xl p-4 mb-5 text-left space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-charcoal-500">Tổng tiền</span>
                  <span className="text-xl font-bold text-secondary font-heading">
                    {formatCurrency(currentOrder.total)}
                  </span>
                </div>

                {/* Payment status badge */}
                {(currentOrder.paymentMethod === 'COD' || currentOrder.paymentStatus === 'paid') && (
                  <div className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2.5',
                    currentOrder.paymentStatus === 'paid'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                  )}>
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-semibold">
                      {currentOrder.paymentStatus === 'paid'
                        ? `Da thanh toan online`
                        : 'Thanh toan khi nhan hang (COD)'}
                    </span>
                  </div>
                )}

                {/* Estimated time */}
                <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2.5">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="text-charcoal-600">Dự kiến: </span>
                    <span className="font-semibold text-amber-600">
                      {currentOrder.fulfillmentType === 'delivery'
                        ? `Giao trong ${estimatedTime}`
                        : `Sẵn sàng trong ${estimatedTime}`}
                    </span>
                  </div>
                </div>

                {currentOrder.fulfillmentType === 'delivery' && currentOrder.shippingAddress && (
                  <div className="flex items-start gap-2 pt-2 border-t border-charcoal-200">
                    <MapPin className="w-4 h-4 text-charcoal-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-charcoal-600">
                      Giao đến: {currentOrder.shippingAddress.address}
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

            {/* Share buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="mb-5"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Share2 className="w-3.5 h-3.5 text-charcoal-400" />
                <span className="text-xs text-charcoal-400">Chia sẻ đơn hàng</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('zalo')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Zalo
                </button>
              </div>
            </motion.div>

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
    </>
  )
}
