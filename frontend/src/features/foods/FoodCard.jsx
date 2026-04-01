import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, ShoppingCart, Heart } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { addItem } from '../../slices/cartSlice'
import { formatCurrency, cn } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function FoodCard({ food, className, onWishlistToggle, isWishlisted = false }) {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Vui long dang nhap de them mon vao gio hang')
      return
    }
    dispatch(addItem({ food, quantity: 1, variant: null, toppings: [] }))
    toast.success(`Da them ${food.name} vao gio hang`)
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Vui long dang nhap')
      return
    }
    onWishlistToggle?.(food._id)
  }

  const discountPercent = food.discount
    ? Math.round(((food.price - food.discountPrice) / food.price) * 100)
    : 0

  return (
    <Link to={`/food/${food._id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className={cn(
          'bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group',
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={food.image || 'https://via.placeholder.com/300'}
            alt={food.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {discountPercent > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discountPercent}%
            </span>
          )}
          {food.rating > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium text-gray-700">{food.rating.toFixed(1)}</span>
            </div>
          )}
          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={cn(
              'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all',
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500'
            )}
          >
            <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 text-sm truncate mb-1">{food.name}</h3>
          <p className="text-xs text-gray-500 mb-2 truncate">{food.categoryName || food.category}</p>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {food.discount ? (
                <>
                  <span className="text-primary font-semibold text-sm">
                    {formatCurrency(food.discountPrice)}
                  </span>
                  <span className="text-gray-400 text-xs line-through">
                    {formatCurrency(food.price)}
                  </span>
                </>
              ) : (
                <span className="text-primary font-semibold text-sm">
                  {formatCurrency(food.price)}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
