import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Calendar, Clock, Users, Phone, User, FileText, MapPin, ChevronRight, Minus, Plus, CheckCircle } from 'lucide-react'
import { createReservation, fetchMyReservations } from '../slices/reservationSlice'
import { formatCurrency, cn } from '../lib/utils'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import axiosClient from '../api/axiosClient'

const TIME_SLOTS = []
for (let h = 11; h <= 21; h++) {
  TIME_SLOTS.push(`${h}:00`)
  if (h < 21) TIME_SLOTS.push(`${h}:30`)
}

const STATUS_CONFIG = {
  pending: { label: 'Chờ xác nhận', bg: 'bg-amber-100', text: 'text-amber-700' },
  confirmed: { label: 'Đã xác nhận', bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { label: 'Hoàn thành', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'Đã hủy', bg: 'bg-red-100', text: 'text-red-700' },
}

export default function ReservationPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const { reservations, loading } = useSelector((state) => state.reservation)

  const [branches, setBranches] = useState([])
  const [form, setForm] = useState({
    branchId: '',
    date: '',
    time: '12:00',
    guests: 2,
    name: user?.name || '',
    phone: user?.phone || '',
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    axiosClient.get('/branches').then(res => {
      setBranches(res.data.data || [])
    }).catch(() => {})

    if (isAuthenticated) {
      dispatch(fetchMyReservations())
    }
  }, [isAuthenticated, dispatch])

  // Min date: today
  const today = new Date().toISOString().split('T')[0]

  const incrementGuests = () => setForm(f => ({ ...f, guests: Math.min(20, f.guests + 1) }))
  const decrementGuests = () => setForm(f => ({ ...f, guests: Math.max(1, f.guests - 1) }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.branchId) { toast.error('Vui long chon chi nhanh'); return }
    if (!form.date) { toast.error('Vui long chon ngay'); return }
    if (!form.time) { toast.error('Vui long chon gio'); return }

    if (!isAuthenticated) {
      toast.error('Vui long dang nhap de dat ban')
      navigate('/login')
      return
    }

    setSubmitting(true)
    try {
      const result = await dispatch(createReservation({
        branch: form.branchId,
        date: form.date,
        time: form.time,
        guests: form.guests,
        name: form.name,
        phone: form.phone,
        note: form.note,
      })).unwrap()
      navigate('/reservation/success', { state: { reservation: result } })
    } catch (err) {
      toast.error(err || 'Dat ban that bai. Vui long thu lai.')
    } finally {
      setSubmitting(false)
    }
  }

  const myReservations = reservations.filter(r => r.customer?._id === user?._id || r.customer === user?._id)

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900 font-heading">Dat ban</h1>
            <p className="text-sm text-charcoal-500">Dat ban tai chi nhanh nha hang</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-card"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Branch */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    Chi nhanh
                  </label>
                  <Select
                    options={branches.map(b => ({ value: b._id, label: b.name }))}
                    value={form.branchId}
                    onChange={(e) => setForm(f => ({ ...f, branchId: e.target.value }))}
                    placeholder="Chon chi nhanh"
                  />
                  {form.branchId && branches.find(b => b._id === form.branchId)?.address && (
                    <p className="text-xs text-charcoal-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {branches.find(b => b._id === form.branchId).address}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    Ngay dat
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    min={today}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    Gio dat
                  </label>
                  <Select
                    options={TIME_SLOTS.map(t => ({ value: t, label: t }))}
                    value={form.time}
                    onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    So khach
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-charcoal-100 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={decrementGuests}
                        className="w-10 h-10 flex items-center justify-center hover:bg-charcoal-200 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-charcoal-600" />
                      </button>
                      <span className="w-14 text-center font-bold text-charcoal-900 text-lg">
                        {form.guests}
                      </span>
                      <button
                        type="button"
                        onClick={incrementGuests}
                        className="w-10 h-10 flex items-center justify-center hover:bg-charcoal-200 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-charcoal-600" />
                      </button>
                    </div>
                    <span className="text-sm text-charcoal-500">
                      {form.guests === 1 ? '1 nguoi' : `${form.guests} nguoi`}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-primary" />
                    Ho va ten
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nhap ho va ten"
                    className="w-full px-4 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-primary" />
                    So dien thoai
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="09xxxxxxxx"
                    className="w-full px-4 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    required
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    Ghi chu <span className="text-charcoal-400 font-normal">(tuy chon)</span>
                  </label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                    rows={3}
                    placeholder="VD: Ban cua so goc, khong gian yeu thich..."
                    className="w-full px-4 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white resize-none"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2"
                  loading={submitting}
                  disabled={submitting}
                  icon={ChevronRight}
                  iconPosition="right"
                >
                  Dat ban ngay
                </Button>
              </form>
            </motion.div>
          </div>

          {/* Right: Info panel */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-card sticky top-24"
            >
              <h3 className="font-semibold text-charcoal-900 mb-4 font-heading flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Thong tin dat ban
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-charcoal-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-charcoal-500">Chi nhanh</p>
                    <p className="font-medium text-charcoal-900">
                      {form.branchId ? (branches.find(b => b._id === form.branchId)?.name || '-') : 'Chua chon'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-charcoal-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-charcoal-500">Ngay</p>
                    <p className="font-medium text-charcoal-900">
                      {form.date ? new Date(form.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Chua chon'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-charcoal-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-charcoal-500">Gio</p>
                    <p className="font-medium text-charcoal-900">{form.time || 'Chua chon'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-charcoal-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-charcoal-500">So khach</p>
                    <p className="font-medium text-charcoal-900">{form.guests} nguoi</p>
                  </div>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl">
                  <p className="text-xs text-amber-700">
                    Vui long <Link to="/login" className="font-medium underline">dang nhap</Link> de dat ban.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* My Reservations */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-white rounded-2xl p-5 shadow-card"
          >
            <h2 className="text-lg font-bold text-charcoal-900 font-heading mb-4">Lich su dat ban</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : myReservations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-charcoal-200 mx-auto mb-2" />
                <p className="text-charcoal-500 text-sm">Chua co lich dat ban nao</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReservations.map((res) => {
                  const statusCfg = STATUS_CONFIG[res.status] || STATUS_CONFIG.pending
                  return (
                    <div
                      key={res._id}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-charcoal-50 transition-colors border border-charcoal-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-charcoal-900">
                            {res.branch?.name || res.branch}
                          </p>
                          <p className="text-xs text-charcoal-500">
                            {res.date ? new Date(res.date).toLocaleDateString('vi-VN') : '-'} luc {res.time} - {res.guests} nguoi
                          </p>
                        </div>
                      </div>
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', statusCfg.bg, statusCfg.text)}>
                        {statusCfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
