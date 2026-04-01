import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Package, ChevronRight } from 'lucide-react'
import { fetchMyOrders } from '../slices/ordersSlice'
import StatusBadge from '../components/ui/StatusBadge'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../lib/utils'

export default function OrderHistoryPage() {
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchMyOrders({ page, limit: 10 }))
  }, [page, dispatch])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          Don hang cua toi
        </h1>

        {loading && orders.length === 0 ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Chua co don hang nao"
            description="Ban chua dat don hang nao. Hay kham pha thuc don va dat mon ngay!"
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/orders/${order._id}`}
                  className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs text-gray-400">Ma don</span>
                      <p className="font-medium text-gray-900 text-sm">#{order._id?.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                    <span className="font-semibold text-primary">{formatCurrency(order.total)}</span>
                  </div>
                  {order.items?.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 overflow-x-auto">
                      {order.items.slice(0, 4).map((item, i) => (
                        <img
                          key={i}
                          src={item.food?.image || 'https://via.placeholder.com/40'}
                          alt={item.food?.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ))}
                      {order.items.length > 4 && (
                        <span className="text-xs text-gray-500">+{order.items.length - 4} mon</span>
                      )}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil((orders.length || 1) / 10)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
