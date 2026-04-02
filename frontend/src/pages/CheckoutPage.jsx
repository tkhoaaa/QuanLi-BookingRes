import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { MapPin, CreditCard, Truck, Store, Sparkles, ChevronRight } from 'lucide-react'
import { createOrder } from '../slices/ordersSlice'
import { selectCartItems, selectCartTotal, clearCart } from '../slices/cartSlice'
import { formatCurrency, cn, resolveFoodImage } from '../lib/utils'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const schema = yup.object({
  fullName: yup.string().required('Họ tên là bắt buộc'),
  phone: yup.string().required('Số điện thoại là bắt buộc').matches(/^[0-9]{9,11}$/, 'Số điện thoại không hợp lệ'),
  address: yup.string().when('fulfillmentType', {
    is: 'delivery',
    then: (schema) => schema.required('Địa chỉ là bắt buộc'),
    otherwise: (schema) => schema,
  }),
  branchId: yup.string().when('fulfillmentType', {
    is: 'pickup',
    then: (schema) => schema.required('Chọn chi nhánh lấy hàng'),
    otherwise: (schema) => schema,
  }),
  fulfillmentType: yup.string().required('Chọn hình thức nhận hàng'),
  paymentMethod: yup.string().required('Chọn phương thức thanh toán'),
  note: yup.string(),
})

