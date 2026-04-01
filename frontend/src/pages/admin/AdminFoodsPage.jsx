import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Search, Image as ImageIcon } from 'lucide-react'
import { fetchFoods, createFood, updateFood, deleteFood } from '../../slices/foodsSlice'
import FoodFormModal from '../../features/foods/FoodFormModal'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminFoodsPage() {
  const dispatch = useDispatch()
  const { foods, loading, pagination } = useSelector((state) => state.foods)

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFood, setEditingFood] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchFoods({ search, page: 1, limit: 50 }))
  }, [search, dispatch])

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
      toast.success('Xoa mon an thanh cong')
      setDeleteId(null)
    } catch (error) {
      toast.error(error || 'Xoa that bai')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSubmit = async (data) => {
    try {
      if (editingFood) {
        await dispatch(updateFood({ id: editingFood._id, data })).unwrap()
        toast.success('Cap nhat mon an thanh cong')
      } else {
        await dispatch(createFood(data)).unwrap()
        toast.success('Them mon an thanh cong')
      }
      setIsModalOpen(false)
      dispatch(fetchFoods({ search, page: 1, limit: 50 }))
    } catch (error) {
      toast.error(error || 'Luu that bai')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quan ly mon an</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} mon an trong he thong</p>
        </div>
        <Button onClick={handleCreate} icon={Plus}>
          Them mon an
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tim kiem mon an..."
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
        ) : foods.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="Chua co mon an nao"
            description="Bat dau bang viec them mon an dau tien cua ban"
            actionLabel="Them mon an"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Hinh anh</th>
                  <th className="px-4 py-3 font-medium">Ten mon</th>
                  <th className="px-4 py-3 font-medium">Danh muc</th>
                  <th className="px-4 py-3 font-medium">Gia</th>
                  <th className="px-4 py-3 font-medium">Trang thai</th>
                  <th className="px-4 py-3 font-medium">Hanh dong</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((food) => (
                  <motion.tr
                    key={food._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <img
                        src={food.image || 'https://via.placeholder.com/60'}
                        alt={food.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{food.name}</p>
                      {food.discount && (
                        <span className="text-xs text-red-500">-{Math.round(((food.price - food.discountPrice) / food.price) * 100)}%</span>
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
                        food.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {food.available ? 'San sang' : 'Tam ngung'}
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
        )}
      </div>

      {/* Form Modal */}
      <FoodFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        food={editingFood}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Xoa mon an"
        message="Ban co chac chan muon xoa mon an nay? Hanh dong nay khong the hoan tac."
        confirmLabel="Xoa"
        loading={deleteLoading}
      />
    </div>
  )
}
