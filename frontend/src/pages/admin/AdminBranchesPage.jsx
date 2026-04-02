import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Search, MapPin, ExternalLink, Clock, Truck, Store, Utensils, Phone, Mail } from 'lucide-react'
import axiosClient from '../../api/axiosClient'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const SERVICE_MODES = [
  { key: 'delivery', label: 'Giao hàng', icon: Truck },
  { key: 'pickup', label: 'Lấy tại cửa hàng', icon: Store },
  { key: 'dineIn', label: 'Ăn tại bàn', icon: Utensils },
]

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    isActive: true,
    serviceModes: ['delivery', 'pickup', 'dineIn'],
    openTime: '08:00',
    closeTime: '22:00',
  })

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    setLoading(true)
    try {
      const res = await axiosClient.get('/branches')
      let data = res.data.data || res.data || []
      if (search) {
        data = data.filter(
          (b) =>
            b.name?.toLowerCase().includes(search.toLowerCase()) ||
            b.address?.toLowerCase().includes(search.toLowerCase())
        )
      }
      setBranches(data)
    } catch (error) {
      console.error('Failed to fetch branches', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (formData.phone && !/^(0[0-9]{9,10})$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0, 10-11 số)'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ'
    }
    if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
      errors.latitude = 'Vĩ độ phải từ -90 đến 90'
    }
    if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
      errors.longitude = 'Kinh độ phải từ -180 đến 180'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = () => {
    setEditingBranch(null)
    setFormErrors({})
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      latitude: '',
      longitude: '',
      isActive: true,
      serviceModes: ['delivery', 'pickup', 'dineIn'],
      openTime: '08:00',
      closeTime: '22:00',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (branch) => {
    setEditingBranch(branch)
    setFormErrors({})
    setFormData({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      latitude: branch.latitude || '',
      longitude: branch.longitude || '',
      isActive: branch.isActive ?? true,
      serviceModes: branch.serviceModes || ['delivery', 'pickup', 'dineIn'],
      openTime: branch.openTime || '08:00',
      closeTime: branch.closeTime || '22:00',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setFormLoading(true)
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        isActive: formData.isActive,
        serviceModes: formData.serviceModes,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
      }
      if (editingBranch) {
        await axiosClient.put(`/branches/${editingBranch._id}`, payload)
        toast.success('Cập nhật chi nhánh thành công')
      } else {
        await axiosClient.post('/branches', payload)
        toast.success('Tạo chi nhánh thành công')
      }
      setIsModalOpen(false)
      fetchBranches()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleServiceMode = (mode) => {
    setFormData(prev => {
      const modes = prev.serviceModes.includes(mode)
        ? prev.serviceModes.filter(m => m !== mode)
        : [...prev.serviceModes, mode]
      return { ...prev, serviceModes: modes }
    })
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await axiosClient.delete(`/branches/${deleteId}`)
      toast.success('Xóa chi nhánh thành công')
      setDeleteId(null)
      fetchBranches()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa thất bại')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openGoogleMaps = (branch) => {
    if (branch.latitude && branch.longitude) {
      window.open(`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`, '_blank')
    } else if (branch.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý chi nhánh</h1>
            <p className="text-gray-500 text-sm">{branches.length} chi nhánh trong hệ thống</p>
          </div>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          Thêm chi nhánh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm chi nhánh..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : branches.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Chưa có chi nhánh nào"
            description="Thêm chi nhánh đầu tiên của bạn"
            actionLabel="Thêm chi nhánh"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Tên chi nhánh</th>
                  <th className="px-4 py-3 font-medium">Địa chỉ</th>
                  <th className="px-4 py-3 font-medium">Liên hệ</th>
                  <th className="px-4 py-3 font-medium">Giờ mở cửa</th>
                  <th className="px-4 py-3 font-medium">Dịch vụ</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <motion.tr
                    key={branch._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-gray-900">{branch.name}</span>
                      </div>
                      {(branch.latitude || branch.longitude) && (
                        <button
                          onClick={() => openGoogleMaps(branch)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-0.5 ml-6"
                        >
                          <ExternalLink className="w-3 h-3" /> Bản đồ
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <span className="line-clamp-2">{branch.address}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {branch.phone && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs">{branch.phone}</span>
                          </div>
                        )}
                        {branch.email && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs truncate max-w-[140px]">{branch.email}</span>
                          </div>
                        )}
                        {!branch.phone && !branch.email && (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium">
                          {branch.openTime || '08:00'} - {branch.closeTime || '22:00'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(branch.serviceModes || ['delivery', 'pickup', 'dineIn']).map(mode => {
                          const modeConfig = SERVICE_MODES.find(m => m.key === mode)
                          if (!modeConfig) return null
                          const Icon = modeConfig.icon
                          return (
                            <span
                              key={mode}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                              title={modeConfig.label}
                            >
                              <Icon className="w-3 h-3" />
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {branch.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Tạm đóng cửa
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(branch._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? 'Chỉnh sửa chi nhánh' : 'Tạo chi nhánh mới'}
        size="md"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 order-2 sm:order-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="branch-form"
              loading={formLoading}
              className="flex-1 order-1 sm:order-2"
            >
              {editingBranch ? 'Lưu thay đổi' : 'Tạo chi nhánh'}
            </Button>
          </div>
        }
      >
        <form id="branch-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên chi nhánh"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Chi nhánh Quận 1"
            required
          />
          <Input
            label="Địa chỉ"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Điện thoại"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="09xxxxxxxx"
                error={formErrors.phone}
              />
            </div>
            <div>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="branch@example.com"
                error={formErrors.email}
              />
            </div>
          </div>

          {/* Operating hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Giờ mở cửa
              </div>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="time"
                value={formData.openTime}
                onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                label="Mở cửa"
              />
              <Input
                type="time"
                value={formData.closeTime}
                onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                label="Đóng cửa"
              />
            </div>
          </div>

          {/* Service modes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình thức phục vụ
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SERVICE_MODES.map(mode => {
                const Icon = mode.icon
                const isActive = formData.serviceModes.includes(mode.key)
                return (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => handleToggleServiceMode(mode.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{mode.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Coordinates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                Tọa độ (tùy chọn)
              </div>
            </label>
            <p className="text-xs text-gray-400 mb-2">Dùng cho hiển thị bản đồ chi nhánh</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Vĩ độ (Latitude)"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="VD: 10.7769"
                  error={formErrors.latitude}
                />
              </div>
              <div>
                <Input
                  label="Kinh độ (Longitude)"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="VD: 106.7009"
                  error={formErrors.longitude}
                />
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Chi nhánh đang hoạt động
            </label>
            {!formData.isActive && (
              <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                Tạm đóng cửa
              </span>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Xóa chi nhánh"
        message="Bạn có chắc chắn muốn xóa chi nhánh này?"
        confirmLabel="Xóa"
        loading={deleteLoading}
      />
    </div>
  )
}
