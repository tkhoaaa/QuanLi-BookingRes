import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Heart, LogIn } from 'lucide-react'
import FoodCard from '../features/foods/FoodCard'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { fetchWishlist, removeFromWishlist } from '../slices/wishlistSlice'

export default function WishlistPage() {
  const dispatch = useDispatch()
  const { items, loading } = useSelector((state) => state.wishlist)
  const { isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist())
    }
  }, [isAuthenticated, dispatch])

  const handleRemove = (foodId) => {
    dispatch(removeFromWishlist(foodId))
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Danh sách yêu thích
          </h1>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Đăng nhập để xem danh sách yêu thích</h2>
            <p className="text-gray-500 mb-6">Lưu món ăn yêu thích của bạn để mua nhanh hơn</p>
            <Link to="/login">
              <Button icon={LogIn}>Đăng nhập ngay</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          Danh sách yêu thích
          <span className="text-sm font-normal text-gray-500">({items.length} món)</span>
        </h1>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Đang tải...</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Danh sách yêu thích trống"
            description="Nhấn vào biểu tượng trái tim trên món ăn để thêm vào danh sách yêu thích"
            actionLabel="Khám phá thực đơn"
            onAction={() => window.location.href = '/'}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((food, index) => (
              <motion.div
                key={food._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <FoodCard food={food} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
