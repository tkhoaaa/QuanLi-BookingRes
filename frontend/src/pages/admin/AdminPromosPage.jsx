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
      const res = await axiosClient.get('/promos')
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
        await axiosClient.put(`/promos/${editingPromo._id}`, payload)
        toast.success('Cap nhat ma giam gia thanh cong')
      } else {
        await axiosClient.post('/promos', payload)
        toast.success('Tao ma giam gia thanh cong')
      }
      setIsModalOpen(false)
      fetchPromos()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Luu that bai')
    } finally {
      setFormLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await axiosClient.delete(`/promos/${deleteId}`)
      toast.success('Xoa ma giam gia thanh cong')
      setDeleteId(null)
      fetchPromos()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xoa that bai')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quan ly ma giam gia</h1>
          <p className="text-gray-500 text-sm mt-1">{promos.length} ma giam gia</p>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          Them ma giam gia
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tim ma giam gia..."
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
            title="Chua co ma giam gia nao"
            description="Tao ma giam gia dau tien de thu hut khach hang"
            actionLabel="Them ma giam gia"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Ma</th>
                  <th className="px-4 py-3 font-medium">Giam gia</th>
                  <th className="px-4 py-3 font-medium">Don hang toi thieu</th>
                  <th className="px-4 py-3 font-medium">Su dung</th>
                  <th className="px-4 py-3 font-medium">Han su dung</th>
                  <th className="px-4 py-3 font-medium">Hanh dong</th>
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
        title={editingPromo ? 'Chinh sua ma giam gia' : 'Tao ma giam gia moi'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ma giam gia"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="VD: SUMMER2026"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gia tri giam"
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              required
            />
            <Select
              label="Loai giam gia"
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              options={[
                { value: 'percent', label: 'Phan tram (%)' },
                { value: 'fixed', label: 'So tien (VND)' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Don hang toi thieu (VND)"
              type="number"
              value={formData.minOrder}
              onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Giam toi da (VND)"
              type="number"
              value={formData.maxDiscount}
              onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
              placeholder="Tuy chon"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="So lan su dung toi da"
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="Khong gioi han"
            />
            <Input
              label="Han su dung"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
              Huy
            </Button>
            <Button type="submit" loading={formLoading} className="flex-1">
              {editingPromo ? 'Luu thay doi' : 'Tao ma giam gia'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Xoa ma giam gia"
        message="Ban co chac chan muon xoa ma giam gia nay?"
        confirmLabel="Xoa"
        loading={deleteLoading}
      />
    </div>
  )
}
