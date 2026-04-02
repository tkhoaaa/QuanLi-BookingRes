import { useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { UserPlus, ChefHat } from 'lucide-react'
import { register } from '../slices/authSlice'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'

const schema = yup.object({
  name: yup.string().required('Họ tên là bắt buộc').min(2, 'Tên ít nhất 2 ký tự'),
  email: yup.string().required('Email là bắt buộc').email('Email không hợp lệ'),
  phone: yup.string().required('Số điện thoại là bắt buộc').matches(/^[0-9]{9,11}$/, 'Số điện thoại không hợp lệ'),
  password: yup.string().required('Mật khẩu là bắt buộc').min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: yup
    .string()
    .required('Xác nhận mật khẩu là bắt buộc')
    .oneOf([yup.ref('password')], 'Mật khẩu không khớp'),
})

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSelector((state) => state.auth)
  const didNavigate = useRef(false)

  // Navigation handled by useEffect to ensure toast renders first
  useEffect(() => {
    if (!isAuthenticated || didNavigate.current) return
    didNavigate.current = true
    toast.success('Đăng ký thành công!')
    navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      await dispatch(
        register({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: 'customer',
        })
      ).unwrap()
      // Navigation is handled by the useEffect above
    } catch (error) {
      toast.error(error || 'Đăng ký thất bại')
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
            <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản mới</h1>
            <p className="text-gray-500 mt-1">Đăng ký để đặt món ngay</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Họ và tên"
              placeholder="Nguyen Van A"
              {...formRegister('name')}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              {...formRegister('email')}
              error={errors.email?.message}
            />
            <Input
              label="Số điện thoại"
              placeholder="09xxxxxxxx"
              {...formRegister('phone')}
              error={errors.phone?.message}
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Ít nhất 6 ký tự"
              {...formRegister('password')}
              error={errors.password?.message}
            />
            <Input
              label="Xác nhận mật khẩu"
              type="password"
              placeholder="Nhập lại mật khẩu"
              {...formRegister('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" className="w-full" loading={loading} icon={UserPlus}>
              Đăng ký
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary font-medium hover:text-primary-dark">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
