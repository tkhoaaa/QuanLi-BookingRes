import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FileText,
  Download,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react'
import { fetchAuditLogs, exportAuditLogs, setFilters, resetFilters } from '../../slices/auditSlice'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

const ACTION_COLORS = {
  Created: 'bg-green-100 text-green-700',
  Updated: 'bg-blue-100 text-blue-700',
  Deleted: 'bg-red-100 text-red-700',
}

const ACTION_ICONS = {
  Created: Plus,
  Updated: Edit2,
  Deleted: Trash2,
}

const RESOURCE_COLORS = {
  Order: 'text-orange-600',
  Food: 'text-green-600',
  User: 'text-purple-600',
  Promo: 'text-pink-600',
  Category: 'text-teal-600',
  Branch: 'text-indigo-600',
}

const PAGE_SIZE = 15

export default function AdminAuditLogPage() {
  const dispatch = useDispatch()
  const { logs, loading, pagination, filters } = useSelector((state) => state.audit)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    dispatch(fetchAuditLogs({ page, limit: PAGE_SIZE, filters }))
  }, [page, filters, dispatch])

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }))
    setPage(1)
  }

  const handleReset = () => {
    dispatch(resetFilters())
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await dispatch(exportAuditLogs(filters)).unwrap()
      // Download the blob
      const url = URL.createObjectURL(result)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Đã xuất file CSV thành công')
    } catch (err) {
      toast.error('Xuất file thất bại')
    } finally {
      setExporting(false)
    }
  }

  const actionOptions = [
    { value: '', label: 'Tất cả hành động' },
    { value: 'Created', label: 'Tạo mới' },
    { value: 'Updated', label: 'Cập nhật' },
    { value: 'Deleted', label: 'Xóa' },
  ]

  const resourceOptions = [
    { value: '', label: 'Tất cả tài nguyên' },
    { value: 'Order', label: 'Đơn hàng' },
    { value: 'Food', label: 'Món ăn' },
    { value: 'User', label: 'Người dùng' },
    { value: 'Promo', label: 'Mã giảm giá' },
    { value: 'Category', label: 'Danh mục' },
    { value: 'Branch', label: 'Chi nhánh' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nhật ký hệ thống</h1>
              <p className="text-gray-500 text-sm">Theo dõi mọi thay đổi trong hệ thống</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExport}
            loading={exporting}
          >
            Xuất CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => dispatch(fetchAuditLogs({ page, limit: PAGE_SIZE, filters }))}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Action Type Filter */}
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Resource Filter */}
          <select
            value={filters.resource}
            onChange={(e) => handleFilterChange('resource', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {resourceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Từ ngày"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Đến ngày"
            />
          </div>

          {(filters.action || filters.resource || filters.startDate || filters.endDate) && (
            <button
              onClick={handleReset}
              className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={PAGE_SIZE} columns={5} />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Không có bản ghi nào</p>
            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc quay lại sau</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Thời gian</th>
                  <th className="px-4 py-3 font-medium">Người thực hiện</th>
                  <th className="px-4 py-3 font-medium">Hành động</th>
                  <th className="px-4 py-3 font-medium">Tài nguyên</th>
                  <th className="px-4 py-3 font-medium">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  const ActionIcon = ACTION_ICONS[log.action] || Edit2
                  return (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        <div>{new Date(log.timestamp).toLocaleDateString('vi-VN')}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-medium">
                            {log.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{log.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{log.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                          <ActionIcon className="w-3 h-3" />
                          {log.action === 'Created' ? 'Tạo mới' : log.action === 'Updated' ? 'Cập nhật' : 'Xóa'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${RESOURCE_COLORS[log.resource] || 'text-gray-700'}`}>
                          {log.resource}
                        </span>
                        {log.resourceId && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            #{log.resourceId.slice(-8).toUpperCase()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <p>{log.details?.summary || '-'}</p>
                        {log.details?.field && (
                          <p className="text-xs text-gray-400 mt-1">
                            {log.details.field}: {log.details.oldValue || '(rỗng)'} → {log.details.newValue || '(rỗng)'}
                          </p>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > PAGE_SIZE && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages || 1}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
