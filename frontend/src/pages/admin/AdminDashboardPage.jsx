import { useEffect, useState } from 'react'
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

export default function AdminDashboardPage() {
  const dispatch = useDispatch()
  const { orders } = useSelector((state) => state.orders)
  const { foods } = useSelector((state) => state.foods)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalFoods: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
  })

  // Sample chart data (replace with API data in production)
  const chartData = [
    { day: 'T2', revenue: 1200000, orders: 12 },
    { day: 'T3', revenue: 1900000, orders: 19 },
    { day: 'T4', revenue: 1500000, orders: 15 },
    { day: 'T5', revenue: 2200000, orders: 22 },
    { day: 'T6', revenue: 2800000, orders: 28 },
    { day: 'T7', revenue: 3200000, orders: 32 },
    { day: 'CN', revenue: 2600000, orders: 26 },
  ]

  useEffect(() => {
    dispatch(fetchAllOrders({ limit: 100 }))
  }, [dispatch])

  const statCards = [
    {
      label: 'Tong doanh thu',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: stats.revenueGrowth,
      trendUp: true,
    },
    {
      label: 'Don hang',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: stats.ordersGrowth,
      trendUp: true,
    },
    {
      label: 'Nguoi dung',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Mon an',
      value: stats.totalFoods.toLocaleString(),
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
        <p className="text-gray-500 text-sm mt-1">Tong quan he thong ngay hom nay</p>
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
              {card.trend !== undefined && (
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
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
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
            <h2 className="font-semibold text-gray-900">Doanh thu 7 ngay qua</h2>
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
            <h2 className="font-semibold text-gray-900">Don hang 7 ngay qua</h2>
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
        <h2 className="font-semibold text-gray-900 mb-4">Don hang gan day</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">Ma don</th>
                <th className="pb-3 font-medium">Khach hang</th>
                <th className="pb-3 font-medium">Tong tien</th>
                <th className="pb-3 font-medium">Trang thai</th>
                <th className="pb-3 font-medium">Ngay dat</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order._id} className="border-b border-gray-50">
                  <td className="py-3 font-medium text-gray-900">#{order._id?.slice(-8).toUpperCase()}</td>
                  <td className="py-3 text-gray-600">{order.fullName || order.user?.name || 'Khach'}</td>
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
                    Chua co don hang nao
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
