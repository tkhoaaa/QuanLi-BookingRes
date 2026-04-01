import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import FoodCard from '../features/foods/FoodCard'
import EmptyState from '../components/ui/EmptyState'

// Simple wishlist stored in localStorage
const WISHLIST_KEY = 'res_booking_wishlist'

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]')
  } catch {
    return []
  }
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState(getWishlist())
  const [wishlistIds, setWishlistIds] = useState(new Set(getWishlist().map((f) => f._id)))

  const toggleWishlist = (foodId) => {
    const current = getWishlist()
    const newList = current.filter((f) => f._id !== foodId)
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(newList))
    setWishlist(newList)
    setWishlistIds(new Set(newList.map((f) => f._id)))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          Danh sach yeu thich
        </h1>

        {wishlist.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Danh sach yeu thich trong"
            description="Nhan vao bieu tuong trai tim tren mon an de them vao danh sach yeu thich"
            actionLabel="Kham pha thuc don"
            onAction={() => window.location.href = '/'}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlist.map((food, index) => (
              <motion.div
                key={food._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <FoodCard
                  food={food}
                  isWishlisted={wishlistIds.has(food._id)}
                  onWishlistToggle={toggleWishlist}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
