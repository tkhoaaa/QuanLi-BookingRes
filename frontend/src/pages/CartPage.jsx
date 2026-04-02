import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Tag, X, Sparkles } from 'lucide-react'
import { selectCartItems, removeItem, updateQuantity, setCoupon, clearCart } from '../slices/cartSlice'
import { selectCartTotal } from '../slices/cartSlice'
import { formatCurrency, resolveFoodImage } from '../lib/utils'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

export default function CartPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const items = useSelector(selectCartItems)
  const total = useSelector(selectCartTotal)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [couponInput, setCouponInput] = useState('')
  const { coupon } = useSelector((state) => state.cart)

  const discount = coupon?.discount || 0
  const discountType = coupon?.discountType || 'percent'
  const discountAmount = discountType === 'percent'
    ? Math.round(total * (discount / 100))
    : discount
  const grandTotal = Math.max(0, total - discountAmount)

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return
    dispatch(setCoupon({ code: couponInput, discount: 10, discountType: 'percent' }))
    setCouponInput('')
  }

  const handleRemoveCoupon = () => {
    dispatch(setCoupon(null))
    setCouponInput('')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <EmptyState
          icon={ShoppingCart}
          title="Giỏ hàng trống"
          description="Bạn chưa thêm món nào vào giỏ hàng. Hãy khám phá thực đơn của chúng tôi!"
          actionLabel="Khám phá thực đơn"
          onAction={() => navigate('/')}
        />
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
            <h1 className="text-2xl font-bold text-charcoal-900 font-heading">Giỏ hàng của bạn</h1>
            <p className="text-sm text-charcoal-500">{items.length} món hàng</p>
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
                <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
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
                <h2 className="font-bold text-charcoal-900 font-heading">Tổng đơn hàng</h2>
              </div>

              {/* Coupon */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-charcoal-400" />
                  <span className="text-sm font-medium text-charcoal-700">Mã giảm giá</span>
                </div>
                {coupon ? (
                  <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2.5 rounded-xl text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{coupon.code}</span>
                      <span className="text-xs">-{discount}%</span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Nhập mã giảm giá"
                      className="flex-1 px-3 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <Button size="sm" onClick={handleApplyCoupon}>
                      Áp dụng
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 text-sm border-t border-charcoal-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Tạm tính</span>
                  <span className="text-charcoal-700">{formatCurrency(total)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2.5 border-t border-charcoal-100">
                  <span className="text-charcoal-900">Tổng cộng</span>
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
                  Tiếp tục thanh toán
                </Button>
                <Link to="/" className="block">
                  <Button variant="ghost" className="w-full">
                    Tiếp tục mua sắm
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
