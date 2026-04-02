import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Calendar, Package } from 'lucide-react'
import { fetchAllOrders } from '../../slices/ordersSlice'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../../lib/utils'

export default function ShipperEarningsPage() {
  const dispatch = useDispatch()
  const { orders, loading } = useSelector((state) => state.orders)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchAllOrders({ limit: 500 }))
  }, [dispatch])

  const myDeliveredOrders = orders.filter(
    (o) => o.status === 'delivered' && o.shipper?._id === user?._id
  )

  // Period calculations
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const todayEarnings = myDeliveredOrders
    .filter((o) => new Date(o.updatedAt) >= startOfDay)
    .reduce((sum, o) => sum + (o.total || 0), 0)
  const todayCount = myDeliveredOrders.filter(
    (o) => new Date(o.updatedAt) >= startOfDay
  ).length

  const weekEarnings = myDeliveredOrders
    .filter((o) => new Date(o.updatedAt) >= startOfWeek)
    .reduce((sum, o) => sum + (o.total || 0), 0)
  const weekCount = myDeliveredOrders.filter(
    (o) => new Date(o.updatedAt) >= startOfWeek
  ).length

  const monthEarnings = myDeliveredOrders
    .filter((o) => new Date(o.updatedAt) >= startOfMonth)
    .reduce((sum, o) => sum + (o.total || 0), 0)
  const monthCount = myDeliveredOrders.filter(
    (o) => new Date(o.updatedAt) >= startOfMonth
  ).length

  const avgPerDelivery = myDeliveredOrders.length > 0
    ? Math.round(myDeliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0) / myDeliveredOrders.length)
    : 0

  // Last 7 days chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (6 - i))
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const dayOrders = myDeliveredOrders.filter((o) => {
      const d = new Date(o.updatedAt)
      return d >= date && d < nextDate
    })
    const earnings = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)

    return {
      date,
      label: date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }),
      earnings,
      count: dayOrders.length,
    }
  })

  const maxDayEarning = Math.max(...last7Days.map((d) => d.earnings), 1)

  // Recent deliveries (last 20)
  const recentOrders = [...myDeliveredOrders]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 20)

  // Group recent by date
  const groupByDate = (orders) => {
    const groups = []
    const map = new Map()
    orders.forEach((order) => {
      const dateKey = formatDate(order.updatedAt)
      const dayLabel = (() => {
        const d = new Date(order.updatedAt)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        if (d.toDateString() === today.toDateString()) return 'Hom nay'
        if (d.toDateString() === yesterday.toDateString()) return 'Hom qua'
        return formatDate(order.updatedAt, { day: '2-digit', month: '2-digit' })
      })()
      if (!map.has(dayLabel)) {
        map.set(dayLabel, { label: dayLabel, orders: [] })
        groups.push(map.get(dayLabel))
      }
      map.get(dayLabel).orders.push(order)
    })
    return groups
  }

  const groupedOrders = groupByDate(recentOrders)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-charcoal-900">Thu nhap</h1>
        <p className="text-charcoal-500 text-sm mt-0.5">
          {myDeliveredOrders.length} don da giao
        </p>
      </div>

      {/* Period summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-100" />
            <span className="text-sm text-green-100">Hom nay</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(todayEarnings)}</p>
          <p className="text-sm text-green-100 mt-1">{todayCount} don</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-100" />
            <span className="text-sm text-blue-100">Tuan nay</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(weekEarnings)}</p>
          <p className="text-sm text-blue-100 mt-1">{weekCount} don</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-purple-100" />
            <span className="text-sm text-purple-100">Thang nay</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(monthEarnings)}</p>
          <p className="text-sm text-purple-100 mt-1">{monthCount} don</p>
        </motion.div>
      </div>

      {/* Average per delivery */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-charcoal-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-charcoal-500" />
          </div>
          <div>
            <p className="text-sm text-charcoal-500">Trung binh / don</p>
            <p className="font-bold text-charcoal-900">{formatCurrency(avgPerDelivery)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-charcoal-500">Tong thu nhap</p>
          <p className="font-bold text-primary text-lg">
            {formatCurrency(myDeliveredOrders.reduce((s, o) => s + (o.total || 0), 0))}
          </p>
        </div>
      </div>

      {/* Last 7 days bar chart */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-charcoal-700 mb-4">7 ngay gan nhat</h2>
        <div className="flex items-end gap-2 h-32">
          {last7Days.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end h-24">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((day.earnings / maxDayEarning) * 100, 4)}%` }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="w-full bg-primary/20 rounded-t-md relative group"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-charcoal-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCurrency(day.earnings)}
                  </div>
                  <div className="w-full bg-primary rounded-t-md min-h-[4px]" style={{ height: `${Math.max((day.earnings / maxDayEarning) * 100, 4)}%` }} />
                </motion.div>
              </div>
              <span className="text-xs text-charcoal-400">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent deliveries with earnings */}
      <div>
        <h2 className="text-sm font-semibold text-charcoal-700 mb-3">Don gan day</h2>
        {groupedOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Package className="w-12 h-12 text-charcoal-200 mx-auto mb-3" />
            <p className="text-charcoal-500 text-sm">Chua co don nao da giao</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedOrders.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-charcoal-400 uppercase mb-2 px-1">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.orders.map((order) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-charcoal-900 text-sm">
                          #{order._id?.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-charcoal-400">
                          {order.shippingAddress?.address}
                        </p>
                        <p className="text-xs text-charcoal-400 mt-0.5">
                          {formatDate(order.updatedAt, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-green-600 text-sm">
                          +{formatCurrency(order.total)}
                        </p>
                        <p className="text-xs text-charcoal-400">
                          {order.items?.length || 0} mon
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
