import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Search, Ticket, LayoutGrid, List, TrendingUp, Clock, Users, Percent, DollarSign, Truck, AlertCircle } from 'lucide-react'
import axiosClient from '../../api/axiosClient'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { formatDate, formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminPromosPage() {
  const [promos, setPromos] = useState([])
  const [allPromos, setAllPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('card') // 'card' | 'table'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toggleId, setToggleId] = useState(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    discountType: 'percent',
    minOrder: '',
    maxDiscount: '',
    expiresAt: '',
    usageLimit: '',
    freeShipping: false,
    isActive: true,
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchPromos()
  }, [])

  const fetchPromos = async () => {
    setLoading(true)
    try {
      const res = await axiosClient.get('/coupons')
      const data = res.data.data || res.data || []
      setAllPromos(data)
      filterPromos(data, search)
    } catch (error) {
      console.error('Failed to fetch promos', error)
      setAllPromos([])
      setPromos([])
    } finally {
      setLoading(false)
    }
  }

  const filterPromos = (data, term) => {
    if (!term) {
      setPromos(data)
    } else {
      setPromos(data.filter((p) => p.code?.toLowerCase().includes(term.toLowerCase())))
    }
  }

  const handleSearchChange = (e) => {
    const term = e.target.value
    setSearch(term)
    filterPromos(allPromos, term)
  }

  const getExpiryInfo = (expiresAt) => {
    if (!expiresAt) return { label: 'Không giới hạn', urgent: false, expired: false }
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry - now
    if (diff < 0) return { label: 'Đã hết hạn', urgent: false, expired: true }
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days <= 3) return { label: `Còn ${days} ngày`, urgent: true, expired: false }
    if (days <= 7) return { label: `Còn ${days} ngày`, urgent: false, expired: false }
    return { label: `Còn ${days} ngày`, urgent: false, expired: false }
  }

  const handleToggleActive = async (promo) => {
    setToggleId(promo._id)
    setToggleLoading(true)
    try {
      await axiosClient.put(`/coupons/${promo._id}`, { isActive: !promo.isActive })
      toast.success(promo.isActive ? 'Đã vô hiệu hóa mã giảm giá' : 'Đã kích hoạt mã giảm giá')
      fetchPromos()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setToggleId(promo._id)
      setToggleLoading(false)
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
      freeShipping: false,
      isActive: true,
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
      freeShipping: promo.freeShipping || false,
      isActive: promo.isActive !== false,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const payload = {
        code: formData.code,
        discount: Number(formData.discount),
        discountType: formData.discountType,
        minOrder: formData.minOrder ? Number(formData.minOrder) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        freeShipping: formData.freeShipping,
        isActive: formData.isActive,
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

  const getDiscountPreview = () => {
    if (!formData.discount) return null
    const val = Number(formData.discount)
    if (formData.discountType === 'percent') {
      return `Giảm ${val}%${formData.maxDiscount ? ` tối đa ${formatCurrency(Number(formData.maxDiscount))}` : ''}`
    }
    return `Giảm ${formatCurrency(val)}`
  }

  const renderPromoCard = (promo) => {
    const expiry = getExpiryInfo(promo.expiresAt)
    const usedCount = promo.usedCount || 0
    const limit = promo.usageLimit
    const usagePct = limit ? Math.min((usedCount / limit) * 100, 100) : 0
    const isPercent = promo.discountType === 'percent'
    const isInactive = promo.isActive === false || expiry.expired

    return (
      <motion.div
        key={promo._id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl p-5 text-white relative overflow-hidden ${
          isInactive
            ? 'bg-gray-400'
            : isPercent
              ? 'bg-gradient-to-br from-orange-400 to-red-500'
              : 'bg-gradient-to-br from-blue-400 to-indigo-600'
        }`}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-8 translate-x-8 bg-white" />
        <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full opacity-10 translate-y-6 -translate-x-4 bg-white" />

        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1">
              {isPercent ? 'Giảm theo %' : 'Giảm cố định'}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                {isPercent ? `${promo.discount}%` : formatCurrency(promo.discount)}
              </span>
              {promo.maxDiscount && isPercent && (
                <span className="text-xs opacity-75">max {formatCurrency(promo.maxDiscount)}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isInactive ? 'bg-white/30 text-white' : 'bg-white/20 text-white'
            }`}>
              {expiry.expired ? 'Hết hạn' : isInactive ? 'Tắt' : 'Hoạt động'}
            </span>
            {promo.freeShipping && (
              <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                <Truck className="w-3 h-3" /> Free ship
              </span>
            )}
          </div>
        </div>

        {/* Code */}
        <div className="bg-white/15 rounded-lg px-3 py-2 mb-4 text-center">
          <span className="text-lg font-bold font-mono tracking-wider">{promo.code}</span>
        </div>

        {/* Meta info */}
        <div className="space-y-2 text-sm">
          {promo.minOrder > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 opacity-70" />
              <span>Đơn tối thiểu: <strong>{formatCurrency(promo.minOrder)}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 opacity-70" />
            <span className={expiry.urgent && !expiry.expired ? 'font-medium' : ''}>
              {expiry.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 opacity-70" />
            <span>{usedCount} / {limit || '\u221e'} lần sử dụng</span>
          </div>
        </div>

        {/* Usage progress bar */}
        {limit && (
          <div className="mt-3">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/20">
          <button
            onClick={() => handleEdit(promo)}
            className="flex-1 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" /> Sửa
          </button>
          <button
            onClick={() => handleToggleActive(promo)}
            disabled={toggleLoading && toggleId === promo._id}
            className={`py-1.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              promo.isActive && !expiry.expired
                ? 'bg-white/15 hover:bg-white/25 text-white'
                : 'bg-white/30 hover:bg-white/40 text-white'
            }`}
          >
            {promo.isActive && !expiry.expired ? 'Tắt' : 'Bật'}
          </button>
          <button
            onClick={() => setDeleteId(promo._id)}
            className="py-1.5 px-3 bg-white/15 hover:bg-red-500/60 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <Ticket className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý mã giảm giá</h1>
            <p className="text-gray-500 text-sm">{allPromos.length} mã giảm giá trong hệ thống</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={handleCreate} icon={Plus}>
            Tạo mã giảm giá
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm mã giảm giá..."
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Content */}
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
        ) : viewMode === 'card' ? (
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {promos.map(renderPromoCard)}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Mã</th>
                  <th className="px-4 py-3 font-medium">Giảm giá</th>
                  <th className="px-4 py-3 font-medium">Miễn phí giao</th>
                  <th className="px-4 py-3 font-medium">Đơn tối thiểu</th>
                  <th className="px-4 py-3 font-medium">Sử dụng</th>
                  <th className="px-4 py-3 font-medium">Hạn</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((promo) => {
                  const expiry = getExpiryInfo(promo.expiresAt)
                  const isInactive = promo.isActive === false || expiry.expired
                  return (
                    <motion.tr
                      key={promo._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-primary">{promo.code}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {promo.discountType === 'percent' ? (
                            <Percent className="w-3.5 h-3.5 text-orange-500" />
                          ) : (
                            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                          )}
                          <span className="font-medium">
                            {promo.discountType === 'percent'
                              ? `${promo.discount}%`
                              : formatCurrency(promo.discount)}
                          </span>
                          {promo.maxDiscount && promo.discountType === 'percent' && (
                            <span className="text-xs text-gray-400">max {formatCurrency(promo.maxDiscount)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {promo.freeShipping ? (
                          <Truck className="w-4 h-4 text-green-600" />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {promo.minOrder ? formatCurrency(promo.minOrder) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {promo.usedCount || 0} / {promo.usageLimit || '\u221e'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Clock className={`w-3.5 h-3.5 ${expiry.urgent ? 'text-amber-500' : 'text-gray-400'}`} />
                          <span className={expiry.urgent && !expiry.expired ? 'text-amber-600 font-medium' : 'text-gray-500'}>
                            {expiry.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isInactive
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isInactive ? 'Tắt / Hết hạn' : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(promo)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(promo)}
                            disabled={toggleLoading && toggleId === promo._id}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {promo.isActive && !expiry.expired ? (
                              <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">Tắt</span>
                            ) : (
                              <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-medium">Bật</span>
                            )}
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
                  )
                })}
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

          {/* Type selector with visual toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại giảm giá</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discountType: 'percent', discount: '' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  formData.discountType === 'percent'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Percent className="w-6 h-6" />
                <span className="text-sm font-medium">Phần trăm (%)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, discountType: 'fixed', discount: '' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  formData.discountType === 'fixed'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-6 h-6" />
                <span className="text-sm font-medium">Số tiền cố định</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Giá trị giảm ${formData.discountType === 'percent' ? '(%)' : '(VND)'}`}
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              required
              placeholder={formData.discountType === 'percent' ? 'VD: 20' : 'VD: 50000'}
            />
            {formData.discountType === 'percent' && (
              <Input
                label="Giảm tối đa (VND)"
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                placeholder="Tùy chọn"
              />
            )}
          </div>

          {/* Discount preview */}
          {getDiscountPreview() && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">{getDiscountPreview()}</span>
            </div>
          )}

          <Input
            label="Đơn hàng tối thiểu (VND)"
            type="number"
            value={formData.minOrder}
            onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
            placeholder="0 - Không yêu cầu"
          />

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

          {/* Free shipping toggle */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="freeShipping"
              checked={formData.freeShipping}
              onChange={(e) => setFormData({ ...formData, freeShipping: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="freeShipping" className="flex items-center gap-2 text-sm text-gray-700">
              <Truck className="w-4 h-4 text-gray-500" />
              Miễn phí giao hàng khi áp dụng
            </label>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isActivePromo"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="isActivePromo" className="flex items-center gap-2 text-sm text-gray-700">
              {formData.isActive ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Hoạt động</span>
              ) : (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Tắt</span>
              )}
              Kích hoạt mã giảm giá này
            </label>
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
