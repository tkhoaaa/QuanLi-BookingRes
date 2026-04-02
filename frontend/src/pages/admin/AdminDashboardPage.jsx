import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  DollarSign,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchAllOrders } from '../../slices/ordersSlice'
import { formatCurrency } from '../../lib/utils'
import axiosClient from '../../api/axiosClient'

export default function AdminDashboardPage() {
  const dispatch = useDispatch()
  const { orders } = useSelector((state) => state.orders)
  const { foods } = useSelector((state) => state.foods)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    dispatch(fetchAllOrders({ limit: 200 }))
    // Fetch total users count
    axiosClient.get('/admin/users?limit=1').then(res => {
      setTotalUsers(res.data.pagination?.total || 0)
    }).catch(() => {
      setTotalUsers(0)
    })
  }, [dispatch])

  // Compute real stats from orders
  const stats = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - 6)

    const todayOrders = orders.filter(o => new Date(o.updatedAt || o.createdAt) >= todayStart)
    const weekOrders = orders.filter(o => new Date(o.updatedAt || o.createdAt) >= weekStart)

    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0)

    const weekRevenue = weekOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0)

    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    const prevWeekEnd = new Date(weekStart)
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1)
    const prevWeekOrders = orders.filter(o => {
      const d = new Date(o.updatedAt || o.createdAt)
      return d >= prevWeekStart && d <= prevWeekEnd
    })
    const prevWeekRevenue = prevWeekOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0)

    const revenueGrowth = prevWeekRevenue > 0
      ? Math.round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
      : weekRevenue > 0 ? 100 : 0

    const ordersGrowth = prevWeekOrders.length > 0
      ? Math.round(((weekOrders.length - prevWeekOrders.length) / prevWeekOrders.length) * 100)
      : weekOrders.length > 0 ? 100 : 0

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalUsers,
      totalFoods: foods.length,
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0),
      revenueGrowth,
      ordersGrowth,
    }
  }, [orders, foods, totalUsers])

  // Build 7-day chart data from real orders
  const chartData = useMemo(() => {
    const days = []
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const dayOrders = orders.filter(o => {
        const od = new Date(o.updatedAt || o.createdAt)
        return od >= dayStart && od < dayEnd
      })

      days.push({
        day: dayNames[dayStart.getDay()],
        revenue: dayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0),
        orders: dayOrders.length,
      })
    }
    return days
  }, [orders])

  const statCards = [
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      sub: `Hôm nay: ${formatCurrency(stats.todayRevenue)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: stats.revenueGrowth,
      trendUp: stats.revenueGrowth >= 0,
    },
    {
      label: 'Đơn hàng',
      value: stats.totalOrders.toLocaleString(),
      sub: `Hôm nay: ${stats.todayOrders} đơn`,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: stats.ordersGrowth,
      trendUp: stats.ordersGrowth >= 0,
    },
    {
      label: 'Người dùng',
      value: stats.totalUsers.toLocaleString(),
      sub: 'Tổng khách hàng',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Món ăn',
      value: stats.totalFoods.toLocaleString(),
      sub: 'Trong thực đơn',
      icon: UtensilsCrossed,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              {card.trend !== undefined && card.trend !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {card.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(card.trend)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.sub || card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Doanh thu 7 ngày qua</h2>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Đơn hàng 7 ngày qua</h2>
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 shadow-sm"
      >
        <h2 className="font-semibold text-gray-900 mb-4">Đơn hàng gần đây</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Mã đơn</th>
                <th className="pb-3 font-medium">Khách hàng</th>
                <th className="pb-3 font-medium">Tổng tiền</th>
                <th className="pb-3 font-medium">Trạng thái</th>
                <th className="pb-3 font-medium">Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order._id} className="border-b border-gray-50">
                  <td className="py-3 font-medium text-gray-900">#{order._id?.slice(-8).toUpperCase()}</td>
                  <td className="py-3 text-gray-600">{order.fullName || order.user?.name || 'Khách'}</td>
                  <td className="py-3 text-primary font-medium">{formatCurrency(order.total)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
