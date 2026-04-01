import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Tag } from 'lucide-react'
import { selectCartItems, removeItem, updateQuantity, setCoupon } from '../slices/cartSlice'
import { selectCartTotal } from '../slices/cartSlice'
import { formatCurrency } from '../lib/utils'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useState } from 'react'

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
  }

  const handleRemoveCoupon = () => {
    dispatch(setCoupon(null))
    setCouponInput('')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <EmptyState
          icon={ShoppingCart}
          title="Gio hang trong"
          description="Ban chua them mon nao vao gio hang. Hay kham pha thuc don cua chung toi!"
          actionLabel="Kham pha thuc don"
          onAction={() => navigate('/')}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary" />
          Gio hang cua ban ({items.length} mon)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => {
              const variantPrice = item.variant?.price || 0
              const toppingsPrice = item.toppings.reduce((s, t) => s + (t.price || 0), 0)
              const itemTotal = (item.food.price + variantPrice + toppingsPrice) * item.quantity

              return (
                <motion.div
                  key={`${item.food._id}-${item.variantStr}-${item.toppingsStr}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl p-4 shadow-sm flex gap-4"
                >
                  <img
                    src={item.food.image || 'https://via.placeholder.com/100'}
                    alt={item.food.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/food/${item.food._id}`}
                      className="font-medium text-gray-900 hover:text-primary transition-colors"
                    >
                      {item.food.name}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.variant.name}</p>
                    )}
                    {item.toppings.length > 0 && (
                      <p className="text-xs text-gray-500">
                        + {item.toppings.map((t) => t.name).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-semibold">
                        {formatCurrency(itemTotal)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ index, quantity: item.quantity - 1 }))
                          }
                          className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ index, quantity: item.quantity + 1 }))
                          }
                          className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => dispatch(removeItem(index))}
                          className="w-7 h-7 flex items-center justify-center rounded text-red-500 hover:bg-red-50 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-5 shadow-sm sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Tong don hang</h2>

              {/* Coupon */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Ma giam gia</span>
                </div>
                {coupon ? (
                  <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
                    <span>{coupon.code}</span>
                    <div className="flex items-center gap-2">
                      <span>-{formatCurrency(discountAmount)}</span>
                      <button onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Nhap ma giam gia"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <Button size="sm" onClick={handleApplyCoupon}>
                      Ap dung
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tam tinh</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giam gia</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                  <span>Tong cong</span>
                  <span className="text-primary">{formatCurrency(grandTotal)}</span>
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
      </div>
    </div>
  )
}
