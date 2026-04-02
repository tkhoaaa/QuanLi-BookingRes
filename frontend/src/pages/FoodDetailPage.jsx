import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Minus, Plus, ShoppingCart, ChevronLeft, ChevronRight, Flame, AlertCircle, Grid3x3 } from 'lucide-react'
import { fetchFoodById, clearCurrentFood, fetchFoods } from '../slices/foodsSlice'
import { addItem, selectCartItems } from '../slices/cartSlice'
import { formatCurrency, cn, resolveFoodImage } from '../lib/utils'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import FoodCard from '../features/foods/FoodCard'
import toast from 'react-hot-toast'

export default function FoodDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentFood, loading, error, foods } = useSelector((state) => state.foods)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const cartItems = useSelector(selectCartItems)

  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedToppings, setSelectedToppings] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showStickyCta, setShowStickyCta] = useState(false)
  const addToCartRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (addToCartRef.current) {
        const rect = addToCartRef.current.getBoundingClientRect()
        setShowStickyCta(rect.bottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    dispatch(fetchFoodById(id))
    dispatch(fetchFoods({ limit: 20 }))
    return () => dispatch(clearCurrentFood())
  }, [id, dispatch])

  useEffect(() => {
    if (currentFood?.variants?.length > 0) {
      setSelectedVariant(currentFood.variants[0])
    }
  }, [currentFood])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !currentFood) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <EmptyState
          icon={AlertCircle}
          title="Không tìm thấy món ăn"
          description={error || 'Món ăn này không tồn tại hoặc đã bị xóa.'}
          actionLabel="Quay lại thực đơn"
          onAction={() => navigate('/')}
        />
      </div>
    )
  }

  if (!currentFood) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Related foods: same category, exclude current
  const relatedFoods = (foods || [])
    .filter((f) => f._id !== currentFood._id && (f.category === currentFood.category || f.categoryName === currentFood.categoryName))
    .slice(0, 4)

  const variantPrice = selectedVariant?.price || 0
  const toppingsPrice = selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0)
  const totalPrice = (currentFood.price + variantPrice + toppingsPrice) * quantity

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t._id === topping._id)
      if (exists) return prev.filter((t) => t._id !== topping._id)
      return [...prev, topping]
    })
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm món vào giỏ hàng')
      navigate('/login')
      return
    }
    dispatch(
      addItem({
        food: currentFood,
        quantity,
        variant: selectedVariant,
        toppings: selectedToppings,
      })
    )
    toast.success(`Đã thêm ${currentFood.name} (x${quantity}) vào giỏ hàng`)
  }

  const discountPercent = currentFood.discount
    ? Math.round(((currentFood.price - currentFood.discountPrice) / currentFood.price) * 100)
    : 0

  const images = currentFood.images?.length
    ? currentFood.images
    : currentFood.image ? [currentFood.image] : []

  // Resolve all image URLs with API base prefix
  const resolvedImages = images.length > 0
    ? images.map((img) => resolveFoodImage([img], 'https://via.placeholder.com/600?text=Food'))
    : ['https://via.placeholder.com/600?text=Food']

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % resolvedImages.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + resolvedImages.length) % resolvedImages.length)

  return (
    <div className="min-h-screen bg-cream py-8 pb-28">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="relative">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="aspect-square rounded-2xl overflow-hidden bg-charcoal-100 shadow-card"
            >
              <img
                src={resolvedImages[currentImageIndex]}
                alt={currentFood.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-charcoal-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-charcoal-700" />
                </button>
              </>
            )}

            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-secondary text-white font-bold px-3 py-1 rounded-full text-sm shadow-sm flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> -{discountPercent}%
              </span>
            )}

            {/* Thumbnail dots */}
            {resolvedImages.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {resolvedImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-all',
                      i === currentImageIndex ? 'bg-primary w-6' : 'bg-charcoal-200 hover:bg-charcoal-300'
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Category badge */}
            <div>
              <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase tracking-wide">
                {currentFood.categoryName || currentFood.category}
              </span>
            </div>

            {/* Title & Rating */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-charcoal-900 font-heading leading-tight">
                {currentFood.name}
              </h1>
              {currentFood.rating > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < Math.floor(currentFood.rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-charcoal-200'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-charcoal-900">
                    {currentFood.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-charcoal-500">
                    ({currentFood.reviewCount || 0} đánh giá)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              {currentFood.discount ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-secondary font-heading">
                    {formatCurrency(currentFood.discountPrice)}
                  </span>
                  <span className="text-xl text-charcoal-400 line-through">
                    {formatCurrency(currentFood.price)}
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-bold text-secondary font-heading">
                  {formatCurrency(currentFood.price)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-charcoal-600 leading-relaxed text-base">
              {currentFood.description}
            </p>

            {/* Variants */}
            {currentFood.variants?.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-charcoal-900 mb-3">Kích thước</h3>
                <div className="flex flex-wrap gap-2">
                  {currentFood.variants.map((variant) => (
                    <button
                      key={variant._id || variant.name}
                      onClick={() => setSelectedVariant(variant)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                        selectedVariant?.name === variant.name
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-charcoal-200 text-charcoal-700 hover:border-primary hover:bg-primary/5'
                      )}
                    >
                      {variant.name}
                      {variant.price > 0 && (
                        <span className="ml-1 text-xs opacity-75">
                          +{formatCurrency(variant.price)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toppings */}
            {currentFood.toppings?.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-charcoal-900 mb-3">Topping</h3>
                <div className="grid grid-cols-2 gap-2">
                  {currentFood.toppings.map((topping) => {
                    const selected = selectedToppings.find((t) => t._id === topping._id)
                    return (
                      <button
                        key={topping._id || topping.name}
                        onClick={() => toggleTopping(topping)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                          selected
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-charcoal-200 text-charcoal-700 hover:border-primary hover:bg-primary/5'
                        )}
                      >
                        <span>{topping.name}</span>
                        <span className={cn('text-xs font-semibold', selected ? 'text-white/80' : 'text-primary')}>
                          +{formatCurrency(topping.price)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div ref={addToCartRef} className="bg-white rounded-xl p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-charcoal-900">Số lượng</span>
                <div className="flex items-center border-2 border-charcoal-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-charcoal-50 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-charcoal-600" />
                  </button>
                  <span className="w-12 text-center font-semibold text-charcoal-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-charcoal-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-charcoal-600" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1"
                  icon={ShoppingCart}
                  size="lg"
                >
                  Thêm vào giỏ hàng
                </Button>
                <div className="flex-shrink-0 px-4 py-3 bg-secondary/10 rounded-xl text-center">
                  <p className="text-xs text-charcoal-500">Tổng cộng</p>
                  <p className="text-xl font-bold text-secondary font-heading">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Foods */}
        {relatedFoods.length > 0 && (
          <div className="mt-8 pt-8 border-t border-charcoal-100">
            <div className="flex items-center gap-2 mb-4">
              <Grid3x3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-charcoal-900 font-heading">Món liên quan</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedFoods.map((food) => (
                <FoodCard key={food._id} food={food} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky mobile CTA */}
      <AnimatePresence>
        {showStickyCta && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-charcoal-100 px-4 py-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-charcoal-500">Tổng cộng</p>
                <p className="text-lg font-bold text-secondary font-heading">
                  {formatCurrency(totalPrice)}
                </p>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-primary-dark transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Thêm vào giỏ hàng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
