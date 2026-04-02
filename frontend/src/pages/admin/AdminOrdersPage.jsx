import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Search, Eye, UserPlus, Truck } from 'lucide-react'
import { fetchAllOrders, updateOrderStatus, assignShipper } from '../../slices/ordersSlice'
import { ORDER_STATUS } from '../../constants'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import axiosClient from '../../api/axiosClient'

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

  useEffect(() => {
    axiosClient.get('/admin/users?role=shipper&limit=100').then(res => {
      setShippers(res.data.data || [])
    }).catch(() => setShippers([]))
  }, [])

  useEffect(() => {
    dispatch(fetchAllOrders({ page, limit: 20, status: statusFilter, search }))
  }, [page, statusFilter, search, dispatch])

  const handleUpdateStatus = (orderId, status) => {
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

  const statusOptions = [
    { value: '', label: 'Tất cả' },
    { value: ORDER_STATUS.PENDING, label: 'Chờ xử lý' },
    { value: ORDER_STATUS.CONFIRMED, label: 'Đã xác nhận' },
    { value: ORDER_STATUS.PREPARING, label: 'Đang chuẩn bị' },
    { value: ORDER_STATUS.PICKING, label: 'Đang lấy hàng' },
    { value: ORDER_STATUS.DELIVERING, label: 'Đang giao' },
    { value: ORDER_STATUS.DELIVERED, label: 'Đã giao' },
    { value: ORDER_STATUS.CANCELLED, label: 'Đã hủy' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} đơn hàng</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm đơn hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
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
                  <th className="px-4 py-3 font-medium">Mã đơn</th>
                  <th className="px-4 py-3 font-medium">Khách hàng</th>
                  <th className="px-4 py-3 font-medium">Tổng tiền</th>
                  <th className="px-4 py-3 font-medium">Shipper</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Ngày đặt</th>
                  <th className="px-4 py-3 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
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
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          order.status === 'delivering' ? 'bg-cyan-100 text-cyan-700' :
                          'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {statusOptions.filter(o => o.value).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {orders.length > 0 && (
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
    </div>
  )
}
