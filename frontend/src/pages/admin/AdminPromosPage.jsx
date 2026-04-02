import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Search, Ticket } from 'lucide-react'
import axiosClient from '../../api/axiosClient'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminPromosPage() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    discountType: 'percent',
    minOrder: '',
    maxDiscount: '',
    expiresAt: '',
    usageLimit: '',
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchPromos()
  }, [search])

  const fetchPromos = async () => {
    setLoading(true)
    try {
      const res = await axiosClient.get('/coupons')
      let data = res.data.data || res.data || []
      if (search) {
        data = data.filter((p) => p.code?.toLowerCase().includes(search.toLowerCase()))
      }
      setPromos(data)
    } catch (error) {
      console.error('Failed to fetch promos', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPromo(null)
    setFormData({
      code: '',
      discount: '',
      discountType: 'percent',
      minOrder: '',
      maxDiscount: '',
      expiresAt: '',
      usageLimit: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (promo) => {
    setEditingPromo(promo)
    setFormData({
      code: promo.code || '',
      discount: promo.discount || '',
      discountType: promo.discountType || 'percent',
      minOrder: promo.minOrder || '',
      maxDiscount: promo.maxDiscount || '',
      expiresAt: promo.expiresAt ? promo.expiresAt.split('T')[0] : '',
      usageLimit: promo.usageLimit || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const payload = {
        ...formData,
        discount: Number(formData.discount),
        minOrder: formData.minOrder ? Number(formData.minOrder) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      }

      if (editingPromo) {
        await axiosClient.put(`/coupons/${editingPromo._id}`, payload)
        toast.success('Cập nhật mã giảm giá thành công')
      } else {
        await axiosClient.post('/coupons', payload)
        toast.success('Tạo mã giảm giá thành công')
      }
      setIsModalOpen(false)
      fetchPromos()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại')
    } finally {
      setFormLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await axiosClient.delete(`/coupons/${deleteId}`)
      toast.success('Xóa mã giảm giá thành công')
      setDeleteId(null)
      fetchPromos()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa thất bại')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý mã giảm giá</h1>
          <p className="text-gray-500 text-sm mt-1">{promos.length} mã giảm giá</p>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          Tạo mã giảm giá
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm mã giảm giá..."
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
        ) : promos.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="Chưa có mã giảm giá nào"
            description="Tạo mã giảm giá đầu tiên để thu hút khách hàng"
            actionLabel="Tạo mã giảm giá"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Mã</th>
                  <th className="px-4 py-3 font-medium">Giảm giá</th>
                  <th className="px-4 py-3 font-medium">Đơn hàng tối thiểu</th>
                  <th className="px-4 py-3 font-medium">Sử dụng</th>
                  <th className="px-4 py-3 font-medium">Hạn sử dụng</th>
                  <th className="px-4 py-3 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => (
                  <motion.tr
                    key={promo._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-primary">{promo.code}</td>
                    <td className="px-4 py-3">
                      {promo.discountType === 'percent'
                        ? `${promo.discount}%`
                        : `${promo.discount.toLocaleString()} VND`}
                      {promo.maxDiscount && (
                        <span className="text-xs text-gray-400 ml-1">
                          (max {promo.maxDiscount.toLocaleString()})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {promo.minOrder ? `${promo.minOrder.toLocaleString()} VND` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {promo.usedCount || 0} / {promo.usageLimit || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(promo.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(promo)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(promo._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        title={editingPromo ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
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
              form="promo-form"
              loading={formLoading}
              className="flex-1 order-1 sm:order-2"
            >
              {editingPromo ? 'Lưu thay đổi' : 'Tạo mã giảm giá'}
            </Button>
          </div>
        }
      >
        <form id="promo-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mã giảm giá"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: SUMMER2026"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Giá trị giảm"
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              required
            />
            <Select
              label="Loại giảm giá"
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              options={[
                { value: 'percent', label: 'Phần trăm (%)' },
                { value: 'fixed', label: 'Số tiền (VND)' },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Đơn hàng tối thiểu (VND)"
              type="number"
              value={formData.minOrder}
              onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Giảm tối đa (VND)"
              type="number"
              value={formData.maxDiscount}
              onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
              placeholder="Tùy chọn"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Số lần sử dụng tối đa"
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="Không giới hạn"
            />
            <Input
              label="Hạn sử dụng"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Xóa mã giảm giá"
        message="Bạn có chắc chắn muốn xóa mã giảm giá này?"
        confirmLabel="Xóa"
        loading={deleteLoading}
      />
    </div>
  )
}
