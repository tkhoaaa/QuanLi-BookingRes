import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { UserPlus, Truck } from 'lucide-react'
import { register } from '../slices/authSlice'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'

const SHIPPER_KEY = 'SHIPPERNHAHANGVIET'

const schema = yup.object({
  shipperKey: yup.string().required('Ma xac thuc shipper la bat buoc'),
  name: yup.string().required('Ho ten la bat buoc').min(2, 'Ten it nhat 2 ky tu'),
  email: yup.string().required('Email la bat buoc').email('Email khong hop le'),
  phone: yup.string().required('So dien thoai la bat buoc').matches(/^[0-9]{9,11}$/, 'So dien thoai khong hop le'),
  password: yup.string().required('Mat khau la bat buoc').min(6, 'Mat khau it nhat 6 ky tu'),
  confirmPassword: yup
    .string()
    .required('Xac nhan mat khau la bat buoc')
    .oneOf([yup.ref('password')], 'Mat khau khong khop'),
})

export default function RegisterShipperPage() {
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
    if (data.shipperKey !== SHIPPER_KEY) {
      toast.error('Ma xac thuc shipper khong dung')
      return
    }
    try {
      const result = await dispatch(
        register({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: 'shipper',
        })
      ).unwrap()
      toast.success(`Dang ky shipper thanh cong! Chao mung ${result.user.name}!`)
      navigate('/shipper')
    } catch (error) {
      toast.error(error || 'Dang ky that bai')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <Truck className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Dang ky Shipper</h1>
            <p className="text-gray-500 mt-1 text-sm">Dang ky tai khoan giao hang</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                Vui long nhap ma xac thuc shipper de tiep tuc. Ma: <code className="font-mono font-bold">SHIPPERNHAHANGVIET</code>
              </p>
            </div>

            <Input
              label="Ma xac thuc shipper"
              placeholder="Nhap ma bi mat"
              {...formRegister('shipperKey')}
              error={errors.shipperKey?.message}
            />
            <Input
              label="Ho va ten"
              placeholder="Nguyen Van B"
              {...formRegister('name')}
              error={errors.name?.message}
            />
            <Input
              label="Email"
              type="email"
              placeholder="shipper@example.com"
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
              Dang ky Shipper
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/register" className="text-primary hover:text-primary-dark">
              Dang ky khach hang
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
