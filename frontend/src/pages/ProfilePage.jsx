import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { User, Lock, MapPin, Bell, Trophy, Medal, Award, Copy, Gift, Zap, Truck, Percent, Coins, ChevronLeft, ChevronRight, Ticket } from 'lucide-react'
import { updateProfile, changePassword } from '../slices/authSlice'
import { fetchMyLoyalty, fetchPointsHistory, redeemPoints, clearRedeemResult } from '../slices/loyaltySlice'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'
import { TIER_BENEFITS, TIER_THRESHOLDS, MEMBER_TIERS } from '../constants'
import { formatCurrency } from '../lib/utils'

const TIER_LABELS = {
  [MEMBER_TIERS.BRONZE]: 'Đồng',
  [MEMBER_TIERS.SILVER]: 'Bạc',
  [MEMBER_TIERS.GOLD]: 'Vàng',
  [MEMBER_TIERS.DIAMOND]: 'Kim Cương',
}

const TIER_COLORS = {
  [MEMBER_TIERS.BRONZE]: '#cd7f32',
  [MEMBER_TIERS.SILVER]: '#c0c0c0',
  [MEMBER_TIERS.GOLD]: '#ffd700',
  [MEMBER_TIERS.DIAMOND]: '#b9f2ff',
}

const TIER_ICONS = {
  [MEMBER_TIERS.BRONZE]: Award,
  [MEMBER_TIERS.SILVER]: Medal,
  [MEMBER_TIERS.GOLD]: Trophy,
  [MEMBER_TIERS.DIAMOND]: Trophy,
}

const POINTS_TO_REDEEM = 100
const REDEEM_VALUE = 10000

