import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Users,
  Phone,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  X,
  ChevronDown,
  Search,
  Filter,
  Eye,
} from 'lucide-react'
import { fetchReservations, updateReservationStatus } from '../../slices/reservationSlice'
import { formatCurrency, cn } from '../../lib/utils'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import axiosClient from '../../api/axiosClient'

const STATUS_CONFIG = {
  pending: { label: 'Cho xac nhan', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  confirmed: { label: 'Da xac nhan', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  completed: { label: 'Hoan thanh', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  cancelled: { label: 'Da huy', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
}

const ALL_TIME_SLOTS = []
for (let h = 11; h <= 21; h++) {
  ALL_TIME_SLOTS.push(`${h}:00`)
  if (h < 21) ALL_TIME_SLOTS.push(`${h}:30`)
}

export default function AdminReservationsPage() {
  const dispatch = useDispatch()
  const { reservations, loading, pagination } = useSelector((state) => state.reservation)

  const [branches, setBranches] = useState([])
  const [filters, setFilters] = useState({ date: '', status: '', branchId: '' })
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const [tableModal, setTableModal] = useState(null) // reservation id being assigned table
  const [tableNumber, setTableNumber] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    axiosClient.get('/branches').then(res => setBranches(res.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    dispatch(fetchReservations({ page, ...filters }))
  }, [page, filters, dispatch])

  const handleStatusUpdate = async (id, newStatus) => {
    setActionLoading(id)
    try {
      await dispatch(updateReservationStatus({ id, status: newStatus })).unwrap()
      toast.success(`Da cap nhat trang thai thanh ${STATUS_CONFIG[newStatus].label}`)
    } catch (err) {
      toast.error(err || 'Cap nhat that bai')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAssignTable = async () => {
    if (!tableModal || !tableNumber.trim()) return
    setActionLoading(tableModal)
    try {
      await dispatch(updateReservationStatus({
        id: tableModal,
        status: 'confirmed',
        tableNumber: tableNumber.trim(),
      })).unwrap()
      toast.success('Da xac nhan va gan ban')
      setTableModal(null)
      setTableNumber('')
    } catch (err) {
      toast.error(err || 'That bai')
    } finally {
      setActionLoading(null)
    }
  }

  const applyFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900 font-heading">Dat ban</h1>
          <p className="text-sm text-charcoal-500 mt-0.5">
            {pagination.total} lich dat ban
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Filter className="w-4 h-4 text-charcoal-400 flex-shrink-0" />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => applyFilter('date', e.target.value)}
              min={today}
              className="flex-1 px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <Select
            options={[
              { value: '', label: 'Tat ca trang thai' },
              { value: 'pending', label: 'Cho xac nhan' },
              { value: 'confirmed', label: 'Da xac nhan' },
              { value: 'completed', label: 'Hoan thanh' },
              { value: 'cancelled', label: 'Da huy' },
            ]}
            value={filters.status}
            onChange={(e) => applyFilter('status', e.target.value)}
            className="min-w-[160px]"
          />
          <Select
            options={[
              { value: '', label: 'Tat ca chi nhanh' },
              ...branches.map(b => ({ value: b._id, label: b.name })),
            ]}
            value={filters.branchId}
            onChange={(e) => applyFilter('branchId', e.target.value)}
            className="min-w-[160px]"
          />
          {(filters.date || filters.status || filters.branchId) && (
            <button
              onClick={() => applyFilter('date', '') || applyFilter('status', '') || applyFilter('branchId', '') || (() => { setFilters({ date: '', status: '', branchId: '' }); setPage(1) })()}
              className="text-sm text-charcoal-500 hover:text-charcoal-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Xoa loc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading && reservations.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-charcoal-200 mx-auto mb-2" />
            <p className="text-charcoal-500">Khong co lich dat ban nao</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream border-b border-charcoal-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Khach hang</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Chi nhanh</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Ngay</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Gio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 uppercase tracking-wider">So khach</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Trang thai</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {reservations.map((res) => {
                  const statusCfg = STATUS_CONFIG[res.status] || STATUS_CONFIG.pending
                  const isExpanded = expandedId === res._id
                  return (
                    <>
                      <tr
                        key={res._id}
                        className={cn('hover:bg-charcoal-50 transition-colors', isExpanded && 'bg-cream')}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-charcoal-900">{res.name}</p>
                            <p className="text-xs text-charcoal-500">{res.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-charcoal-900">{res.branch?.name || '-'}</p>
                          {res.tableNumber && (
                            <p className="text-xs text-charcoal-500">Ban {res.tableNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-charcoal-900">
                            {res.date ? new Date(res.date).toLocaleDateString('vi-VN') : '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-charcoal-900">{res.time}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-charcoal-900">{res.guests} nguoi</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', statusCfg.bg, statusCfg.text)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : res._id)}
                              className="p-1.5 text-charcoal-400 hover:text-charcoal-700 hover:bg-charcoal-100 rounded-lg transition-colors"
                              title="Chi tiet"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {res.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setTableModal(res._id)
                                    setTableNumber(res.tableNumber || '')
                                  }}
                                  disabled={actionLoading === res._id}
                                  className="px-2.5 py-1 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === res._id ? '...' : 'Xac nhan'}
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(res._id, 'cancelled')}
                                  disabled={actionLoading === res._id}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Huy"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {res.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusUpdate(res._id, 'completed')}
                                disabled={actionLoading === res._id}
                                className="px-2.5 py-1 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                              >
                                Hoan thanh
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded details */}
                      {isExpanded && (
                        <tr key={`${res._id}-expanded`}>
                          <td colSpan={7} className="px-4 py-4 bg-cream">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-charcoal-500 mb-1">Email</p>
                                <p className="text-sm text-charcoal-900">{res.customer?.email || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-charcoal-500 mb-1">Dia chi chi nhanh</p>
                                <p className="text-sm text-charcoal-900">{res.branch?.address || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-charcoal-500 mb-1">Ghi chu</p>
                                <p className="text-sm text-charcoal-900">{res.note || 'Khong co'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-charcoal-500 mb-1">Ngay tao</p>
                                <p className="text-sm text-charcoal-900">
                                  {res.createdAt ? new Date(res.createdAt).toLocaleString('vi-VN') : '-'}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-charcoal-100">
            <p className="text-sm text-charcoal-500">
              Trang {pagination.page} / {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-charcoal-200 rounded-lg hover:bg-charcoal-50 disabled:opacity-40 transition-colors"
              >
                Truoc
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1.5 text-sm border border-charcoal-200 rounded-lg hover:bg-charcoal-50 disabled:opacity-40 transition-colors"
              >
                Tiep
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Assignment Modal */}
      <AnimatePresence>
        {tableModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setTableModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-bold text-charcoal-900 font-heading mb-4">Xac nhan dat ban</h3>
              <p className="text-sm text-charcoal-500 mb-4">Nhap so ban de xac nhan lich dat</p>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="VD: B01, A3"
                className="w-full px-4 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setTableModal(null)}>
                  Huy
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAssignTable}
                  loading={actionLoading === tableModal}
                  disabled={!tableNumber.trim()}
                  icon={CheckCircle}
                >
                  Xac nhan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
