import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Tag, X, Sparkles, Loader2, UtensilsCrossed, ChevronLeft, ChevronRight } from 'lucide-react'
import { selectCartItems, removeItem, updateQuantity, setCoupon, clearCart } from '../slices/cartSlice'
import { selectCartTotal } from '../slices/cartSlice'
import { formatCurrency, resolveFoodImage } from '../lib/utils'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import axiosClient from '../api/axiosClient'
import toast from 'react-hot-toast'

export default function CartPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items = useSelector(selectCartItems)
  const total = useSelector(selectCartTotal)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const { coupon } = useSelector((state) => state.cart)

  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [suggestedFoods, setSuggestedFoods] = useState([])
  const suggestionScrollRef = useRef(null)

  const discount = coupon?.discount || 0
  const discountType = coupon?.discountType || 'percent'
  const discountAmount = discountType === 'percent'
    ? Math.round(total * (discount / 100))
    : discount
  const grandTotal = Math.max(0, total - discountAmount)

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return

    setCouponLoading(true)
    setCouponError('')

    try {
      const res = await axiosClient.post('/coupons/validate', {
        code: couponInput.trim(),
        orderTotal: total,
      })

      const data = res.data.data

      dispatch(setCoupon({
        code: couponInput.trim(),
        discount: data.discount || data.discountAmount || 0,
        discountType: data.discountType || (data.discount ? 'percent' : 'fixed'),
        minOrder: data.minOrder,
      }))

      toast.success('Ma giam gia da duoc ap dung!')
      setCouponInput('')
    } catch (err) {
      const msg = err.response?.data?.message || 'Ma giam gia khong hop le hoac da het han'
      setCouponError(msg)
      toast.error(msg)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    dispatch(setCoupon(null))
    setCouponInput('')
    setCouponError('')
  }

  // Fetch suggested foods - runs regardless of cart state so empty cart also shows suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const res = await axiosClient.get('/foods?limit=10&isAvailable=true')
        const foods = res.data.data?.foods || []
        // Shuffle and take first 6
        const shuffled = [...foods].sort(() => Math.random() - 0.5).slice(0, 6)
        setSuggestedFoods(shuffled)
      } catch {
        // silent fail
      }
    }
    loadSuggestions()
  }, [])

  const handleScrollSuggestion = (dir) => {
    if (suggestionScrollRef.current) {
      suggestionScrollRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' })
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-8">
        <div className="max-w-5xl mx-auto px-4">
          {/* Improved empty cart */}
          <div className="bg-white rounded-3xl shadow-card p-10 text-center">
            {/* Decorative plate icon */}
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-12 h-12 text-primary/60" />
            </div>

            <h2 className="text-2xl font-bold text-charcoal-900 font-heading mb-2">
              Gio hang cua ban dang trong
            </h2>
            <p className="text-charcoal-500 mb-8 max-w-sm mx-auto">
              Ban chua them mon nao vao gio hang. Hay kham pha thuc don cua chung toi de tim mon an yeu thich!
            </p>

            {/* Quick category shortcuts */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {['mon-chinh', 'do-uong', 'trang-mieng'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate(`/?category=${cat}`)}
                  className="px-4 py-2 bg-charcoal-100 text-charcoal-700 text-sm rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {cat === 'mon-chinh' ? 'Mon chinh' : cat === 'do-uong' ? 'Do uong' : 'Trang mieng'}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/')}
                size="lg"
                icon={UtensilsCrossed}
                className="inline-flex"
              >
                Kham pha mon an
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                size="lg"
                className="inline-flex"
              >
                Dang nhap
              </Button>
            </div>

            {/* Suggestion foods even on empty cart */}
            {suggestedFoods.length > 0 && (
              <div className="mt-10 pt-8 border-t border-charcoal-100">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="w-4 h-4 text-secondary" />
                  <h3 className="text-base font-bold text-charcoal-900 font-heading">Mon an noi bat</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {suggestedFoods.slice(0, 4).map((food) => (
                    <div key={food._id} className="flex-shrink-0 w-48">
                      <FoodCard food={food} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900 font-heading">Gio hang cua ban</h1>
            <p className="text-sm text-charcoal-500">{items.length} mon hang</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {/* Clear all */}
            <div className="flex justify-end">
              <button
                onClick={() => dispatch(clearCart())}
                className="text-xs text-charcoal-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xoa tat ca
              </button>
            </div>

            <AnimatePresence>
              {items.map((item, index) => {
                const variantPrice = item.variant?.price || 0
                const toppingsPrice = item.toppings.reduce((s, t) => s + (t.price || 0), 0)
                const itemTotal = (item.food.price + variantPrice + toppingsPrice) * item.quantity

                return (
                  <motion.div
                    key={`${item.food._id}-${item.variantStr}-${item.toppingsStr}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-4 shadow-card flex gap-4"
                  >
                    <Link to={`/food/${item.food._id}`} className="flex-shrink-0">
                      <img
                        src={resolveFoodImage(item.food.images, 'https://via.placeholder.com/100?text=Food')}
                        alt={item.food.name}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/food/${item.food._id}`}
                            className="font-semibold text-charcoal-900 hover:text-primary transition-colors line-clamp-1"
                          >
                            {item.food.name}
                          </Link>
                          {item.variant && (
                            <p className="text-xs text-charcoal-500 mt-0.5 bg-charcoal-100 inline-block px-2 py-0.5 rounded-full">
                              {item.variant.name}
                              {item.variant.price > 0 && ` +${formatCurrency(item.variant.price)}`}
                            </p>
                          )}
                          {item.toppings.length > 0 && (
                            <p className="text-xs text-charcoal-500 mt-1">
                              + {item.toppings.map((t) => t.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => dispatch(removeItem(index))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-secondary font-heading">
                          {formatCurrency(itemTotal)}
                        </span>
                        <div className="flex items-center bg-charcoal-100 rounded-xl overflow-hidden">
                          <button
                            onClick={() =>
                              dispatch(updateQuantity({ index, quantity: Math.max(1, item.quantity - 1) }))
                            }
                            className="w-9 h-9 flex items-center justify-center hover:bg-charcoal-200 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5 text-charcoal-600" />
                          </button>
                          <span className="w-10 text-center font-semibold text-charcoal-900 text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              dispatch(updateQuantity({ index, quantity: item.quantity + 1 }))
                            }
                            className="w-9 h-9 flex items-center justify-center hover:bg-charcoal-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-charcoal-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-5 shadow-card sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-secondary" />
                <h2 className="font-bold text-charcoal-900 font-heading">Tong don hang</h2>
              </div>

              {/* Coupon */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-charcoal-400" />
                  <span className="text-sm font-medium text-charcoal-700">Ma giam gia</span>
                </div>
                {coupon ? (
                  <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2.5 rounded-xl text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{coupon.code}</span>
                      <span className="text-xs">
                        {coupon.discountType === 'percent'
                          ? `-${coupon.discount}%`
                          : `-${formatCurrency(coupon.discount)}`}
                      </span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value); setCouponError('') }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Nhap ma giam gia"
                        className="flex-1 px-3 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <Button
                        size="sm"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className={couponLoading ? 'opacity-70' : ''}
                      >
                        {couponLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Ap dung'
                        )}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
                        {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2.5 text-sm border-t border-charcoal-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Tam tinh</span>
                  <span className="text-charcoal-700">{formatCurrency(total)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giam gia</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2.5 border-t border-charcoal-100">
                  <span className="text-charcoal-900">Tong cong</span>
                  <span className="text-secondary font-heading">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login', { state: { from: '/checkout' } })
                    } else {
                      navigate('/checkout')
                    }
                  }}
                  className="w-full"
                  icon={ArrowRight}
                  iconPosition="right"
                  size="lg"
                >
                  Tiep tuc thanh toan
                </Button>
                <Link to="/" className="block">
                  <Button variant="ghost" className="w-full">
                    Tiep tuc mua sam
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions carousel */}
        {suggestedFoods.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-secondary" />
                <h2 className="text-lg font-bold text-charcoal-900 font-heading">Go y them</h2>
              </div>
              <Link to="/" className="text-sm text-primary hover:text-primary-dark font-medium">
                Xem tat ca
              </Link>
            </div>
            <div className="relative">
              <button
                onClick={() => handleScrollSuggestion(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-charcoal-50 transition-colors hidden md:flex"
              >
                <ChevronLeft className="w-5 h-5 text-charcoal-700" />
              </button>
              <div
                ref={suggestionScrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {suggestedFoods.map((food) => (
                  <div key={food._id} className="flex-shrink-0 w-56">
                    <FoodCard food={food} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleScrollSuggestion(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-charcoal-50 transition-colors hidden md:flex"
              >
                <ChevronRight className="w-5 h-5 text-charcoal-700" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
