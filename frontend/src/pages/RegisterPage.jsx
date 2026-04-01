import { useEffect } from 'react'
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
  name: yup.string().required('Ho ten la bat buoc').min(2, 'Ten it nhat 2 ky tu'),
  email: yup.string().required('Email la bat buoc').email('Email khong hop le'),
  phone: yup.string().required('So dien thoai la bat buoc').matches(/^[0-9]{9,11}$/, 'So dien thoai khong hop le'),
  password: yup.string().required('Mat khau la bat buoc').min(6, 'Mat khau it nhat 6 ky tu'),
  confirmPassword: yup
    .string()
    .required('Xac nhan mat khau la bat buoc')
    .oneOf([yup.ref('password')], 'Mat khau khong khop'),
})

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) navigate('/')
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
      const result = await dispatch(
        register({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: 'customer',
        })
      ).unwrap()
      toast.success(`Dang ky thanh cong! Chao mung ${result.user.name}!`)
      navigate('/')
    } catch (error) {
      toast.error(error || 'Dang ky that bai')
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
            <h1 className="text-2xl font-bold text-gray-900">Tao tai khoan moi</h1>
            <p className="text-gray-500 mt-1">Dang ky de dat mon ngay</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Ho va ten"
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
              label="So dien thoai"
              placeholder="09xxxxxxxx"
              {...formRegister('phone')}
              error={errors.phone?.message}
            />
            <Input
              label="Mat khau"
              type="password"
              placeholder="It nhat 6 ky tu"
              {...formRegister('password')}
              error={errors.password?.message}
            />
            <Input
              label="Xac nhan mat khau"
              type="password"
              placeholder="Nhap lai mat khau"
              {...formRegister('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" className="w-full" loading={loading} icon={UserPlus}>
              Dang ky
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-500">
              Da co tai khoan?{' '}
              <Link to="/login" className="text-primary font-medium hover:text-primary-dark">
                Dang nhap
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
