import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, CreditCard, Truck, Store, Sparkles, ChevronRight, ChevronLeft, Check, Tag, X, Minus, Plus } from 'lucide-react'
import { createOrder } from '../slices/ordersSlice'
import { selectCartItems, selectCartTotal, clearCart, removeItem, updateQuantity, setCoupon } from '../slices/cartSlice'
import { formatCurrency, cn, resolveFoodImage } from '../lib/utils'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import axiosClient from '../api/axiosClient'

const STEPS = [
  { id: 1, label: 'Thong tin' },
  { id: 2, label: 'Thanh toan' },
  { id: 3, label: 'Xac nhan' },
]

const schemaStep1 = yup.object({
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
  note: yup.string(),
})

const schemaStep2 = yup.object({
  paymentMethod: yup.string().required('Chon phuong thuc thanh toan'),
})

export default function CheckoutPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const items = useSelector(selectCartItems)
  const total = useSelector(selectCartTotal)
  const { coupon } = useSelector((state) => state.cart)
  const { user } = useSelector((state) => state.auth)
  const { loading } = useSelector((state) => state.orders)

  const [currentStep, setCurrentStep] = useState(1)
  const [fulfillmentType, setFulfillmentType] = useState('delivery')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [branches, setBranches] = useState([])

  // Coupon state
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  useEffect(() => {
    axiosClient.get('/branches').then(res => {
      setBranches(res.data.data || [])
    }).catch(() => setBranches([]))
  }, [])

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
  } = useForm({
    resolver: yupResolver(schemaStep1),
    defaultValues: {
      fullName: user?.name || '',
      phone: user?.phone || '',
      address: user?.addresses?.[0] || '',
      fulfillmentType: 'delivery',
      note: '',
    },
  })

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2 },
  } = useForm({
    resolver: yupResolver(schemaStep2),
    defaultValues: {
      paymentMethod: 'COD',
    },
  })

  const discount = coupon?.discount || 0
  const discountAmount = discount > 0 ? Math.round(total * (discount / 100)) : 0
  const deliveryFee = fulfillmentType === 'delivery' ? 15000 : 0
  const grandTotal = Math.max(0, total - discountAmount + deliveryFee)

  // Step navigation
  const goNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length))
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 1))

  // Coupon validation
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
        discount: data.discount || data.discountAmount,
        discountType: data.discountType || (data.discount ? 'percent' : 'fixed'),
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

  const onStep1Valid = (data) => {
    setFulfillmentType(data.fulfillmentType)
    goNext()
  }

  const onStep2Valid = (data) => {
    setPaymentMethod(data.paymentMethod)
    goNext()
  }

  const onPlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Gio hang trong')
      return
    }

    try {
      const formData = useForm ? {} : {}
      const shippingAddress = fulfillmentType === 'delivery'
        ? {
            name: user?.name || '',
            phone: user?.phone || '',
            address: '',
          }
        : null

      const orderData = {
        fulfillmentType,
        paymentMethod,
        shippingAddress,
        branchId: fulfillmentType === 'pickup' ? '' : undefined,
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
      toast.error(error?.message || error || 'Dat hang that bai. Vui long thu lai.')
    }
  }

  const paymentOptions = [
    { value: 'COD', label: 'Tien mat', icon: '💵' },
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
          <p className="text-charcoal-500">Gio hang trong. Vui long them mon an truoc.</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Quay lai thuc don
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
            <h1 className="text-2xl font-bold text-charcoal-900 font-heading">Thanh toan</h1>
            <p className="text-sm text-charcoal-500">Kiem tra va xac nhan don hang cua ban</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-0">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-charcoal-200 text-charcoal-500'
                    )}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={cn(
                    'text-xs mt-1.5 font-medium',
                    currentStep >= step.id ? 'text-charcoal-900' : 'text-charcoal-400'
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    'w-16 h-0.5 mx-1 -mt-5 transition-colors',
                    currentStep > step.id ? 'bg-green-500' : 'bg-charcoal-200'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Step Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-2xl p-5 shadow-card">
                    <h2 className="font-semibold text-charcoal-900 mb-4 flex items-center gap-2 font-heading">
                      <MapPin className="w-5 h-5 text-primary" />
                      Thong tin nhan hang
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Ho va ten"
                        placeholder="Nhap ho va ten"
                        {...registerStep1('fullName')}
                        error={errorsStep1.fullName?.message}
                      />
                      <Input
                        label="So dien thoai"
                        placeholder="09xxxxxxxx"
                        {...registerStep1('phone')}
                        error={errorsStep1.phone?.message}
                      />
                    </div>

                    {/* Fulfillment Type */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-charcoal-700 mb-2.5">
                        Hinh thuc nhan hang
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setFulfillmentType('delivery')
                            registerStep1('fulfillmentType').onChange({ target: { value: 'delivery' } })
                          }}
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
                            <p className="font-semibold text-sm">Giao hang</p>
                            <p className="text-xs opacity-70">Phi {formatCurrency(15000)}</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFulfillmentType('pickup')
                            registerStep1('fulfillmentType').onChange({ target: { value: 'pickup' } })
                          }}
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
                            <p className="font-semibold text-sm">Tu lay tai cua hang</p>
                            <p className="text-xs opacity-70">Mien phi</p>
                          </div>
                        </button>
                      </div>
                      <input type="hidden" {...registerStep1('fulfillmentType')} />
                    </div>

                    {fulfillmentType === 'delivery' && (
                      <div className="mt-4">
                        <Input
                          label="Dia chi giao hang"
                          placeholder="VD: 123 Duong ABC, Phuong X, Quan Y, TP.HCM"
                          {...registerStep1('address')}
                          error={errorsStep1.address?.message}
                        />
                      </div>
                    )}

                    {fulfillmentType === 'pickup' && (
                      <div className="mt-4">
                        <Select
                          label="Chon chi nhanh"
                          {...registerStep1('branchId')}
                          error={errorsStep1.branchId?.message}
                          options={branches.map((b) => ({ value: b._id, label: b.name }))}
                          placeholder="Chon chi nhanh"
                        />
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
                        Ghi chu (tuy chon)
                      </label>
                      <textarea
                        {...registerStep1('note')}
                        rows={2}
                        className="w-full px-4 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                        placeholder="VD: Khong hanh, it duong..."
                      />
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-end">
                    <Button
                      size="lg"
                      onClick={handleSubmitStep1(onStep1Valid)}
                      icon={ChevronRight}
                      iconPosition="right"
                    >
                      Tiep tuc
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-2xl p-5 shadow-card">
                    <h2 className="font-semibold text-charcoal-900 mb-4 flex items-center gap-2 font-heading">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Phuong thuc thanh toan
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
                    <input type="hidden" {...registerStep2('paymentMethod')} />
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={goBack}
                      icon={ChevronLeft}
                      iconPosition="left"
                    >
                      Quay lai
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleSubmitStep2(onStep2Valid)}
                      icon={ChevronRight}
                      iconPosition="right"
                    >
                      Tiep tuc
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Order Review */}
                  <div className="bg-white rounded-2xl p-5 shadow-card">
                    <h2 className="font-semibold text-charcoal-900 mb-4 flex items-center gap-2 font-heading">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Xac nhan don hang
                    </h2>

                    {/* Delivery Info Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 pb-4 border-b border-charcoal-100">
                      <div>
                        <p className="text-xs text-charcoal-500 mb-1">Nguoi nhan</p>
                        <p className="text-sm font-medium text-charcoal-900">
                          {user?.name || '-'} | {user?.phone || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-charcoal-500 mb-1">Hinh thuc</p>
                        <p className="text-sm font-medium text-charcoal-900">
                          {fulfillmentType === 'delivery' ? 'Giao hang' : 'Tu lay tai cua hang'}
                          {fulfillmentType === 'pickup' && branches.length > 0 && (
                            <span> - {branches.find(b => b._id === ''?.branchId)?.name || ''}</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-charcoal-500 mb-1">Thanh toan</p>
                        <p className="text-sm font-medium text-charcoal-900">
                          {paymentOptions.find(o => o.value === paymentMethod)?.label || paymentMethod}
                        </p>
                      </div>
                    </div>

                    {/* Editable items */}
                    <div className="space-y-3 max-h-72 overflow-y-auto">
                      <p className="text-xs text-charcoal-500 font-medium mb-2">MON HANG</p>
                      {items.map((item, index) => (
                        <div key={`${item.food._id}-${item.variantStr}-${index}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-charcoal-50 transition-colors">
                          <img
                            src={resolveFoodImage(item.food.images, 'https://via.placeholder.com/50?text=Food')}
                            alt={item.food.name}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-charcoal-900 truncate">{item.food.name}</p>
                            <p className="text-xs text-charcoal-500">{formatCurrency(item.food.price)} x {item.quantity}</p>
                          </div>
                          <span className="text-sm font-semibold text-charcoal-900 flex-shrink-0">
                            {formatCurrency(
                              (item.food.price + (item.variant?.price || 0) + item.toppings.reduce((s, t) => s + (t.price || 0), 0)) * item.quantity
                            )}
                          </span>
                          <div className="flex items-center bg-charcoal-100 rounded-lg overflow-hidden flex-shrink-0">
                            <button
                              onClick={() => dispatch(updateQuantity({ index, quantity: Math.max(1, item.quantity - 1) }))}
                              className="w-7 h-7 flex items-center justify-center hover:bg-charcoal-200 transition-colors"
                            >
                              <Minus className="w-3 h-3 text-charcoal-600" />
                            </button>
                            <span className="w-8 text-center font-semibold text-charcoal-900 text-xs">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => dispatch(updateQuantity({ index, quantity: item.quantity + 1 }))}
                              className="w-7 h-7 flex items-center justify-center hover:bg-charcoal-200 transition-colors"
                            >
                              <Plus className="w-3 h-3 text-charcoal-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={goBack}
                      icon={ChevronLeft}
                      iconPosition="left"
                    >
                      Quay lai
                    </Button>
                    <Button
                      size="lg"
                      onClick={onPlaceOrder}
                      loading={loading}
                      disabled={loading}
                      className="bg-secondary hover:bg-secondary-dark"
                    >
                      Dat hang ngay
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Order Summary (sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-5 shadow-card sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-secondary" />
                <h2 className="font-bold text-charcoal-900 font-heading">Don hang cua ban</h2>
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
                      <span className="text-xs">-{discountAmount > 0 ? formatCurrency(discountAmount) : discount}</span>
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
                        placeholder="Nhap ma giam gia"
                        className="flex-1 px-3 py-2.5 text-sm border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <Button size="sm" onClick={handleApplyCoupon} loading={couponLoading}>
                        Ap dung
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 mt-1">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="space-y-2.5 text-sm border-t border-charcoal-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Tam tinh</span>
                  <span className="text-charcoal-700">{formatCurrency(total)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giam gia ({coupon?.code})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Phi giao hang</span>
                  <span className={fulfillmentType === 'pickup' ? 'text-green-600' : 'text-charcoal-700'}>
                    {fulfillmentType === 'pickup' ? 'Mien phi' : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2.5 border-t border-charcoal-100">
                  <span className="text-charcoal-900">Tong cong</span>
                  <span className="text-secondary font-heading">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {currentStep === 3 && (
                <p className="text-xs text-charcoal-400 text-center mt-3">
                  Ban co the huy don hang trong 5 phut dau tien
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
