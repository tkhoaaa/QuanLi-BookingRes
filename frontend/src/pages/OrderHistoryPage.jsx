import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ChevronRight, Sparkles, Clock, MapPin } from 'lucide-react'
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

        {loading && orders.length === 0 ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Chưa có đơn hàng nào"
            description="Bạn chưa đặt đơn hàng nào. Hãy khám phá thực đơn và đặt món ngay!"
            actionLabel="Khám phá thực đơn"
            onAction={() => window.location.href = '/'}
          />
        ) : (
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
