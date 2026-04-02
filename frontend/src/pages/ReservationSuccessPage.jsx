import { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, Clock, Users, MapPin, Home, ChevronRight } from 'lucide-react'
import Button from '../components/ui/Button'

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
      drift: (Math.random() - 0.5) * 60,
      rotation: Math.random() * 360,
    })), []
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: -20, x: `${p.x}vw` }}
          animate={{
            opacity: [1, 1, 0],
            y: '110vh',
            x: `${p.x + p.drift}vw`,
            rotate: p.rotation + 720,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}

export default function ReservationSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const reservation = location.state?.reservation

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

  if (!reservation) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-charcoal-500 mb-4">Khong tim thay thong tin dat ban</p>
          <Button onClick={() => navigate('/')}>Ve trang chu</Button>
        </div>
      </div>
    )
  }

  const resNumber = reservation._id?.slice(-8).toUpperCase() || 'UNKNOWN'

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
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
              Dat ban thanh cong!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-charcoal-500 mb-2"
            >
              Cam on ban da dat ban. Chung toi se lien he de xac nhan.
            </motion.p>

            {/* Reservation number badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-2 rounded-full mb-6"
            >
              <span className="text-sm text-charcoal-500">Ma dat ban</span>
              <span className="text-base font-mono font-bold text-primary tracking-wider">
                #{resNumber}
              </span>
            </motion.div>

            {/* Reservation details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-cream rounded-2xl p-4 mb-5 text-left space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-charcoal-500">Chi nhanh</p>
                  <p className="text-sm font-semibold text-charcoal-900">
                    {reservation.branch?.name || '-'}
                  </p>
                  {reservation.branch?.address && (
                    <p className="text-xs text-charcoal-500">{reservation.branch.address}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-charcoal-500">Ngay</p>
                  <p className="text-sm font-semibold text-charcoal-900">
                    {reservation.date
                      ? new Date(reservation.date).toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-charcoal-500">Gio</p>
                  <p className="text-sm font-semibold text-charcoal-900">{reservation.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-charcoal-500">So khach</p>
                  <p className="text-sm font-semibold text-charcoal-900">
                    {reservation.guests} nguoi
                  </p>
                </div>
              </div>
              {reservation.note && (
                <div className="border-t border-charcoal-200 pt-3 mt-3">
                  <p className="text-xs text-charcoal-500">Ghi chu</p>
                  <p className="text-sm text-charcoal-700">{reservation.note}</p>
                </div>
              )}
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
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => navigate('/')}
              >
                Quay ve trang chu
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                icon={Home}
                onClick={() => navigate('/')}
              >
                Tiep tuc dat mon
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
