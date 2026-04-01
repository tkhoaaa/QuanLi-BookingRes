import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Search, Eye, UserPlus } from 'lucide-react'
import { fetchAllOrders, updateOrderStatus } from '../../slices/ordersSlice'
import { ORDER_STATUS } from '../../constants'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminOrdersPage() {
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [updateStatusId, setUpdateStatusId] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [loadingUpdate, setLoadingUpdate] = useState(false)

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
      toast.success('Cap nhat trang thai thanh cong')
      setUpdateStatusId(null)
    } catch (error) {
      toast.error(error || 'Cap nhat that bai')
    } finally {
      setLoadingUpdate(false)
    }
  }

  const statusOptions = [
    { value: '', label: 'Tat ca' },
    { value: ORDER_STATUS.PENDING, label: 'Cho xu ly' },
    { value: ORDER_STATUS.CONFIRMED, label: 'Da xac nhan' },
    { value: ORDER_STATUS.PREPARING, label: 'Dang chuan bi' },
    { value: ORDER_STATUS.PICKING, label: 'Dang lay hang' },
    { value: ORDER_STATUS.DELIVERING, label: 'Dang giao' },
    { value: ORDER_STATUS.DELIVERED, label: 'Da giao' },
    { value: ORDER_STATUS.CANCELLED, label: 'Da huy' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quan ly don hang</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} don hang</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tim don hang..."
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
          <div className="text-center py-20 text-gray-400">Khong co don hang nao</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Ma don</th>
                  <th className="px-4 py-3 font-medium">Khach hang</th>
                  <th className="px-4 py-3 font-medium">Tong tien</th>
                  <th className="px-4 py-3 font-medium">Thanh toan</th>
                  <th className="px-4 py-3 font-medium">Trang thai</th>
                  <th className="px-4 py-3 font-medium">Ngay dat</th>
                  <th className="px-4 py-3 font-medium">Hanh dong</th>
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
                      <p className="font-medium text-gray-900">{order.shippingAddress?.name || order.user?.name || 'Khach'}</p>
                      <p className="text-xs text-gray-500">{order.shippingAddress?.phone || order.user?.phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-primary font-medium">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{order.paymentMethod}</td>
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
          totalPages={Math.ceil(orders.length / 20) || 1}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        isOpen={!!updateStatusId}
        onClose={() => setUpdateStatusId(null)}
        onConfirm={confirmUpdateStatus}
        title="Cap nhat trang thai"
        message="Ban co chac chan muon cap nhat trang thai don hang nay?"
        confirmLabel="Cap nhat"
        loading={loadingUpdate}
      />
    </div>
  )
}