const profileSchema = yup.object({
  name: yup.string().required('Họ tên là bắt buộc'),
  phone: yup.string().required('Số điện thoại là bắt buộc'),
})

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Mật khẩu hiện tại là bắt buộc'),
  newPassword: yup.string().required('Mật khẩu mới là bắt buộc').min(6, 'Ít nhất 6 ký tự'),
  confirmPassword: yup
    .string()
    .required('Xác nhận mật khẩu là bắt buộc')
    .oneOf([yup.ref('newPassword')], 'Mật khẩu không khớp'),
})

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { loyalty, history, historyPagination, loading: loyaltyLoading, historyLoading, redeemLoading, redeemResult } = useSelector((state) => state.loyalty)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [redeemInput, setRedeemInput] = useState('')
  const [showRedeemConfirm, setShowRedeemConfirm] = useState(false)
  const [referralCode] = useState('NHAVIEN2026')

  useEffect(() => {
    if (activeTab === 'membership') {
      dispatch(fetchMyLoyalty())
      dispatch(fetchPointsHistory({ page: 1, limit: 20 }))
    }
  }, [activeTab, dispatch])

  useEffect(() => {
    return () => {
      dispatch(clearRedeemResult())
    }
  }, [dispatch])

  const currentTier = loyalty?.memberTier || 'bronze'
  const tierColor = TIER_COLORS[currentTier]
  const TierIcon = TIER_ICONS[currentTier]
  const benefits = loyalty?.benefits || TIER_BENEFITS[currentTier]
  const progress = loyalty?.progress || 0

  const handleRedeemSubmit = async () => {
    const points = parseInt(redeemInput, 10)
    if (isNaN(points) || points < 100) {
      toast.error('Tối thiểu 100 điểm để đổi')
      return
    }
    setShowRedeemConfirm(true)
  }

  const confirmRedeem = async () => {
    const points = parseInt(redeemInput, 10)
    try {
      await dispatch(redeemPoints(points)).unwrap()
      toast.success('Đổi điểm thành công!')
      setRedeemInput('')
      setShowRedeemConfirm(false)
      dispatch(fetchMyLoyalty())
      dispatch(fetchPointsHistory({ page: 1, limit: 20 }))
    } catch (error) {
      toast.error(error || 'Đổi điểm thất bại')
    }
  }

  const redeemDiscount = redeemInput
    ? Math.floor(parseInt(redeemInput, 10) / POINTS_TO_REDEEM) * REDEEM_VALUE
    : 0

  const profileForm = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  })

  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
  })

  const handleProfileSubmit = async (data) => {
    setLoading(true)
    try {
      await dispatch(updateProfile(data)).unwrap()
      toast.success('Cập nhật thông tin thành công!')
    } catch (error) {
      toast.error(error || 'Cập nhật thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (data) => {
    setLoading(true)
    try {
      await dispatch(changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })).unwrap()
      toast.success('Đổi mật khẩu thành công!')
      passwordForm.reset()
    } catch (error) {
      toast.error(error || 'Đổi mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'profile', label: 'Thông tin cá nhân', icon: User },
    { key: 'password', label: 'Đổi mật khẩu', icon: Lock },
    { key: 'addresses', label: 'Địa chỉ', icon: MapPin },
    { key: 'membership', label: 'Thành viên', icon: Trophy },
  ]

  const nextThreshold = loyalty?.nextTierThreshold || null
  const nextTierLabel = loyalty?.nextTierLabel || null

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-charcoal-900 font-heading mb-6">Tài khoản của tôi</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-3 p-3 mb-2">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-charcoal-900">{user?.name}</p>
                  <p className="text-xs text-charcoal-500">{user?.email}</p>
                </div>
              </div>
              <hr className="my-2 border-charcoal-100" />
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary text-white'
                      : 'text-charcoal-600 hover:bg-charcoal-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-card"
            >
              {activeTab === 'profile' && (
                <>
                  <h2 className="font-semibold text-charcoal-900 mb-4">Thông tin cá nhân</h2>
                  <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4 max-w-md">
                    <Input
                      label="Họ và tên"
                      {...profileForm.register('name')}
                      error={profileForm.formState.errors.name?.message}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                    />
                    <Input
                      label="Số điện thoại"
                      {...profileForm.register('phone')}
                      error={profileForm.formState.errors.phone?.message}
                    />
                    <Button type="submit" loading={loading}>Lưu thay đổi</Button>
                  </form>
                </>
              )}

              {activeTab === 'password' && (
                <>
                  <h2 className="font-semibold text-charcoal-900 mb-4">Đổi mật khẩu</h2>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 max-w-md">
                    <Input
                      label="Mật khẩu hiện tại"
                      type="password"
                      {...passwordForm.register('currentPassword')}
                      error={passwordForm.formState.errors.currentPassword?.message}
                    />
                    <Input
                      label="Mật khẩu mới"
                      type="password"
                      {...passwordForm.register('newPassword')}
                      error={passwordForm.formState.errors.newPassword?.message}
                    />
                    <Input
                      label="Xác nhận mật khẩu mới"
                      type="password"
                      {...passwordForm.register('confirmPassword')}
                      error={passwordForm.formState.errors.confirmPassword?.message}
                    />
                    <Button type="submit" loading={loading}>Đổi mật khẩu</Button>
                  </form>
                </>
              )}

              {activeTab === 'addresses' && (
                <>
                  <h2 className="font-semibold text-charcoal-900 mb-4">Địa chỉ giao hàng</h2>
                  {user?.addresses?.length > 0 ? (
                    <div className="space-y-3">
                      {user.addresses.map((addr, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-charcoal-200 rounded-xl">
                          <div>
                            <p className="font-medium text-charcoal-900">{addr.label}</p>
                            <p className="text-sm text-charcoal-500">{addr.fullAddress}</p>
                            {addr.isDefault && (
                              <span className="text-xs text-primary font-medium">Mặc định</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-charcoal-500">Chưa có địa chỉ nào được lưu.</p>
                  )}
                </>
              )}

              {activeTab === 'membership' && (
                <>
                  <h2 className="font-semibold text-charcoal-900 mb-4">Thành viên</h2>

                  {/* Loyalty Points Card */}
                  <div className="bg-gradient-to-br from-charcoal-900 to-charcoal-800 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: `${tierColor}20`, border: `1px solid ${tierColor}50` }}
                        >
                          <TierIcon className="w-7 h-7" style={{ color: tierColor }} />
                        </div>
                        <div>
                          <p className="text-xs text-white/60 uppercase tracking-wide">Hạng thành viên</p>
                          <p className="text-2xl font-bold font-heading" style={{ color: tierColor }}>
                            {TIER_LABELS[currentTier]}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-white/60 mb-1">Điểm tích lũy</p>
                          <p className="text-3xl font-bold font-heading">
                            {loyaltyLoading ? '...' : (loyalty?.points || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-white/60 mt-1">điểm</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Tổng chi tiêu</p>
                          <p className="text-xl font-bold font-heading">
                            {loyaltyLoading ? '...' : formatCurrency(loyalty?.totalSpent || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tier Progress */}
                  {nextThreshold && loyalty?.pointsToNextTier > 0 && (
                    <div className="bg-white border border-charcoal-200 rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-charcoal-700">Tiến đến {nextTierLabel}</p>
                        <p className="text-sm font-semibold text-charcoal-900">{progress}%</p>
                      </div>
                      <div className="w-full bg-charcoal-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${progress}%`, backgroundColor: tierColor }}
                        />
                      </div>
                      <p className="text-xs text-charcoal-400 mt-1.5">
                        {formatCurrency(loyalty?.pointsToNextTier || 0)} nữa để lên hạng
                      </p>
                    </div>
                  )}

                  {/* Tier Benefits */}
                  <div className="bg-white border border-charcoal-200 rounded-2xl p-4 mb-4">
                    <h3 className="font-semibold text-charcoal-900 mb-3">Quyền lợi hạng {TIER_LABELS[currentTier]}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-charcoal-900">Tích điểm</p>
                          <p className="text-xs text-charcoal-500">Tích {benefits?.pointsRate || 1} điểm / 10,000đ</p>
                        </div>
                      </div>
                      {benefits?.freeDelivery && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Truck className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-charcoal-900">Miễn phí giao hàng</p>
                            <p className="text-xs text-charcoal-500">Giao hàng miễn phí cho mọi đơn</p>
                          </div>
                        </div>
                      )}
                      {benefits?.discount > 0 && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Percent className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-charcoal-900">Giảm giá {benefits.discount}%</p>
                            <p className="text-xs text-charcoal-500">Giảm {benefits.discount}% trên tổng đơn hàng</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Redeem Points */}
                  <div className="bg-white border border-charcoal-200 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Coins className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-charcoal-900">Đổi điểm</h3>
                    </div>
                    <div className="bg-charcoal-50 rounded-xl p-3 mb-3">
                      <p className="text-xs text-charcoal-500 mb-1">Tỷ lệ đổi</p>
                      <p className="text-sm font-semibold text-charcoal-900">
                        {POINTS_TO_REDEEM} điểm = {formatCurrency(REDEEM_VALUE)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="number"
                        min="0"
                        max={loyalty?.points || 0}
                        value={redeemInput}
                        onChange={(e) => setRedeemInput(e.target.value)}
                        placeholder="Nhập số điểm muốn đổi (bội số của 100)"
                        className="flex-1 px-3 py-2.5 bg-white border border-charcoal-200 rounded-xl text-sm text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    {redeemInput > 0 && (
                      <div className="bg-green-50 rounded-xl p-3 mb-3 flex items-center justify-between">
                        <span className="text-sm text-charcoal-700">Giảm giá nhận được:</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(redeemDiscount)}
                        </span>
                      </div>
                    )}
                    <Button
                      onClick={handleRedeemSubmit}
                      loading={redeemLoading}
                      disabled={!redeemInput || parseInt(redeemInput, 10) < 100 || parseInt(redeemInput, 10) > (loyalty?.points || 0)}
                      className="w-full"
                    >
                      Đổi điểm
                    </Button>

                    {/* Redeem confirmation modal */}
                    {showRedeemConfirm && (
                      <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-sm text-charcoal-800 mb-3">
                          Xác nhận đổi <strong>{parseInt(redeemInput, 10).toLocaleString()} điểm</strong> lấy voucher{' '}
                          <strong>{formatCurrency(redeemDiscount)}</strong>?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={confirmRedeem}
                            loading={redeemLoading}
                            className="flex-1"
                          >
                            Xác nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowRedeemConfirm(false)}
                            className="flex-1"
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Redeem result */}
                    {redeemResult && (
                      <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Ticket className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-semibold text-green-700">Đổi điểm thành công!</p>
                        </div>
                        <p className="text-xs text-charcoal-600 mb-1">Mã voucher của bạn:</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white rounded-lg px-3 py-2 font-mono font-bold text-charcoal-900 text-sm">
                            {redeemResult.coupon.code}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Copy}
                            onClick={() => {
                              navigator.clipboard.writeText(redeemResult.coupon.code)
                              toast.success('Đã sao chép mã voucher!')
                            }}
                          >
                            Sao chép
                          </Button>
                        </div>
                        <p className="text-xs text-charcoal-500 mt-2">
                          Giảm {formatCurrency(redeemResult.coupon.value)} - Sử dụng trước{' '}
                          {new Date(redeemResult.coupon.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Points History */}
                  <div className="bg-white border border-charcoal-200 rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-charcoal-900">Lịch sử tích điểm</h3>
                      <span className="text-xs text-charcoal-400">
                        {historyPagination ? `${historyPagination.total} giao dịch` : ''}
                      </span>
                    </div>
                    {historyLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse flex items-center justify-between py-2">
                            <div className="h-4 bg-charcoal-100 rounded w-24" />
                            <div className="h-4 bg-charcoal-100 rounded w-16" />
                          </div>
                        ))}
                      </div>
                    ) : history.length > 0 ? (
                      <>
                        <div className="space-y-2">
                          {history.map((entry) => (
                            <div key={entry._id} className="flex items-center justify-between py-2 border-b border-charcoal-100 last:border-0">
                              <div className="min-w-0">
                                <span className={`text-sm font-bold ${entry.type === 'redeem' ? 'text-red-500' : entry.type === 'adjust' ? 'text-blue-500' : 'text-green-600'}`}>
                                  {entry.points > 0 ? '+' : ''}{entry.points} điểm
                                </span>
                                <p className="text-xs text-charcoal-500 truncate">{entry.description || (entry.type === 'redeem' ? 'Đổi điểm' : 'Tích điểm')}</p>
                              </div>
                              <span className="text-xs text-charcoal-400 flex-shrink-0 ml-2">
                                {new Date(entry.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Pagination */}
                        {historyPagination && historyPagination.pages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-charcoal-100">
                            <button
                              onClick={() => {
                                const newPage = historyPage - 1
                                setHistoryPage(newPage)
                                dispatch(fetchPointsHistory({ page: newPage, limit: 20 }))
                              }}
                              disabled={historyPage <= 1}
                              className="p-1.5 rounded-lg border border-charcoal-200 disabled:opacity-40 hover:bg-charcoal-50"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-charcoal-500">
                              {historyPage} / {historyPagination.pages}
                            </span>
                            <button
                              onClick={() => {
                                const newPage = historyPage + 1
                                setHistoryPage(newPage)
                                dispatch(fetchPointsHistory({ page: newPage, limit: 20 }))
                              }}
                              disabled={historyPage >= historyPagination.pages}
                              className="p-1.5 rounded-lg border border-charcoal-200 disabled:opacity-40 hover:bg-charcoal-50"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-charcoal-400 text-center py-4">Chưa có lịch sử tích điểm.</p>
                    )}
                  </div>

                  {/* Referral Code */}
                  <div className="bg-white border border-charcoal-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-charcoal-900">Mã giới thiệu</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-charcoal-50 rounded-xl px-4 py-2.5 font-mono font-semibold text-charcoal-900 tracking-wider">
                        {referralCode}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Copy}
                        onClick={() => {
                          navigator.clipboard.writeText(referralCode)
                          toast.success('Đã sao chép mã giới thiệu!')
                        }}
                      >
                        Sao chép
                      </Button>
                    </div>
                    <p className="text-xs text-charcoal-400 mt-2">Giới thiệu bạn bè và nhận 100 điểm thưởng cho mỗi người đặt hàng thành công.</p>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
