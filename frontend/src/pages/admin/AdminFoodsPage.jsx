import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Search, Image as ImageIcon } from 'lucide-react'
import { fetchFoods, createFood, updateFood, deleteFood } from '../../slices/foodsSlice'
import FoodFormModal from '../../features/foods/FoodFormModal'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Pagination from '../../components/ui/Pagination'
import { formatCurrency, resolveFoodImage } from '../../lib/utils'
import toast from 'react-hot-toast'

const PAGE_SIZE = 20

const availabilityFilters = [
  { value: 'all', label: 'Tất cả' },
  { value: 'true', label: 'Đang bán' },
  { value: 'false', label: 'Tạm ngừng' },
]

export default function AdminFoodsPage() {
  const dispatch = useDispatch()
  const { foods, loading, pagination } = useSelector((state) => state.foods)

  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFood, setEditingFood] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Fetch when page, search, or availability changes
  useEffect(() => {
    dispatch(fetchFoods({
      search,
      isAvailable: availability,
      page: currentPage,
      limit: PAGE_SIZE,
    }))
  }, [search, availability, currentPage, dispatch])

  const handleSearchChange = (value) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleAvailabilityChange = (value) => {
    setAvailability(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCreate = () => {
    setEditingFood(null)
    setIsModalOpen(true)
  }

  const handleEdit = (food) => {
    setEditingFood(food)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await dispatch(deleteFood(deleteId)).unwrap()
      toast.success('Xóa món ăn thành công')
      setDeleteId(null)
      dispatch(fetchFoods({ search, isAvailable: availability, page: currentPage, limit: PAGE_SIZE }))
    } catch (error) {
      toast.error(error || 'Xóa thất bại')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSubmit = async (data) => {
    setFormLoading(true)
    try {
      if (editingFood) {
        await dispatch(updateFood({ id: editingFood._id, data })).unwrap()
        toast.success('Cập nhật món ăn thành công')
      } else {
        await dispatch(createFood(data)).unwrap()
        toast.success('Thêm món ăn thành công')
      }
      setIsModalOpen(false)
      dispatch(fetchFoods({ search, isAvailable: availability, page: currentPage, limit: PAGE_SIZE }))
    } catch (error) {
      toast.error(error || 'Lưu thất bại')
    } finally {
      setFormLoading(false)
    }
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE + 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý món ăn</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} món ăn trong hệ thống</p>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          Thêm món ăn
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm món ăn..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Availability Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          {availabilityFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleAvailabilityChange(filter.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                availability === filter.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : foods.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title={availability === 'false' ? 'Không có món ăn tạm ngừng' : 'Chưa có món ăn nào'}
            description="Bắt đầu bằng việc thêm món ăn đầu tiên của bạn"
            actionLabel="Thêm món ăn"
            onAction={handleCreate}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 bg-gray-50 border-b">
                    <th className="px-4 py-3 font-medium w-12">STT</th>
                    <th className="px-4 py-3 font-medium">Hình ảnh</th>
                    <th className="px-4 py-3 font-medium">Tên món</th>
                    <th className="px-4 py-3 font-medium">Danh mục</th>
                    <th className="px-4 py-3 font-medium">Giá</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {foods.map((food, index) => (
                    <motion.tr
                      key={food._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={`border-b border-gray-50 transition-colors ${
                        !food.isAvailable ? 'bg-red-50/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs text-center">
                        {startIndex + index}
                      </td>
                      <td className="px-4 py-3">
                        <img
                          src={resolveFoodImage(food.images, 'https://via.placeholder.com/60?text=Food')}
                          alt={food.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-medium ${food.isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                          {food.name}
                        </p>
                        {food.discount && (
                          <span className="text-xs text-red-500">
                            -{Math.round(((food.price - food.discountPrice) / food.price) * 100)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{food.categoryName || food.category}</td>
                      <td className="px-4 py-3">
                        {food.discount ? (
                          <div>
                            <span className="text-primary font-medium">{formatCurrency(food.discountPrice)}</span>
                            <span className="text-gray-400 line-through text-xs ml-1">{formatCurrency(food.price)}</span>
                          </div>
                        ) : (
                          <span className="text-primary font-medium">{formatCurrency(food.price)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          food.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {food.isAvailable ? 'Đang bán' : 'Tạm ngừng'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(food)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(food._id)}
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-4 border-t bg-gray-50">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <FoodFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        food={editingFood}
        isSubmitting={formLoading}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Xóa món ăn"
        message="Bạn có chắc chắn muốn xóa món ăn này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        loading={deleteLoading}
      />
    </div>
  )
}