export default function CheckoutPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const items = useSelector(selectCartItems)
  const total = useSelector(selectCartTotal)
  const { coupon } = useSelector((state) => state.cart)
  const { user } = useSelector((state) => state.auth)
  const { loading } = useSelector((state) => state.orders)

  const [fulfillmentType, setFulfillmentType] = useState('delivery')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [branches] = useState([])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: user?.name || '',
      phone: user?.phone || '',
      address: user?.addresses?.[0] || '',
      fulfillmentType: 'delivery',
      paymentMethod: 'COD',
      note: '',
    },
  })

  const discount = coupon?.discount || 0
  const discountAmount = discount > 0 ? Math.round(total * (discount / 100)) : 0
  const deliveryFee = fulfillmentType === 'delivery' ? 15000 : 0
  const grandTotal = total - discountAmount + deliveryFee

  const onSubmit = async (data) => {
    if (items.length === 0) {
      toast.error('Giỏ hàng trống')
      return
    }

    try {
      const shippingAddress = fulfillmentType === 'delivery'
        ? {
            name: data.fullName,
            phone: data.phone,
            address: data.address,
          }
        : null

      const orderData = {
        fulfillmentType,
        paymentMethod,
        shippingAddress,
        branchId: fulfillmentType === 'pickup' ? data.branchId : undefined,
        items: items.map((item) => ({
          food: item.food._id,
          quantity: item.quantity,
          variant: item.variant?._id || null,
          toppings: item.toppings.map((t) => t._id),
        })),
        subtotal: total,
        discountAmount,
        deliveryFee,
        total: grandTotal,
        couponCode: coupon?.code || null,
        note: data.note || undefined,
      }

      const result = await dispatch(createOrder(orderData)).unwrap()
      dispatch(clearCart())
      toast.success('Đặt hàng thành công!')
      navigate(`/orders/${result._id}`)
    } catch (error) {
      toast.error(error || 'Đặt hàng thất bại. Vui lòng thử lại.')
    }
  }

  const paymentOptions = [
    { value: 'COD', label: 'Tiền mặt', icon: '💵' },
    { value: 'VNPAY', label: 'VNPay', icon: '💳' },
    { value: 'MOMO', label: 'MoMo', icon: '📱' },
  ]

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-charcoal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-charcoal-300" />
          </div>
          <p className="text-charcoal-500">Giỏ hàng trống. Vui lòng thêm món ăn trước.</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Quay lại thực đơn
          </Button>
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
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900 font-heading">Thanh toán</h1>
            <p className="text-sm text-charcoal-500">Kiểm tra và xác nhận đơn hàng của bạn</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Delivery Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-card"
            >
              <h2 className="font-semibold text-charcoal-900 mb-4 flex items-center gap-2 font-heading">
                <MapPin className="w-5 h-5 text-primary" />
                Thông tin nhận hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Họ và tên"
                  placeholder="Nhập họ và tên"
                  {...register('fullName')}
                  error={errors.fullName?.message}
                />
                <Input
                  label="Số điện thoại"
                  placeholder="09xxxxxxxx"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
              </div>

              {/* Fulfillment Type */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-charcoal-700 mb-2.5">
                  Hình thức nhận hàng
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('delivery')}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                      fulfillmentType === 'delivery'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-charcoal-200 text-charcoal-600 hover:border-charcoal-300'
                    )}
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">Giao hàng</p>
                      <p className="text-xs opacity-70">Phi {formatCurrency(15000)}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('pickup')}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                      fulfillmentType === 'pickup'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-charcoal-200 text-charcoal-600 hover:border-charcoal-300'
                    )}
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">Tự lấy tại cửa hàng</p>
                      <p className="text-xs opacity-70">Miễn phí</p>
                    </div>
                  </button>
                </div>
                <input type="hidden" {...register('fulfillmentType')} />
              </div>

              {fulfillmentType === 'delivery' && (
                <div className="mt-4">
                  <Input
                    label="Địa chỉ giao hàng"
                    placeholder="VD: 123 Đường ABC, Phường X, Quận Y, TP.HCM"
                    {...register('address')}
                    error={errors.address?.message}
                  />
                </div>
              )}

              {fulfillmentType === 'pickup' && (
                <div className="mt-4">
                  <Select
                    label="Chọn chi nhánh"
                    {...register('branchId')}
                    error={errors.branchId?.message}
                    options={branches.map((b) => ({ value: b._id, label: b.name }))}
                    placeholder="Chọn chi nhánh"
                  />
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  {...register('note')}
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  placeholder="VD: Không hành, ít đường..."
                />
              </div>
            </motion.div>

            {/* Payment */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-card"
            >
              <h2 className="font-semibold text-charcoal-900 mb-4 flex items-center gap-2 font-heading">
                <CreditCard className="w-5 h-5 text-primary" />
                Phương thức thanh toán
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {paymentOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-sm font-medium transition-all text-left flex items-center gap-3',
                      paymentMethod === opt.value
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-charcoal-200 text-charcoal-600 hover:border-charcoal-300'
                    )}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('paymentMethod')} />
            </motion.div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-5 shadow-card sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-secondary" />
                <h2 className="font-bold text-charcoal-900 font-heading">Đơn hàng của bạn</h2>
              </div>

              {/* Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={`${item.food._id}-${item.variantStr}`} className="flex gap-3 text-sm">
                    <img
                      src={resolveFoodImage(item.food.images, 'https://via.placeholder.com/50?text=Food')}
                      alt={item.food.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-charcoal-900 truncate">{item.food.name}</p>
                      <p className="text-xs text-charcoal-500">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-charcoal-900 flex-shrink-0">
                      {formatCurrency(
                        (item.food.price +
                          (item.variant?.price || 0) +
                          item.toppings.reduce((s, t) => s + (t.price || 0), 0)) *
                          item.quantity
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 text-sm border-t border-charcoal-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Tạm tính</span>
                  <span className="text-charcoal-700">{formatCurrency(total)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({coupon?.code})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Phí giao hàng</span>
                  <span className={fulfillmentType === 'pickup' ? 'text-green-600' : 'text-charcoal-700'}>
                    {fulfillmentType === 'pickup' ? 'Miễn phí' : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2.5 border-t border-charcoal-100">
                  <span className="text-charcoal-900">Tổng cộng</span>
                  <span className="text-secondary font-heading">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-4 group"
                loading={loading}
                disabled={loading}
                size="lg"
                icon={ChevronRight}
                iconPosition="right"
              >
                Đặt hàng ngay
              </Button>

              <p className="text-xs text-charcoal-400 text-center mt-3">
                Bạn có thể hủy đơn hàng trong 5 phút đầu tiên
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
