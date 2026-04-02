import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { History, Package, ArrowRight } from 'lucide-react'
import { fetchAllOrders } from '../../slices/ordersSlice'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../../lib/utils'

export default function ShipperHistoryPage() {
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchAllOrders({ limit: 500 }))
  }, [dispatch])

  const myDeliveredOrders = orders.filter(
    (o) =>
      (o.status === 'delivered' || o.status === 'cancelled') &&
      o.shipper?._id === user?._id
  )

  // Week stats
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const weekOrders = myDeliveredOrders.filter(
    (o) => o.status === 'delivered' && new Date(o.updatedAt) >= startOfWeek
  )
  const weekEarnings = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const weekCount = weekOrders.length

  // Group orders by date
  const groupedOrders = []
  const map = new Map()
  const sortedOrders = [...myDeliveredOrders]
    .filter((o) => o.status === 'delivered')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  sortedOrders.forEach((order) => {
    const d = new Date(order.updatedAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    let label
    if (d.toDateString() === today.toDateString()) {
      label = 'Hom nay'
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = 'Hom qua'
    } else {
      label = formatDate(order.updatedAt)
    }

    if (!map.has(label)) {
      map.set(label, { label, orders: [], earnings: 0 })
      groupedOrders.push(map.get(label))
    }
    map.get(label).orders.push(order)
    map.get(label).earnings += order.total || 0
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-charcoal-900">Lich su giao hang</h1>
        <p className="text-charcoal-500 text-sm mt-0.5">
          {myDeliveredOrders.filter((o) => o.status === 'delivered').length} don da giao
        </p>
      </div>

      {/* Week quick stats */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-charcoal-500">Tuan nay</p>
            <p className="font-bold text-charcoal-900">{weekCount} don</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-charcoal-500">Thu nhap</p>
          <p className="font-bold text-green-600">{formatCurrency(weekEarnings)}</p>
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : groupedOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-10 md:p-12 text-center">
          <Package className="w-14 h-14 text-charcoal-200 mx-auto mb-4" />
          <p className="text-charcoal-500">
            Chua co don hang nao da giao
          </p>
          <p className="text-charcoal-400 text-sm mt-1">
            Cac don ban da giao thanh cong se hien thi o day
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedOrders.map((group) => (
            <div key={group.label}>
              {/* Date separator */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-charcoal-700">{group.label}</span>
                  <span className="text-xs text-charcoal-400 bg-charcoal-100 px-2 py-0.5 rounded-full">
                    {group.orders.length} don
                  </span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  +{formatCurrency(group.earnings)}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {group.orders.map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link
                      to={`/shipper/order/${order._id}`}
                      className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-primary/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-charcoal-900 text-sm">
                              #{order._id?.slice(-8).toUpperCase()}
                            </p>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              Da giao
                            </span>
                          </div>
                          <p className="text-xs text-charcoal-500 truncate">
                            {order.shippingAddress?.address}
                          </p>
                          <p className="text-xs text-charcoal-400 mt-0.5">
                            {formatDate(order.updatedAt, { hour: '2-digit', minute: '2-digit' })} - {order.items?.length || 0} mon
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <div className="text-right">
                            <p className="font-bold text-green-600 text-sm">
                              +{formatCurrency(order.total)}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-charcoal-300" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
