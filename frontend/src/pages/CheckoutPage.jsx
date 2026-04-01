import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { ShoppingBag, MapPin, CreditCard, Truck, Store, Tag } from 'lucide-react'
import { createOrder } from '../slices/ordersSlice'
import { selectCartItems, selectCartTotal, clearCart } from '../slices/cartSlice'
import { formatCurrency, cn } from '../lib/utils'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { PAYMENT_METHODS, FULFILLMENT_TYPES } from '../constants'

const schema = yup.object({
  fullName: yup.string().required('Ho ten la bat buoc'),
  phone: yup.string().required('So dien thoai la bat buoc').matches(/^[0-9]{9,11}$/, 'So dien thoai khong hop le'),
  address: yup.string().when('fulfillmentType', {
    is: 'delivery',
    then: (schema) => schema.required('Dia chi la bat buoc'),
    otherwise: (schema) => schema,
  }),
  branchId: yup.string().when('fulfillmentType', {
    is: 'pickup',
    then: (schema) => schema.required('Chon chi nhanh lay hang'),
    otherwise: (schema) => schema,
  }),
  fulfillmentType: yup.string().required('Chon hinh thuc nhan hang'),
  paymentMethod: yup.string().required('Chon phuong thuc thanh toan'),
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
  const [paymentMethod, setPaymentMethod] = useState('cash')
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
      paymentMethod: 'cash',
      note: '',
    },
  })

  const watchedAddress = watch('address')
  const discount = coupon?.discount || 0
  const discountAmount = discount > 0 ? Math.round(total * (discount / 100)) : 0
  const deliveryFee = fulfillmentType === 'delivery' ? 15000 : 0
  const grandTotal = total - discountAmount + deliveryFee

  const onSubmit = async (data) => {
    if (items.length === 0) {
      toast.error('Gio hang trong')
      return
    }

    try {
      const orderData = {
        ...data,
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
      }

      const result = await dispatch(createOrder(orderData)).unwrap()
      dispatch(clearCart())
      toast.success('Dat hang thanh cong!')
      navigate(`/orders/${result._id}`)
    } catch (error) {
      toast.error(error || 'Dat hang that bai. Vui long thu lai.')
    }
  }

  const paymentOptions = Object.entries(PAYMENT_METHODS).map(([value, label]) => ({
    value,
    label,
  }))

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">Gio hang trong. Vui long them mon an truoc.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Thanh toan</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Thong tin nhan hang
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Ho va ten"
                  {...register('fullName')}
                  error={errors.fullName?.message}
                />
                <Input
                  label="So dien thoai"
                  {...register('phone')}
                  error={errors.phone?.message}
                  placeholder="09xxxxxxxx"
                />
              </div>

              {/* Fulfillment Type */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hinh thuc nhan hang
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('delivery')}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-colors',
                      fulfillmentType === 'delivery'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Truck className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Giao hang</p>
                      <p className="text-xs text-gray-500">Phí {formatCurrency(15000)}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('pickup')}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-colors',
                      fulfillmentType === 'pickup'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Store className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Tu lay tai cua hang</p>
                      <p className="text-xs text-gray-500">Mien phi</p>
                    </div>
                  </button>
                </div>
                <input type="hidden" {...register('fulfillmentType')} />
              </div>

              {fulfillmentType === 'delivery' && (
                <div className="mt-4">
                  <Input
                    label="Dia chi giao hang"
                    {...register('address')}
                    error={errors.address?.message}
                    placeholder="VD: 123 Duong ABC, Phuong X, Quan Y, TP.HCM"
                  />
                </div>
              )}

              {fulfillmentType === 'pickup' && (
                <div className="mt-4">
                  <Select
                    label="Chon chi nhanh"
                    {...register('branchId')}
                    error={errors.branchId?.message}
                    options={branches.map((b) => ({ value: b._id, label: b.name }))}
                    placeholder="Chon chi nhanh"
                  />
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ghi chu (tuychon)
                </label>
                <textarea
                  {...register('note')}
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="VD: Khong hanh, it duong..."
                />
              </div>
            </motion.div>

            {/* Payment */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Phuong thuc thanh toan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {paymentOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-sm font-medium transition-colors text-left',
                      paymentMethod === opt.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('paymentMethod')} />
            </motion.div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-5 shadow-sm sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Don hang cua ban</h2>

              {/* Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={`${item.food._id}-${item.variantStr}`} className="flex gap-3 text-sm">
                    <img
                      src={item.food.image || 'https://via.placeholder.com/50'}
                      alt={item.food.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.food.name}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium flex-shrink-0">
                      {formatCurrency((item.food.price + (item.variant?.price || 0) + item.toppings.reduce((s, t) => s + (t.price || 0), 0)) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tam tinh</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giam gia ({coupon?.code})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Phi giao hang
                  </span>
                  <span>{fulfillmentType === 'pickup' ? 'Mien phi' : formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Tong cong</span>
                  <span className="text-primary">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" loading={loading} disabled={loading}>
                Dat hang ngay
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
