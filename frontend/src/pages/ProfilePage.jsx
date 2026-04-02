import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { User, Lock, MapPin, Bell } from 'lucide-react'
import { updateProfile, changePassword } from '../slices/authSlice'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'

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
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)

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
  ]

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
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
