import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Star, Minus, Plus, ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchFoodById, clearCurrentFood } from '../slices/foodsSlice'
import { addItem, selectCartItems } from '../slices/cartSlice'
import { formatCurrency, cn } from '../lib/utils'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function FoodDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentFood, loading } = useSelector((state) => state.foods)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const cartItems = useSelector(selectCartItems)

  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedToppings, setSelectedToppings] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    dispatch(fetchFoodById(id))
    return () => dispatch(clearCurrentFood())
  }, [id, dispatch])

  useEffect(() => {
    if (currentFood?.variants?.length > 0) {
      setSelectedVariant(currentFood.variants[0])
    }
  }, [currentFood])

  if (loading || !currentFood) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

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
      toast.error('Vui long dang nhap de them mon vao gio hang')
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
    toast.success(`Da them ${currentFood.name} (x${quantity}) vao gio hang`)
  }

  const discountPercent = currentFood.discount
    ? Math.round(((currentFood.price - currentFood.discountPrice) / currentFood.price) * 100)
    : 0

  const images = currentFood.images?.length
    ? currentFood.images
    : [currentFood.image || 'https://via.placeholder.com/500']

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="relative">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square rounded-2xl overflow-hidden bg-gray-200"
            >
              <img
                src={images[currentImageIndex]}
                alt={currentFood.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                -{discountPercent}%
              </span>
            )}
            {/* Thumbnail dots */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      i === currentImageIndex ? 'bg-primary' : 'bg-gray-300'
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
            className="space-y-6"
          >
            <div>
              <span className="text-sm text-primary font-medium uppercase tracking-wide">
                {currentFood.categoryName || currentFood.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">{currentFood.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                {currentFood.rating > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < Math.floor(currentFood.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      ({currentFood.rating.toFixed(1)}) - {currentFood.reviewCount || 0} danh gia
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Price */}
            <div>
              {currentFood.discount ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(currentFood.discountPrice)}
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    {formatCurrency(currentFood.price)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(currentFood.price)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{currentFood.description}</p>

            {/* Variants */}
            {currentFood.variants?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Kich thuoc</h3>
                <div className="flex gap-2">
                  {currentFood.variants.map((variant) => (
                    <button
                      key={variant._id || variant.name}
                      onClick={() => setSelectedVariant(variant)}
                      className={cn(
                        'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                        selectedVariant?.name === variant.name
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 hover:border-primary'
                      )}
                    >
                      {variant.name}
                      {variant.price > 0 && (
                        <span className="ml-1 text-xs opacity-70">
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
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Topping</h3>
                <div className="grid grid-cols-2 gap-2">
                  {currentFood.toppings.map((topping) => {
                    const selected = selectedToppings.find((t) => t._id === topping._id)
                    return (
                      <button
                        key={topping._id || topping.name}
                        onClick={() => toggleTopping(topping)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors',
                          selected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 hover:border-primary'
                        )}
                      >
                        <span>{topping.name}</span>
                        <span className="text-xs font-medium">
                          +{formatCurrency(topping.price)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="font-semibold text-gray-900">So luong</span>
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleAddToCart} size="lg" className="flex-1" icon={ShoppingCart}>
                Them vao gio hang
              </Button>
              <span className="text-2xl font-bold text-primary flex items-center">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
