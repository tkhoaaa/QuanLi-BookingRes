import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { CATEGORIES } from '../../constants'

const schema = yup.object({
  name: yup.string().required('Ten mon an la bat buoc'),
  description: yup.string().required('Mo ta la bat buoc'),
  price: yup.number().typeError('Gia phai la so').required('Gia la bat buoc').positive('Gia phai lon hon 0'),
  category: yup.string().required('Danh muc la bat buoc'),
  image: yup.string(),
  variants: yup.array().of(
    yup.object({
      name: yup.string(),
      price: yup.number(),
    })
  ),
  toppings: yup.array().of(
    yup.object({
      name: yup.string(),
      price: yup.number(),
    })
  ),
  available: yup.boolean(),
})

export default function FoodFormModal({ isOpen, onClose, onSubmit, food }) {
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
      image: '',
      available: true,
      variants: [],
      toppings: [],
    },
  })

  useEffect(() => {
    if (food) {
      reset({
        name: food.name || '',
        description: food.description || '',
        price: food.price || '',
        category: food.category || '',
        image: food.image || '',
        available: food.available ?? true,
        variants: food.variants || [],
        toppings: food.toppings || [],
      })
    } else {
      reset({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        available: true,
        variants: [],
        toppings: [],
      })
    }
  }, [food, reset, isOpen])

  const watchImage = watch('image')

  const categoryOptions = CATEGORIES.map((c) => ({ value: c.value, label: c.label }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={food ? 'Chinh sua mon an' : 'Them mon an moi'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ten mon an"
            {...register('name')}
            error={errors.name?.message}
            placeholder="VD: Com rang dui ga"
          />
          <Input
            label="Gia (VND)"
            type="number"
            {...register('price')}
            error={errors.price?.message}
            placeholder="VD: 45000"
          />
        </div>

        <Select
          label="Danh muc"
          {...register('category')}
          error={errors.category?.message}
          options={categoryOptions}
          placeholder="Chon danh muc"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mo ta</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Mo ta mon an..."
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        <Input
          label="Hinh anh (URL)"
          {...register('image')}
          placeholder="https://..."
        />
        {watchImage && (
          <div className="mt-2">
            <img
              src={watchImage}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="available"
            {...register('available')}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="available" className="text-sm text-gray-700">
            Mon an san sang phuc vu
          </label>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Huy
          </Button>
          <Button type="submit" className="flex-1">
            {food ? 'Luu thay doi' : 'Them mon an'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
