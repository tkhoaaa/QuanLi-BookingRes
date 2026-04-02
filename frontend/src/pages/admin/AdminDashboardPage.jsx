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
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
  MapPin,
  GitCompare,
  BarChart2,
  X,
} from 'lucide-react'
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { fetchAnalyticsOverview } from '../../slices/analyticsSlice'
import { fetchAllOrders } from '../../slices/ordersSlice'
import { formatCurrency } from '../../lib/utils'
import axiosClient from '../../api/axiosClient'
import { CATEGORIES } from '../../constants'

const DATE_RANGES = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
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
  const { overview, revenueChart, topItems, categoryRevenue, statusStats, branchComparison, loading, currentRange, currentBranchId } = useSelector((state) => state.analytics)
  const { orders } = useSelector((state) => state.orders)
  const { foods } = useSelector((state) => state.foods)
  const [dateRange, setDateRange] = useState('7d')
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [showCompare, setShowCompare] = useState(false)

  useEffect(() => {
    axiosClient.get('/branches').then(res => {
      setBranches(res.data.data || [])
    }).catch(() => setBranches([]))
  }, [])

  useEffect(() => {
    dispatch(fetchAnalyticsOverview({ range: dateRange, branchId: selectedBranchId }))
    dispatch(fetchAllOrders({ limit: 500 }))
  }, [dispatch, dateRange, selectedBranchId])

  // Chart data from API
  const chartData = revenueChart.map(d => ({
    day: d.label,
    shortDay: d.shortLabel,
    revenue: d.revenue,
    orders: d.orderCount,
  }))

  // Category data from API
  const categoryData = categoryRevenue?.categories?.map((cat, i) => ({
    name: CATEGORIES.find(c => c.value === cat.category)?.label || cat.category,
    value: cat.revenue,
    percent: cat.percent,
  })) || []

  // Top selling items from API
  const topSelling = topItems.map(item => ({
    name: item.name,
    quantity: item.quantity,
    category: item.category,
  }))

  // Status data from API
  const statusData = statusStats

  const stats = {
    totalRevenue: overview?.totalRevenue || 0,
    totalOrders: overview?.totalOrders || 0,
    totalUsers: overview?.totalUsers || 0,
    totalFoods: overview?.totalFoods || 0,
    avgOrderValue: overview?.avgOrderValue || 0,
    revenueGrowth: overview?.revenueGrowth || 0,
    ordersGrowth: overview?.ordersGrowth || 0,
    avgGrowth: overview?.avgGrowth || 0,
  }

  // Mini bar data for stat cards
  const statCards = [
    {
      label: 'Doanh thu',
      value: formatCurrency(stats.totalRevenue),
      sub: `${dateRange === 'today' ? 'Hôm nay' : dateRange === '7d' ? '7 ngày qua' : '30 ngày qua'}`,
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

  const selectedBranchName = selectedBranchId
    ? branches.find(b => b._id === selectedBranchId)?.name
    : null

  return (
    <div className="space-y-6">
      {/* Header + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            {selectedBranchName && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-lg font-semibold text-orange-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedBranchName}
                </span>
              </>
            )}
            {!selectedBranchName && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-sm font-medium text-gray-500">Tất cả chi nhánh</span>
              </>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Tổng quan hệ thống</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector */}
          {branches.length > 0 && (
            <>
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="text-sm border-0 bg-transparent focus:outline-none cursor-pointer text-gray-700"
                >
                  <option value="">Tất cả chi nhánh</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
                {selectedBranchId && (
                  <button
                    onClick={() => setSelectedBranchId('')}
                    className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Compare Toggle */}
              <button
                onClick={() => setShowCompare(!showCompare)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  showCompare
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <GitCompare className="w-4 h-4" />
                So sánh chi nhánh
              </button>
            </>
          )}

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
                {loading ? 'Đang tải...' : dateRange === 'today' ? 'Hôm nay' : dateRange === '7d' ? '7 ngày qua' : '30 ngày qua'}
              </p>
            </div>
            <RechartsBarChart3 className="w-5 h-5 text-orange-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsBarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey={dateRange === '30d' ? 'day' : 'shortDay'} fontSize={11} tickLine={false} />
              <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#f97316" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
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
                {loading ? 'Đang tải...' : dateRange === 'today' ? 'Hôm nay' : dateRange === '7d' ? '7 ngày qua' : '30 ngày qua'}
              </p>
            </div>
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsBarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey={dateRange === '30d' ? 'day' : 'shortDay'} fontSize={11} tickLine={false} />
              <YAxis fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Đơn hàng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
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

      {/* Branch Comparison */}
      {showCompare && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">So sánh chi nhánh</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Top chi nhánh theo doanh thu | {DATE_RANGES.find(r => r.value === dateRange)?.label}
              </p>
            </div>
            <BarChart2 className="w-5 h-5 text-purple-500" />
          </div>
          {branchComparison && branchComparison.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <RechartsBarChart
                  data={branchComparison.map(b => ({
                    name: b.branchName,
                    shortName: b.branchName.length > 12 ? b.branchName.substring(0, 12) + '...' : b.branchName,
                    revenue: b.revenue,
                    orders: b.orderCount,
                  }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="shortName" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
              {/* Branch comparison table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Chi nhánh</th>
                      <th className="pb-2 font-medium text-right">Doanh thu</th>
                      <th className="pb-2 font-medium text-right">Đơn hàng</th>
                      <th className="pb-2 font-medium text-right">TB / Đơn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchComparison.slice(0, 5).map((branch, i) => (
                      <tr key={branch.branchId} className="border-b border-gray-50">
                        <td className="py-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                            i === 1 ? 'bg-gray-100 text-gray-600' :
                            i === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="py-2 font-medium text-gray-900">{branch.branchName}</td>
                        <td className="py-2 text-right text-primary font-medium">{formatCurrency(branch.revenue)}</td>
                        <td className="py-2 text-right text-gray-600">{branch.orderCount}</td>
                        <td className="py-2 text-right text-gray-500">{formatCurrency(branch.avgOrderValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Chưa có dữ liệu chi nhánh
            </div>
          )}
        </motion.div>
      )}

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
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.slice(0, 8).map((order) => {
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
                })
              ) : (
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
