import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import axiosClient from '../../api/axiosClient'
import toast from 'react-hot-toast'
import { CATEGORIES } from '../../constants'

const schema = yup.object({
  name: yup.string().required('Tên món ăn là bắt buộc'),
  description: yup.string().required('Mô tả là bắt buộc'),
  price: yup.number().typeError('Giá phải là số').required('Giá là bắt buộc').positive('Giá phải lớn hơn 0'),
  category: yup.string().required('Danh mục là bắt buộc'),
  images: yup.array().of(yup.string()),
  isAvailable: yup.boolean(),
})

export default function FoodFormModal({ isOpen, onClose, onSubmit, food, isSubmitting }) {
  const [uploadLoading, setUploadLoading] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      category: '',
      images: [],
      isAvailable: true,
    },
  })

  useEffect(() => {
    if (food) {
      reset({
        name: food.name || '',
        description: food.description || '',
        price: food.price || '',
        category: food.category || '',
        images: food.images || [],
        isAvailable: food.isAvailable ?? true,
      })
    } else {
      reset({
        name: '',
        description: '',
        price: '',
        category: '',
        images: [],
        isAvailable: true,
      })
    }
  }, [food, reset, isOpen])

  const watchImages = watch('images') || []
  const categoryOptions = CATEGORIES.map((c) => ({ value: c.value, label: c.label }))

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await axiosClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const url = res.data.data?.url || res.data.url
      if (url) {
        const current = watchImages || []
        setValue('images', [...current, url])
        toast.success('Tải ảnh lên thành công')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tải ảnh thất bại')
    } finally {
      setUploadLoading(false)
      e.target.value = ''
    }
  }

  const handleAddUrl = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const url = e.target.value.trim()
      if (url) {
        const current = watchImages || []
        if (!current.includes(url)) {
          setValue('images', [...current, url])
        }
        e.target.value = ''
      }
    }
  }

  const handleRemoveImage = (index) => {
    const current = [...(watchImages || [])]
    current.splice(index, 1)
    setValue('images', current)
  }

  const onFormSubmit = (data) => {
    onSubmit({ ...data, images: data.images || [] })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={food ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 order-2 sm:order-1"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="food-form"
            loading={isSubmitting}
            className="flex-1 order-1 sm:order-2"
          >
            {food ? 'Lưu thay đổi' : 'Thêm món ăn'}
          </Button>
        </div>
      }
    >
      <form id="food-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tên món ăn"
            {...register('name')}
            error={errors.name?.message}
            placeholder="VD: Cơm rang dĩa gà"
          />
          <Input
            label="Giá (VND)"
            type="number"
            {...register('price')}
            error={errors.price?.message}
            placeholder="VD: 45000"
          />
        </div>

        <Select
          label="Danh mục"
          {...register('category')}
          error={errors.category?.message}
          options={categoryOptions}
          placeholder="Chọn danh mục"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            placeholder="Mô tả món ăn..."
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Hình ảnh</label>

          {/* Preview grid */}
          {watchImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {watchImages.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url.startsWith('/uploads') ? `http://localhost:5000${url}` : url}
                    alt={`Image ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80?text=Error'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors text-sm text-gray-600">
              <Upload className="w-4 h-4" />
              <span>Tải ảnh từ máy</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleUploadImage}
                disabled={uploadLoading}
              />
            </label>

            <input
              type="text"
              placeholder="Hoặc nhập URL ảnh, Enter để thêm..."
              className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              onKeyDown={handleAddUrl}
            />
          </div>

          {watchImages.length === 0 && (
            <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              Tải ảnh từ máy hoặc dán URL ảnh
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isAvailable"
            {...register('isAvailable')}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="isAvailable" className="text-sm text-gray-700">
            Món ăn sẵn sàng phục vụ
          </label>
        </div>
      </form>
    </Modal>
  )
}
