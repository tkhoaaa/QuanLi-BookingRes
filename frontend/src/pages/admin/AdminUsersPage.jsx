import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Search, Shield, Users, RefreshCw, Download } from 'lucide-react'
import axiosClient from '../../api/axiosClient'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const dispatch = useDispatch()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosClient.get('/admin/users')
      let data = res.data.data?.users || res.data?.users || []
      if (search) {
        data = data.filter(
          (u) =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        )
      }
      setUsers(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng')
      toast.error('Tải danh sách người dùng thất bại')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleExport = () => {
    const headers = ['Tên', 'Email', 'Số điện thoại', 'Vai trò', 'Ngày tạo']
    const rows = users.map(u => [
      u.name,
      u.email,
      u.phone || '',
      u.role === 'admin' ? 'Quản trị' : u.role === 'shipper' ? 'Shipper' : 'Khách hàng',
      formatDate(u.createdAt),
    ])
    const csv = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nguoi-dung-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Đã xuất file CSV')
  }

  const roleColors = {
    admin: 'danger',
    shipper: 'info',
    customer: 'default',
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="text-gray-500 text-sm">{users.length} người dùng trong hệ thống</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
            Xuất CSV
          </Button>
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchUsers}>
            Làm mới
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm người dùng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={8} columns={5} />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <Button onClick={fetchUsers} icon={RefreshCw} size="sm">
              Thử lại
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Không có người dùng nào</h3>
            <p className="text-gray-500 text-sm">Thử thay đổi từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Người dùng</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Số điện thoại</th>
                  <th className="px-4 py-3 font-medium">Vai trò</th>
                  <th className="px-4 py-3 font-medium">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600">{user.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleColors[user.role] || 'default'}>
                        {user.role === 'admin' && <Shield className="w-3 h-3 inline mr-1" />}
                        {user.role === 'shipper' ? 'Shipper' : user.role === 'customer' ? 'Khách hàng' : user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
