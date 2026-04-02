import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ChevronRight, Sparkles, Clock, MapPin, RefreshCw } from 'lucide-react'
import { fetchMyOrders } from '../slices/ordersSlice'
import StatusBadge from '../components/ui/StatusBadge'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { SkeletonRow } from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import { formatCurrency, formatDate } from '../lib/utils'

export default function OrderHistoryPage() {
  const dispatch = useDispatch()
  const { orders, loading, error, pagination } = useSelector((state) => state.orders)
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(fetchMyOrders({ page, limit: 10 }))
  }, [page, dispatch])

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900 font-heading">Đơn hàng của tôi</h1>
            <p className="text-sm text-charcoal-500">{orders.length} đơn hàng</p>
          </div>
        </div>

        {/* Error State */}
        {error && orders.length === 0 && (
          <EmptyState
            icon={Package}
            title="Không thể tải đơn hàng"
            description={error || 'Đã xảy ra lỗi khi tải danh sách đơn hàng. Vui lòng thử lại.'}
            actionLabel="Thử lại"
            onAction={() => dispatch(fetchMyOrders({ page, limit: 10 }))}
          />
        )}

        {/* Loading Skeleton */}
        {loading && orders.length === 0 && !error && (
          <div className="bg-white rounded-2xl shadow-card p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-4 border-b border-charcoal-100 last:border-0">
                <div className="w-20 h-10 bg-gray-200 rounded animate-pulse" />
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && !error && (
          <EmptyState
            icon={Package}
            title="Chưa có đơn hàng nào"
            description="Bạn chưa đặt đơn hàng nào. Hãy khám phá thực đơn và đặt món ngay!"
            actionLabel="Khám phá thực đơn"
            onAction={() => window.location.href = '/'}
          />
        )}

        {orders.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/orders/${order._id}`}
                    className="block bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-all group"
                  >
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs text-charcoal-400">Mã đơn</p>
                          <p className="font-semibold text-charcoal-900 text-sm font-heading">
                            #{order._id?.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-charcoal-100" />
                        <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(order.createdAt)}
                        </div>
                        {order.fulfillmentType === 'delivery' && (
                          <>
                            <div className="w-px h-8 bg-charcoal-100" />
                            <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[120px]">
                                {order.shippingAddress?.address || 'Giao hàng'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <ChevronRight className="w-4 h-4 text-charcoal-300 group-hover:text-primary transition-colors" />
                      </div>
                    </div>

                    {/* Food preview */}
                    {order.items?.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto">
                        {order.items.slice(0, 4).map((item, i) => (
                          <img
                            key={i}
                            src={item.food?.image || 'https://via.placeholder.com/40'}
                            alt={item.food?.name}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                          />
                        ))}
                        {order.items.length > 4 && (
                          <span className="text-xs text-charcoal-400 bg-charcoal-100 px-2 py-1 rounded-lg flex-shrink-0">
                            +{order.items.length - 4} món
                          </span>
                        )}
                        <div className="flex-1" />
                        <span className="font-bold text-secondary font-heading text-lg flex-shrink-0">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    )}
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={pagination.page || page}
              totalPages={Math.ceil((pagination.total || 0) / 10) || 1}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
