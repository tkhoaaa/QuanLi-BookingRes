import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { UserPlus, ChefHat, ShieldCheck } from 'lucide-react'
import { register } from '../slices/authSlice'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'

const ADMIN_KEY = 'ADMINNHAHANGVIET'

const schema = yup.object({
  adminKey: yup.string().required('Mã xác thực quản lý là bắt buộc'),
  name: yup.string().required('Họ tên là bắt buộc').min(2, 'Tên ít nhất 2 ký tự'),
  email: yup.string().required('Email là bắt buộc').email('Email không hợp lệ'),
  phone: yup.string().required('Số điện thoại là bắt buộc').matches(/^[0-9]{9,11}$/, 'Số điện thoại không hợp lệ'),
  password: yup.string().required('Mật khẩu là bắt buộc').min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: yup
    .string()
    .required('Xác nhận mật khẩu là bắt buộc')
    .oneOf([yup.ref('password')], 'Mật khẩu không khớp'),
})

export default function RegisterAdminPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector((state) => state.auth)

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data) => {
    if (data.adminKey !== ADMIN_KEY) {
      toast.error('Mã xác thực quản lý không đúng')
      return
    }
    try {
      const result = await dispatch(
        register({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: 'admin',
        })
      ).unwrap()
      toast.success(`Đăng ký quản lý thành công! Chào mừng ${result.user.name}!`)
      navigate('/admin')
    } catch (error) {
      toast.error(error || 'Đăng ký thất bại')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Đăng ký Quản lý</h1>
            <p className="text-gray-500 mt-1 text-sm">Đăng ký tài khoản quản trị hệ thống</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                Vui lòng nhập mã xác thực quản lý để tiếp tục. Mã: <code className="font-mono font-bold">ADMINNHAHANGVIET</code>
              </p>
            </div>

            <Input
              label="Mã xác thực quản lý"
              placeholder="Nhập mã bí mật"
              {...formRegister('adminKey')}
              error={errors.adminKey?.message}
            />
            <Input
              label="Họ và tên"
              placeholder="Nguyen Van A"
              {...formRegister('name')}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              placeholder="admin@example.com"
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
              Đăng ký Quản lý
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/register" className="text-primary hover:text-primary-dark">
              Đăng ký khách hàng
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
