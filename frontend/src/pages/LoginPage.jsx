import { useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { LogIn, ChefHat } from 'lucide-react'
import { login } from '../slices/authSlice'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'

const schema = yup.object({
  email: yup.string().required('Email là bắt buộc').email('Email không hợp lệ'),
  password: yup.string().required('Mật khẩu là bắt buộc').min(6, 'Mật khẩu ít nhất 6 ký tự'),
})

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, isAuthenticated, user } = useSelector((state) => state.auth)

  // Prevent double-fire from React StrictMode
  const didNavigate = useRef(false)

  const from = location.state?.from?.pathname || '/'

  // Only navigate after a login action succeeds — guard against StrictMode mount
  useEffect(() => {
    if (!isAuthenticated || didNavigate.current) return
    didNavigate.current = true

    if (user?.role === 'admin' || user?.role === 'manager') {
      navigate('/admin', { replace: true })
    } else if (user?.role === 'shipper') {
      navigate('/shipper', { replace: true })
    } else {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, user, navigate, from])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      await dispatch(login(data)).unwrap()
      toast.success(`Chào mừng ${data.email}!`, {
        duration: 4000,
        position: 'top-center',
      })
      // Navigation is handled by the useEffect above
    } catch (error) {
      toast.error(error || 'Đăng nhập thất bại')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <ChefHat className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Chào mừng trở lại</h1>
            <p className="text-gray-500 mt-1">Đăng nhập vào tài khoản của bạn</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu"
              {...register('password')}
              error={errors.password?.message}
            />

            <Button type="submit" className="w-full" loading={loading} icon={LogIn}>
              Đăng nhập
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-500">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-primary font-medium hover:text-primary-dark">
                Đăng ký ngay
              </Link>
            </p>
            <div className="mt-3 flex justify-center gap-4 text-xs text-gray-400">
              <Link to="/register-admin" className="hover:text-gray-600">
                Đăng ký Quản lý
              </Link>
              <Link to="/register-shipper" className="hover:text-gray-600">
                Đăng ký Shipper
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
