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
  name: yup.string().required('Ho ten la bat buoc'),
  phone: yup.string().required('So dien thoai la bat buoc'),
})

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Mat khau hien tai la bat buoc'),
  newPassword: yup.string().required('Mat khau moi la bat buoc').min(6, 'It nhat 6 ky tu'),
  confirmPassword: yup
    .string()
    .required('Xac nhan mat khau la bat buoc')
    .oneOf([yup.ref('newPassword')], 'Mat khau khong khop'),
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
      toast.success('Cap nhat thong tin thanh cong!')
    } catch (error) {
      toast.error(error || 'Cap nhat that bai')
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
      toast.success('Doi mat khau thanh cong!')
      passwordForm.reset()
    } catch (error) {
      toast.error(error || 'Doi mat khau that bai')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'profile', label: 'Thong tin ca nhan', icon: User },
    { key: 'password', label: 'Doi mat khau', icon: Lock },
    { key: 'addresses', label: 'Dia chi', icon: MapPin },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tai khoan cua toi</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 p-3 mb-2">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <hr className="my-2" />
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
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
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              {activeTab === 'profile' && (
                <>
                  <h2 className="font-semibold text-gray-900 mb-4">Thong tin ca nhan</h2>
                  <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4 max-w-md">
                    <Input
                      label="Ho va ten"
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
                      label="So dien thoai"
                      {...profileForm.register('phone')}
                      error={profileForm.formState.errors.phone?.message}
                    />
                    <Button type="submit" loading={loading}>Luu thay doi</Button>
                  </form>
                </>
              )}

              {activeTab === 'password' && (
                <>
                  <h2 className="font-semibold text-gray-900 mb-4">Doi mat khau</h2>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 max-w-md">
                    <Input
                      label="Mat khau hien tai"
                      type="password"
                      {...passwordForm.register('currentPassword')}
                      error={passwordForm.formState.errors.currentPassword?.message}
                    />
                    <Input
                      label="Mat khau moi"
                      type="password"
                      {...passwordForm.register('newPassword')}
                      error={passwordForm.formState.errors.newPassword?.message}
                    />
                    <Input
                      label="Xac nhan mat khau moi"
                      type="password"
                      {...passwordForm.register('confirmPassword')}
                      error={passwordForm.formState.errors.confirmPassword?.message}
                    />
                    <Button type="submit" loading={loading}>Doi mat khau</Button>
                  </form>
                </>
              )}

              {activeTab === 'addresses' && (
                <>
                  <h2 className="font-semibold text-gray-900 mb-4">Dia chi giao hang</h2>
                  {user?.addresses?.length > 0 ? (
                    <div className="space-y-3">
                      {user.addresses.map((addr, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{addr.label}</p>
                            <p className="text-sm text-gray-500">{addr.fullAddress}</p>
                            {addr.isDefault && (
                              <span className="text-xs text-primary font-medium">Mac dinh</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Chua co dia chi nao duoc luu.</p>
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
