import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChefHat } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Trang không tồn tại</h1>
        <p className="text-gray-500 mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị chuyển.
        </p>
        <Link to="/">
          <Button icon={ChefHat}>
            Về trang chủ
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
