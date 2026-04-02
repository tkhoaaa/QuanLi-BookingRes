import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { History, Eye } from 'lucide-react'
import { fetchAllOrders } from '../../slices/ordersSlice'
import StatusBadge from '../../components/ui/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDateTime } from '../../lib/utils'

export default function ShipperHistoryPage() {
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)
  const { user } = useSelector((state) => state.auth)

  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchAllOrders({ limit: 100 }))
  }, [dispatch])

  const myDeliveredOrders = orders.filter(
    (o) =>
      (o.status === 'delivered' || o.status === 'cancelled') &&
      o.shipper?._id === user?._id
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử giao hàng</h1>
        <p className="text-gray-500 text-sm mt-1">
          {myDeliveredOrders.length} đơn hàng đã giao
        </p>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : myDeliveredOrders.length === 0 ? (
        <EmptyState
          icon={History}
          title="Chưa có đơn hàng nào đã giao"
          description="Các đơn hàng bạn đã giao thành công sẽ hiển thị ở đây"
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b">
                <th className="px-4 py-3 font-medium">Mã đơn</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Địa chỉ</th>
                <th className="px-4 py-3 font-medium">Tổng tiền</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Thời gian giao</th>
                <th className="px-4 py-3 font-medium">Xem</th>
              </tr>
            </thead>
            <tbody>
              {myDeliveredOrders.map((order, index) => (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    #{order._id?.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.shippingAddress?.name || order.user?.name || 'Khách'}</p>
                    <p className="text-xs text-gray-500">{order.shippingAddress?.phone || order.user?.phone || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                    {order.shippingAddress?.address || '-'}
                  </td>
                  <td className="px-4 py-3 text-primary font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDateTime(order.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/orders/${order._id}`}
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
        </div>
      )}
    </div>
  )
}
