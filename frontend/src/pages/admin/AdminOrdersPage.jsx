import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Search, Eye, UserPlus, Truck, ChevronUp, ChevronDown, ShoppingBag, CheckSquare, Square, MapPin } from 'lucide-react'
import { fetchAllOrders, updateOrderStatus, assignShipper } from '../../slices/ordersSlice'
import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS, ORDER_STATUS_COLORS } from '../../constants'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import axiosClient from '../../api/axiosClient'

const FILTER_CHIPS = [
  { key: '', label: 'Tất cả' },
  { key: 'pending', label: 'Chưa xác nhận' },
  { key: 'delivering', label: 'Đang giao' },
  { key: 'delivered', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
]

export default function AdminOrdersPage() {
  const dispatch = useDispatch()
  const { orders, loading, pagination } = useSelector((state) => state.orders)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [updateStatusId, setUpdateStatusId] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [loadingUpdate, setLoadingUpdate] = useState(false)
  const [shippers, setShippers] = useState([])
  const [assignShipperId, setAssignShipperId] = useState(null)
  const [selectedShipper, setSelectedShipper] = useState('')
  const [loadingAssign, setLoadingAssign] = useState(false)
  const [sortField, setSortField] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [warnStatusSkip, setWarnStatusSkip] = useState(null)

  // Batch shipper assignment
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [batchShipperDialogOpen, setBatchShipperDialogOpen] = useState(false)
  const [batchShipperId, setBatchShipperId] = useState('')
  const [loadingBatchAssign, setLoadingBatchAssign] = useState(false)

  // Branch filter
  const [branches, setBranches] = useState([])
  const [branchFilter, setBranchFilter] = useState('')

  useEffect(() => {
    axiosClient.get('/branches').then(res => {
      setBranches(res.data.data || [])
    }).catch(() => setBranches([]))
  }, [])

  useEffect(() => {
    axiosClient.get('/admin/users?role=shipper&limit=100').then(res => {
      setShippers(res.data.data || [])
    }).catch(() => setShippers([]))
  }, [])

  useEffect(() => {
    dispatch(fetchAllOrders({ page, limit: 20, status: statusFilter, search, sortField, sortDir, branchId: branchFilter }))
  }, [page, statusFilter, search, sortField, sortDir, branchFilter, dispatch])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />
  }

  const handleUpdateStatus = (orderId, status) => {
    const order = orders.find(o => o._id === orderId)
    if (order) {
      const validNext = ORDER_STATUS_TRANSITIONS[order.status] || []
      const currentIdx = ['pending','confirmed','preparing','picking','delivering','delivered','cancelled'].indexOf(order.status)
      const nextIdx = ['pending','confirmed','preparing','picking','delivering','delivered','cancelled'].indexOf(status)
      if (validNext.length > 0 && nextIdx - currentIdx > 1) {
        setWarnStatusSkip(orderId)
        return
      }
    }
    setUpdateStatusId(orderId)
    setNewStatus(status)
  }

  const confirmUpdateStatus = async () => {
    if (!updateStatusId || !newStatus) return
    setLoadingUpdate(true)
    try {
      await dispatch(updateOrderStatus({ id: updateStatusId, status: newStatus })).unwrap()
      toast.success('Cập nhật trạng thái thành công')
      setUpdateStatusId(null)
      setWarnStatusSkip(null)
    } catch (error) {
      toast.error(error || 'Cập nhật thất bại')
    } finally {
      setLoadingUpdate(false)
    }
  }

  const handleAssignShipper = (orderId) => {
    setAssignShipperId(orderId)
    const order = orders.find(o => o._id === orderId)
    setSelectedShipper(order?.shipper?._id || '')
  }

  const confirmAssignShipper = async () => {
    if (!assignShipperId) return
    setLoadingAssign(true)
    try {
      await dispatch(assignShipper({ orderId: assignShipperId, shipperId: selectedShipper || null })).unwrap()
      toast.success(selectedShipper ? 'Gán shipper thành công' : 'Đã hủy gán shipper')
      setAssignShipperId(null)
    } catch (error) {
      toast.error(error || 'Gán shipper thất bại')
    } finally {
      setLoadingAssign(false)
    }
  }

  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(orders.map(o => o._id))
    }
  }

  const handleBatchAssignClick = () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Chon it nhat mot don hang')
      return
    }
    setBatchShipperDialogOpen(true)
    setBatchShipperId('')
  }

  const confirmBatchAssign = async () => {
    if (!batchShipperId) return
    setLoadingBatchAssign(true)
    try {
      await axiosClient.post('/delivery/assign-batch', {
        orderIds: selectedOrderIds,
        shipperId: batchShipperId,
      })
      toast.success(`Da gan ${selectedOrderIds.length} don hang cho shipper`)
      setSelectedOrderIds([])
      setBatchShipperDialogOpen(false)
      dispatch(fetchAllOrders({ page, limit: 20, status: statusFilter, search, sortField, sortDir }))
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Gan shipper that bai')
    } finally {
      setLoadingBatchAssign(false)
    }
  }

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'preparing', label: 'Đang chuẩn bị' },
    { value: 'picking', label: 'Đang lấy hàng' },
    { value: 'delivering', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
  ]

  const statusLabels = Object.fromEntries(
    Object.entries(ORDER_STATUS_COLORS).map(([k, v]) => [k, v.label])
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-gray-500 text-sm">{pagination.total || 0} đơn hàng trong hệ thống</p>
          </div>
          {selectedOrderIds.length > 0 && (
            <Button
              size="sm"
              onClick={handleBatchAssignClick}
              icon={Truck}
              className="shrink-0"
            >
              Gan {selectedOrderIds.length} don cho shipper
            </Button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.key}
            onClick={() => { setStatusFilter(chip.key); setPage(1) }}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              statusFilter === chip.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Branch filter */}
      {branches.length > 0 && (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <select
            value={branchFilter}
            onChange={(e) => { setBranchFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white max-w-xs"
          >
            <option value="">Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          {branchFilter && (
            <button
              onClick={() => { setBranchFilter(''); setPage(1) }}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Xóa
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm đơn hàng (mã đơn, tên khách, số điện thoại)..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Không có đơn hàng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium w-10">
                    <button onClick={toggleSelectAll} className="text-charcoal-400 hover:text-primary transition-colors" title="Chon tat ca">
                      {selectedOrderIds.length === orders.length && orders.length > 0
                        ? <CheckSquare className="w-4 h-4" />
                        : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium group cursor-pointer select-none" onClick={() => handleSort('_id')}>
                    <div className="flex items-center gap-1">
                      Mã đơn <SortIcon field="_id" />
                    </div>
                  </th>
                  <th className="px-4 py-3 font-medium">Khách hàng</th>
                  <th className="px-4 py-3 font-medium group cursor-pointer select-none" onClick={() => handleSort('total')}>
                    <div className="flex items-center gap-1">
                      Tổng tiền <SortIcon field="total" />
                    </div>
                  </th>
                  <th className="px-4 py-3 font-medium">Shipper</th>
                  <th className="px-4 py-3 font-medium">Chi nhánh</th>
                  <th className="px-4 py-3 font-medium group cursor-pointer select-none" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">
                      Trạng thái <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="px-4 py-3 font-medium group cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1">
                      Ngày đặt <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-4 py-3 font-medium">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const validNext = ORDER_STATUS_TRANSITIONS[order.status] || []
                  const isSkipping = warnStatusSkip === order._id
                  return (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isSkipping ? 'bg-amber-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleOrderSelection(order._id)}
                          className="text-charcoal-400 hover:text-primary transition-colors"
                        >
                          {selectedOrderIds.includes(order._id)
                            ? <CheckSquare className="w-4 h-4 text-primary" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        #{order._id?.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{order.shippingAddress?.name || order.user?.name || 'Khách'}</p>
                        <p className="text-xs text-gray-500">{order.shippingAddress?.phone || order.user?.phone || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-primary font-medium">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3">
                        {order.shipper ? (
                          <div className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">{order.shipper.name}</span>
                          </div>
                        ) : order.fulfillmentType === 'pickup' ? (
                          <span className="text-xs text-gray-400 italic">Tự lấy</span>
                        ) : (
                          <button
                            onClick={() => handleAssignShipper(order._id)}
                            className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100 transition-colors"
                          >
                            + Gán shipper
                          </button>
                        )}
                      </td>
                      {/* Branch */}
                      <td className="px-4 py-3">
                        {order.branch || order.branchId ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-orange-500" />
                            <span className="text-xs text-gray-600 truncate max-w-[100px]" title={typeof order.branch === 'object' ? order.branch.name : undefined}>
                              {typeof order.branch === 'object' ? order.branch.name : 'Chi nhánh'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isSkipping ? (
                          <div className="space-y-1">
                            <StatusBadge status={order.status} />
                            <p className="text-xs text-amber-600">Không thể bỏ qua bước trung gian</p>
                            <button
                              onClick={() => setWarnStatusSkip(null)}
                              className="text-xs text-gray-400 underline"
                            >
                              Đóng
                            </button>
                          </div>
                        ) : validNext.length === 0 ? (
                          <StatusBadge status={order.status} />
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                            className="text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer bg-white ring-1 ring-gray-200 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            <option value={order.status}>{ORDER_STATUS_COLORS[order.status]?.label || order.status}</option>
                            {validNext.map(s => (
                              <option key={s} value={s}>{ORDER_STATUS_COLORS[s]?.label || s}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg inline-block transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil((pagination.total || 0) / 20) || 1}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        isOpen={!!updateStatusId}
        onClose={() => setUpdateStatusId(null)}
        onConfirm={confirmUpdateStatus}
        title="Cập nhật trạng thái"
        message="Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng này?"
        confirmLabel="Cập nhật"
        loading={loadingUpdate}
      />

      {/* Shipper Assignment Dialog */}
      <ConfirmDialog
        isOpen={!!assignShipperId}
        onClose={() => setAssignShipperId(null)}
        onConfirm={confirmAssignShipper}
        title="Gán shipper"
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Chọn shipper cho đơn hàng này:</p>
            <select
              value={selectedShipper}
              onChange={(e) => setSelectedShipper(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">-- Hủy gán shipper --</option>
              {shippers.map((s) => (
                <option key={s._id} value={s._id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>
              ))}
            </select>
          </div>
        }
        confirmLabel={selectedShipper ? 'Gán shipper' : 'Hủy gán'}
        loading={loadingAssign}
      />

      {/* Batch Shipper Assignment Dialog */}
      <ConfirmDialog
        isOpen={batchShipperDialogOpen}
        onClose={() => setBatchShipperDialogOpen(false)}
        onConfirm={confirmBatchAssign}
        title="Gan nhieu don cho shipper"
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Gan <strong>{selectedOrderIds.length}</strong> don hang da chon cho shipper:
            </p>
            <select
              value={batchShipperId}
              onChange={(e) => setBatchShipperId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">-- Chon shipper --</option>
              {shippers.map((s) => (
                <option key={s._id} value={s._id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>
              ))}
            </select>
          </div>
        }
        confirmLabel={batchShipperId ? `Gan ${selectedOrderIds.length} don` : 'Chon shipper'}
        loading={loadingBatchAssign}
        disabled={!batchShipperId}
      />
    </div>
  )
}
