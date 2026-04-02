import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  Plus, Edit2, Trash2, Search, Image as ImageIcon,
  Download, Tag, Layers, X, Check, UtensilsCrossed,
  MapPin,
} from 'lucide-react'
import { fetchFoods, createFood, updateFood, deleteFood } from '../../slices/foodsSlice'
import FoodFormModal from '../../features/foods/FoodFormModal'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Pagination from '../../components/ui/Pagination'
import { formatCurrency, resolveFoodImage } from '../../lib/utils'
import { CATEGORIES } from '../../constants'
import toast from 'react-hot-toast'
import axiosClient from '../../api/axiosClient'

const PAGE_SIZE = 20

const availabilityFilters = [
  { value: 'all', label: 'Tất cả' },
  { value: 'true', label: 'Đang bán' },
  { value: 'false', label: 'Tạm ngừng' },
]

const TABS = [
  { value: 'foods', label: 'Món ăn' },
  { value: 'categories', label: 'Danh mục' },
  { value: 'toppings', label: 'Topping / Size' },
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
  const [activeTab, setActiveTab] = useState('foods')

  // Category management state
  const [categories, setCategories] = useState([...CATEGORIES])
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatValue, setNewCatValue] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [deleteCatId, setDeleteCatId] = useState(null)
  const [deleteCatLoading, setDeleteCatLoading] = useState(false)

  // Topping management state
  const [toppings, setToppings] = useState([])
  const [editingTopping, setEditingTopping] = useState(null)
  const [newToppingName, setNewToppingName] = useState('')
  const [newToppingPrice, setNewToppingPrice] = useState('')
  const [addingTopping, setAddingTopping] = useState(false)
  const [deleteToppingId, setDeleteToppingId] = useState(null)
  const [deleteToppingLoading, setDeleteToppingLoading] = useState(false)

  // Branch filter
  const [branches, setBranches] = useState([])
  const [branchFilter, setBranchFilter] = useState('')

  useEffect(() => {
    axiosClient.get('/branches').then(res => {
      setBranches(res.data.data || [])
    }).catch(() => setBranches([]))
  }, [])

  // Fetch when page, search, or availability changes
  useEffect(() => {
    dispatch(fetchFoods({
      search,
      isAvailable: availability,
      page: currentPage,
      limit: PAGE_SIZE,
    }))
  }, [search, availability, currentPage, dispatch])

  // Build toppings list from all foods
  useEffect(() => {
    const allToppings = {}
    foods.forEach(food => {
      ;(food.variants || []).forEach(v => {
        const key = v.name || v.size || v
        if (!allToppings[key]) {
          allToppings[key] = {
            id: key,
            name: key,
            price: v.price || 0,
            category: food.category || food.categoryName || '',
          }
        }
      })
      ;(food.toppings || []).forEach(t => {
        const key = t.name || t
        if (!allToppings[key]) {
          allToppings[key] = {
            id: key,
            name: key,
            price: t.price || 0,
            category: food.category || food.categoryName || '',
          }
        }
      })
    })
    setToppings(Object.values(allToppings))
  }, [foods])

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

  // Category CRUD
  const handleAddCategory = () => {
    if (!newCatName.trim() || !newCatValue.trim()) {
      toast.error('Vui lòng nhập đầy đủ tên và mã danh mục')
      return
    }
    const value = newCatValue.toLowerCase().replace(/\s+/g, '-')
    if (categories.find(c => c.value === value)) {
      toast.error('Mã danh mục đã tồn tại')
      return
    }
    setCategories([...categories, { value, label: newCatName.trim() }])
    setNewCatName('')
    setNewCatValue('')
    setAddingCategory(false)
    toast.success('Thêm danh mục thành công')
  }

  const handleSaveCategory = (cat) => {
    if (!cat.label.trim()) {
      toast.error('Tên danh mục không được trống')
      return
    }
    setCategories(categories.map(c => c.value === cat.value ? { ...c, label: cat.label.trim() } : c))
    setEditingCategory(null)
    toast.success('Cập nhật danh mục thành công')
  }

  const handleDeleteCategory = () => {
    if (!deleteCatId) return
    setDeleteCatLoading(true)
    setTimeout(() => {
      setCategories(categories.filter(c => c.value !== deleteCatId))
      setDeleteCatId(null)
      setDeleteCatLoading(false)
      toast.success('Xóa danh mục thành công')
    }, 300)
  }

  // Topping CRUD
  const handleAddTopping = () => {
    if (!newToppingName.trim()) {
      toast.error('Vui lòng nhập tên topping')
      return
    }
    const price = parseInt(newToppingPrice) || 0
    setToppings([...toppings, { id: Date.now().toString(), name: newToppingName.trim(), price }])
    setNewToppingName('')
    setNewToppingPrice('')
    setAddingTopping(false)
    toast.success('Thêm topping thành công')
  }

  const handleSaveTopping = (topping) => {
    if (!topping.name.trim()) {
      toast.error('Tên topping không được trống')
      return
    }
    setToppings(toppings.map(t => t.id === topping.id ? { ...t, ...topping } : t))
    setEditingTopping(null)
    toast.success('Cập nhật topping thành công')
  }

  const handleDeleteTopping = () => {
    if (!deleteToppingId) return
    setDeleteToppingLoading(true)
    setTimeout(() => {
      setToppings(toppings.filter(t => t.id !== deleteToppingId))
      setDeleteToppingId(null)
      setDeleteToppingLoading(false)
      toast.success('Xóa topping thành công')
    }, 300)
  }

  // CSV Export
  const handleExportFoods = () => {
    const headers = ['Tên', 'Danh mục', 'Giá', 'Trạng thái', 'Đã bán']
    const rows = foods.map(f => [
      f.name,
      f.categoryName || f.category || '',
      f.price,
      f.isAvailable ? 'Đang bán' : 'Tạm ngừng',
      f.soldCount || 0,
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `danh-sach-mon-an-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Đã xuất file CSV')
  }

  // Count foods per category
  const getCategoryFoodCount = (catValue) => {
    return foods.filter(f => f.category === catValue || f.categoryName === catValue).length
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE + 1

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý món ăn</h1>
            <p className="text-gray-500 text-sm">{pagination.total} món ăn trong hệ thống</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'foods' && (
            <button
              onClick={handleExportFoods}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors"
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>
          )}
          {activeTab === 'foods' && (
            <Button onClick={handleCreate} icon={Plus}>
              Thêm món ăn
            </Button>
          )}
          {activeTab === 'categories' && !addingCategory && (
            <Button onClick={() => setAddingCategory(true)} icon={Plus}>
              Thêm danh mục
            </Button>
          )}
          {activeTab === 'toppings' && !addingTopping && (
            <Button onClick={() => setAddingTopping(true)} icon={Plus}>
              Thêm topping
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.value
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.value === 'foods' && <Layers className="w-4 h-4" />}
            {tab.value === 'categories' && <Tag className="w-4 h-4" />}
            {tab.value === 'toppings' && <Layers className="w-4 h-4" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================= */}
      {/* FOODS TAB */}
      {/* ============================================= */}
      {activeTab === 'foods' && (
        <>
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
            {branches.length > 0 && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <select
                  value={branchFilter}
                  onChange={(e) => { setBranchFilter(e.target.value) }}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  <option value="">Tất cả chi nhánh</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
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
                        <th className="px-4 py-3 font-medium">Chi nhánh</th>
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
                          {/* Branch */}
                          <td className="px-4 py-3">
                            {food.branchId || food.branch ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-gray-600">
                                  {typeof food.branch === 'object' ? food.branch.name : 'Chi nhánh'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Tất cả</span>
                            )}
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
        </>
      )}

      {/* ============================================= */}
      {/* CATEGORIES TAB */}
      {/* ============================================= */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Mã</th>
                  <th className="px-4 py-3 font-medium">Tên danh mục</th>
                  <th className="px-4 py-3 font-medium">Số món</th>
                  <th className="px-4 py-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.value} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cat.value}</code>
                    </td>
                    <td className="px-4 py-3">
                      {editingCategory === cat.value ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            defaultValue={cat.label}
                            onBlur={(e) => handleSaveCategory({ ...cat, label: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCategory({ ...cat, label: e.target.value })
                              if (e.key === 'Escape') setEditingCategory(null)
                            }}
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                            autoFocus
                          />
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">{cat.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {getCategoryFoodCount(cat.value)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditingCategory(cat.value)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCatId(cat.value)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Add new category row */}
                {addingCategory && (
                  <tr className="border-b border-gray-50 bg-green-50/30">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="ma-danh-muc"
                        value={newCatValue}
                        onChange={(e) => setNewCatValue(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                        autoFocus
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Tên danh mục"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCategory()
                          if (e.key === 'Escape') { setAddingCategory(false); setNewCatName(''); setNewCatValue('') }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">--</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={handleAddCategory}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setAddingCategory(false); setNewCatName(''); setNewCatValue('') }}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!addingCategory && (
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setAddingCategory(true)}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm danh mục mới
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================= */}
      {/* TOPPINGS TAB */}
      {/* ============================================= */}
      {activeTab === 'toppings' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Tên topping / size</th>
                  <th className="px-4 py-3 font-medium">Danh mục liên kết</th>
                  <th className="px-4 py-3 font-medium">Giá</th>
                  <th className="px-4 py-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {toppings.map((topping) => (
                  <tr key={topping.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editingTopping && editingTopping.id === topping.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTopping.name || ''}
                            onChange={(e) => setEditingTopping({ ...editingTopping, name: e.target.value })}
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                            autoFocus
                          />
                          <input
                            type="number"
                            value={editingTopping.price || 0}
                            onChange={(e) => setEditingTopping({ ...editingTopping, price: parseInt(e.target.value) || 0 })}
                            className="w-28 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <button
                            onClick={() => { handleSaveTopping(editingTopping); setEditingTopping(null) }}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTopping(null)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">{topping.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {topping.category || 'Chung'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-primary font-medium">{formatCurrency(topping.price)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditingTopping({ ...topping })}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteToppingId(topping.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Add new topping row */}
                {addingTopping && (
                  <tr className="border-b border-gray-50 bg-green-50/30">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Tên topping / size"
                        value={newToppingName}
                        onChange={(e) => setNewToppingName(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTopping()
                          if (e.key === 'Escape') { setAddingTopping(false); setNewToppingName(''); setNewToppingPrice('') }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">--</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        placeholder="Giá"
                        value={newToppingPrice}
                        onChange={(e) => setNewToppingPrice(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTopping()
                          if (e.key === 'Escape') { setAddingTopping(false); setNewToppingName(''); setNewToppingPrice('') }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={handleAddTopping}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setAddingTopping(false); setNewToppingName(''); setNewToppingPrice('') }}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {toppings.length === 0 && !addingTopping && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Chưa có topping nào. Thêm món ăn có topping để hiển thị tại đây.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!addingTopping && toppings.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setAddingTopping(true)}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm topping mới
              </button>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <FoodFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        food={editingFood}
        isSubmitting={formLoading}
      />

      {/* Delete Food Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Xóa món ăn"
        message="Bạn có chắc chắn muốn xóa món ăn này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        loading={deleteLoading}
      />

      {/* Delete Category Confirm */}
      <ConfirmDialog
        isOpen={!!deleteCatId}
        onClose={() => setDeleteCatId(null)}
        onConfirm={handleDeleteCategory}
        title="Xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này? Các món ăn trong danh mục sẽ không bị xóa."
        confirmLabel="Xóa"
        loading={deleteCatLoading}
      />

      {/* Delete Topping Confirm */}
      <ConfirmDialog
        isOpen={!!deleteToppingId}
        onClose={() => setDeleteToppingId(null)}
        onConfirm={handleDeleteTopping}
        title="Xóa topping"
        message="Bạn có chắc chắn muốn xóa topping này?"
        confirmLabel="Xóa"
        loading={deleteToppingLoading}
      />
    </div>
  )
}
