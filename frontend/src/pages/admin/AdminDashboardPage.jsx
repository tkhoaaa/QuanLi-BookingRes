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
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { fetchAllOrders } from '../../slices/ordersSlice'
import { formatCurrency } from '../../lib/utils'
import axiosClient from '../../api/axiosClient'
import { CATEGORIES } from '../../constants'

const DATE_RANGES = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7days', label: '7 ngày' },
  { value: '30days', label: '30 ngày' },
]

const ORDER_STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#f97316',
  picking: '#a855f7',
  delivering: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#6b7280',
}

const CATEGORY_COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#06b6d4',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16',
]

export default function AdminDashboardPage() {
  const dispatch = useDispatch()
  const { orders } = useSelector((state) => state.orders)
  const { foods } = useSelector((state) => state.foods)
  const [totalUsers, setTotalUsers] = useState(0)
  const [dateRange, setDateRange] = useState('7days')

  useEffect(() => {
    dispatch(fetchAllOrders({ limit: 500 }))
    axiosClient.get('/admin/users?limit=1').then(res => {
      setTotalUsers(res.data.pagination?.total || 0)
    }).catch(() => {
      setTotalUsers(0)
    })
  }, [dispatch])

  // Get date boundaries based on selected range
  const dateBounds = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    let start, end, prevStart, prevEnd

    if (dateRange === 'today') {
      start = todayStart
      end = todayEnd
      prevStart = new Date(todayStart)
      prevStart.setDate(prevStart.getDate() - 1)
      prevEnd = todayStart
    } else if (dateRange === '7days') {
      start = new Date(todayStart)
      start.setDate(start.getDate() - 6)
      end = todayEnd
      prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - 7)
      prevEnd = start
    } else if (dateRange === '30days') {
      start = new Date(todayStart)
      start.setDate(start.getDate() - 29)
      end = todayEnd
      prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - 30)
      prevEnd = start
    }

    return { start, end, prevStart, prevEnd }
  }, [dateRange])

  // Filtered orders for current period
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.updatedAt || o.createdAt)
      return d >= dateBounds.start && d < dateBounds.end
    })
  }, [orders, dateBounds])

  // Previous period orders
  const prevOrders = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.updatedAt || o.createdAt)
      return d >= dateBounds.prevStart && d < dateBounds.prevEnd
    })
  }, [orders, dateBounds])

  // Compute KPI stats
  const stats = useMemo(() => {
    const currDelivered = filteredOrders.filter(o => o.status === 'delivered')
    const prevDelivered = prevOrders.filter(o => o.status === 'delivered')

    const currRevenue = currDelivered.reduce((s, o) => s + (o.total || 0), 0)
    const prevRevenue = prevDelivered.reduce((s, o) => s + (o.total || 0), 0)

    const currOrders = filteredOrders.length
    const prevOrdersCount = prevOrders.length

    const revenueGrowth = prevRevenue > 0
      ? Math.round(((currRevenue - prevRevenue) / prevRevenue) * 100)
      : currRevenue > 0 ? 100 : 0

    const ordersGrowth = prevOrdersCount > 0
      ? Math.round(((currOrders - prevOrdersCount) / prevOrdersCount) * 100)
      : currOrders > 0 ? 100 : 0

    const avgOrderValue = currOrders > 0 ? Math.round(currRevenue / currOrders) : 0
    const prevAvg = prevOrdersCount > 0 ? Math.round(prevRevenue / prevOrdersCount) : 0
    const avgGrowth = prevAvg > 0
      ? Math.round(((avgOrderValue - prevAvg) / prevAvg) * 100)
      : avgOrderValue > 0 ? 100 : 0

    return {
      totalRevenue: currRevenue,
      totalOrders: currOrders,
      totalUsers,
      totalFoods: foods.length,
      avgOrderValue,
      revenueGrowth,
      ordersGrowth,
      avgGrowth,
    }
  }, [filteredOrders, prevOrders, foods, totalUsers])

  // Chart data for the period (grouped by day)
  const chartData = useMemo(() => {
    const days = []
    let numDays = dateRange === 'today' ? 1 : dateRange === '7days' ? 7 : 30
    if (dateRange === 'today') numDays = 1

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const dayOrders = filteredOrders.filter(o => {
        const od = new Date(o.updatedAt || o.createdAt)
        return od >= dayStart && od < dayEnd
      })

      days.push({
        day: dayStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        shortDay: dayNames[dayStart.getDay()],
        revenue: dayOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0),
        orders: dayOrders.length,
      })
    }
    return days
  }, [filteredOrders, dateRange])

  // Revenue by category from delivered orders
  const categoryData = useMemo(() => {
    const catRevenue = {}
    filteredOrders.filter(o => o.status === 'delivered').forEach(order => {
      (order.items || []).forEach(item => {
        const cat = item.category || 'other'
        catRevenue[cat] = (catRevenue[cat] || 0) + (item.price || 0) * (item.quantity || 1)
      })
    })
    return CATEGORIES
      .filter(c => catRevenue[c.value])
      .map(c => ({
        name: c.label,
        value: catRevenue[c.value],
      }))
      .concat(
        Object.entries(catRevenue)
          .filter(([k]) => !CATEGORIES.find(c => c.value === k))
          .map(([k, v]) => ({ name: k, value: v }))
      )
      .filter(d => d.value > 0)
      .map(d => ({
        ...d,
        percent: stats.totalRevenue > 0
          ? Math.round((d.value / stats.totalRevenue) * 100)
          : 0,
      }))
  }, [filteredOrders, stats.totalRevenue])

  // Top selling items
  const topSelling = useMemo(() => {
    const soldCount = {}
    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const key = item.foodId || item.name
        if (!soldCount[key]) {
          soldCount[key] = { name: item.name || 'Unknown', quantity: 0, category: item.category }
        }
        soldCount[key].quantity += item.quantity || 1
      })
    })
    return Object.values(soldCount)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
  }, [filteredOrders])

  // Order status distribution
  const statusData = useMemo(() => {
    const counts = {}
    filteredOrders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1
    })
    return Object.entries(counts)
      .map(([status, count]) => ({
        status,
        count,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        color: ORDER_STATUS_COLORS[status] || '#6b7280',
      }))
      .sort((a, b) => b.count - a.count)
  }, [filteredOrders])

  // Mini bar data for stat cards
  const statCards = [
    {
      label: 'Doanh thu',
      value: formatCurrency(stats.totalRevenue),
      sub: `${dateRange === 'today' ? 'Hôm nay' : dateRange === '7days' ? '7 ngày qua' : '30 ngày qua'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: stats.revenueGrowth,
      trendUp: stats.revenueGrowth >= 0,
      barData: chartData.map(d => d.revenue),
      barColor: '#22c55e',
    },
    {
      label: 'Đơn hàng',
      value: stats.totalOrders.toLocaleString(),
      sub: `Giá trị TB: ${formatCurrency(stats.avgOrderValue)}`,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: stats.ordersGrowth,
      trendUp: stats.ordersGrowth >= 0,
      barData: chartData.map(d => d.orders),
      barColor: '#3b82f6',
    },
    {
      label: 'Người dùng',
      value: stats.totalUsers.toLocaleString(),
      sub: 'Tổng khách hàng',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      barData: null,
    },
    {
      label: 'Món ăn',
      value: stats.totalFoods.toLocaleString(),
      sub: 'Trong thực đơn',
      icon: UtensilsCrossed,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      barData: null,
    },
  ]

  // CSV export
  const handleExportReport = () => {
    const headers = ['Ngày', 'Doanh thu (VND)', 'Số đơn hàng']
    const rows = chartData.map(d => [
      d.day,
      d.revenue,
      d.orders,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bao-cao-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-gray-600" style={{ color: p.color }}>
              {p.name}: {formatter ? formatter(p.value) : p.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400 ml-2" />
            {DATE_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  dateRange === range.value
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          {/* Export Button */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>
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
            <p className="text-xs text-gray-500 mt-0.5">{card.sub || card.label}</p>
            {/* Mini sparkline bar */}
            {card.barData && card.barData.length > 0 && (
              <div className="mt-3 flex items-end gap-0.5 h-8">
                {card.barData.map((val, idx) => {
                  const maxVal = Math.max(...card.barData)
                  const height = maxVal > 0 ? (val / maxVal) * 100 : 0
                  return (
                    <div
                      key={idx}
                      className="flex-1 rounded-sm transition-all"
                      style={{
                        height: `${Math.max(height, 5)}%`,
                        backgroundColor: card.barColor,
                        opacity: 0.3 + (height / 100) * 0.7,
                      }}
                    />
                  )
                })}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Revenue & Orders Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Doanh thu</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {dateRange === 'today' ? 'Hôm nay' : dateRange === '7days' ? '7 ngày qua' : '30 ngày qua'}
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-orange-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey={dateRange === '30days' ? 'day' : 'shortDay'} fontSize={11} tickLine={false} />
              <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Số đơn hàng</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {dateRange === 'today' ? 'Hôm nay' : dateRange === '7days' ? '7 ngày qua' : '30 ngày qua'}
              </p>
            </div>
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey={dateRange === '30days' ? 'day' : 'shortDay'} fontSize={11} tickLine={false} />
              <YAxis fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Đơn hàng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Category Revenue + Order Status + Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Doanh thu theo danh mục</h2>
            <PieChartIcon className="w-5 h-5 text-purple-500" />
          </div>
          {categoryData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full grid grid-cols-2 gap-1 mt-2">
                {categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs px-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    <span className="text-gray-600 truncate">{d.name}</span>
                    <span className="text-gray-400 ml-auto">{d.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Chưa có dữ liệu
            </div>
          )}
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Trạng thái đơn hàng</h2>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {statusData.map((d) => (
                  <div key={d.status} className="flex items-center gap-1.5 text-xs px-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-600 truncate capitalize">{d.label}</span>
                    <span className="text-gray-400 ml-auto">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Chưa có dữ liệu
            </div>
          )}
        </motion.div>

        {/* Top Selling Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top món bán chạy</h2>
            <UtensilsCrossed className="w-5 h-5 text-orange-500" />
          </div>
          {topSelling.length > 0 ? (
            <div className="space-y-3">
              {topSelling.map((item, i) => {
                const maxQty = topSelling[0]?.quantity || 1
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm font-medium text-orange-600 ml-2">{item.quantity}</p>
                      </div>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(item.quantity / maxQty) * 100}%`,
                            backgroundColor: `hsl(${25 + i * 15}, 90%, 55%)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Chưa có dữ liệu
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
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
              {filteredOrders.slice(0, 8).map((order) => {
                const statusColor = ORDER_STATUS_COLORS[order.status] || '#6b7280'
                return (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 font-medium text-gray-900">#{order._id?.slice(-8).toUpperCase()}</td>
                    <td className="py-3 text-gray-600">{order.fullName || order.user?.name || 'Khách'}</td>
                    <td className="py-3 text-primary font-medium">{formatCurrency(order.total)}</td>
                    <td className="py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                )
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Chưa có đơn hàng nào trong khoảng thời gian này
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
