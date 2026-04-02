import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Tag, Plus, Edit2, Trash2, UtensilsCrossed, Search } from 'lucide-react'
import { CATEGORIES } from '../../constants'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import axiosClient from '../../api/axiosClient'

// Category icons map
const CATEGORY_ICONS = {
  'mon-chinh': '🍲',
  'mon-phu': '🥗',
  'do-uong': '🥤',
  'trang-mieng': '🍰',
  'mon-nhanh': '🍔',
  'combo': '📦',
}

// Default icon for custom categories
const DEFAULT_ICONS = ['🍕', '🍜', '🍱', '🍣', '🥘', '🍛', '🥡', '🫕', '🍲', '🥩', '🍗', '🥗']

export default function AdminCategoriesPage() {
  const dispatch = useDispatch()
  const { foods } = useSelector((state) => state.foods)
  const [categories, setCategories] = useState(CATEGORIES.map(c => ({ ...c, icon: CATEGORY_ICONS[c.value] || '📁' })))
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', value: '', icon: '📁' })
  const [foodCounts, setFoodCounts] = useState({})

  useEffect(() => {
    // Compute food counts per category from loaded foods
    const counts = {}
    foods.forEach(food => {
      const cat = food.category || food.categoryName
      if (cat) {
        const found = CATEGORIES.find(c => c.label === cat || c.value === cat)
        if (found) {
          counts[found.value] = (counts[found.value] || 0) + 1
        }
      }
    })
    setFoodCounts(counts)
  }, [foods])

  const filteredCategories = categories.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.value.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({ name: '', value: '', icon: DEFAULT_ICONS[Math.floor(Math.random() * DEFAULT_ICONS.length)] })
    setIsModalOpen(true)
  }

  const handleEdit = (cat) => {
    setEditingCategory(cat)
    setFormData({ name: cat.label, value: cat.value, icon: cat.icon || '📁' })
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      // If backend supports category deletion, call it
      // await axiosClient.delete(`/categories/${deleteId}`)
      setCategories(prev => prev.filter(c => c.value !== deleteId))
      toast.success('Xóa danh mục thành công')
      setDeleteId(null)
    } catch (error) {
      toast.error('Xóa thất bại')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.value.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }

    const slugValue = formData.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    setFormLoading(true)
    try {
      if (editingCategory) {
        setCategories(prev => prev.map(c =>
          c.value === editingCategory.value
            ? { ...c, label: formData.name.trim(), value: slugValue, icon: formData.icon }
            : c
        ))
        toast.success('Cập nhật danh mục thành công')
      } else {
        if (categories.find(c => c.value === slugValue)) {
          toast.error('Danh mục đã tồn tại')
          setFormLoading(false)
          return
        }
        setCategories(prev => [...prev, { label: formData.name.trim(), value: slugValue, icon: formData.icon }])
        toast.success('Thêm danh mục thành công')
      }
      setIsModalOpen(false)
    } catch (error) {
      toast.error(error || 'Lưu thất bại')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
            <p className="text-gray-500 text-sm">{categories.length} danh mục trong hệ thống</p>
          </div>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          Thêm danh mục
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm danh mục..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-20 text-center">
          <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Không có danh mục nào</p>
          <Button onClick={handleCreate} icon={Plus} className="mt-4">
            Thêm danh mục đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat, index) => (
            <motion.div
              key={cat.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{cat.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.value)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>{foodCounts[cat.value] || 0} món</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  (foodCounts[cat.value] || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {(foodCounts[cat.value] || 0) > 0 ? 'Đang sử dụng' : 'Chưa sử dụng'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
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
              form="category-form"
              loading={formLoading}
              className="flex-1 order-1 sm:order-2"
            >
              {editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}
            </Button>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Biểu tượng</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all flex items-center justify-center ${
                    formData.icon === emoji
                      ? 'border-primary bg-primary/5 scale-110'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Chọn biểu tượng cho danh mục</p>
          </div>

          <Input
            label="Tên danh mục"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VD: Món Chính"
            required
          />

          <Input
            label="Giá trị (slug)"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="VD: mon-chinh"
            required
          />
          <p className="text-xs text-gray-400 -mt-2">
            Giá trị này dùng làm định danh, chỉ gồm chữ thường và dấu gạch ngang
          </p>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này? Các món ăn trong danh mục này sẽ không bị xóa."
        confirmLabel="Xóa"
        loading={deleteLoading}
      />
    </div>
  )
}
