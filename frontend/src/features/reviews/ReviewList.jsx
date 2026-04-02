import { useEffect, useState } from 'react'
import { Star, ThumbsUp, Flame, Heart, MessageCircle, Camera, ChevronDown, X as XIcon } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchReviewsByFood, addReaction } from '../../slices/reviewSlice'
import { cn } from '../../lib/utils'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const RATING_FILTERS = [
  { label: 'Tất cả', value: null },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
]

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Đánh giá cao', value: 'highest' },
  { label: 'Hữu ích nhất', value: 'helpful' },
]

const REACTIONS = [
  { key: 'helpful', icon: ThumbsUp, label: 'Hữu ích', emoji: '💡' },
  { key: 'funny', icon: Flame, label: 'Vui', emoji: '🔥' },
  { key: 'love', icon: Heart, label: 'Thích', emoji: '❤️' },
]

function timeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffDays === 0) return diffHours > 0 ? `${diffHours} giờ trước` : `${diffMins} phút trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  if (diffWeeks < 5) return `${diffWeeks} tuần trước`
  if (diffMonths < 12) return `${diffMonths} tháng trước`
  return `${Math.floor(diffMonths / 12)} năm trước`
}

function getUserInitial(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

function ReviewCard({ review, currentUserId, onReaction }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const reactions = review.reactions || { helpful: 0, funny: 0, love: 0 }
  const userReaction = review.userReactions?.[currentUserId] || null
  const photos = review.photos || []

  const handleReaction = (type) => {
    onReaction(review._id, type)
  }

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const nextLightbox = () => setLightboxIndex((prev) => (prev + 1) % photos.length)
  const prevLightbox = () => setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length)

  const hasPhotos = photos.length > 0

  return (
    <>
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        {/* Header: avatar, name, stars, time */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm flex-shrink-0">
              {getUserInitial(review.user?.name || review.userName)}
            </div>
            <div>
              <p className="font-semibold text-charcoal-900 text-sm">
                {review.user?.name || review.userName || 'Người dùng'}
              </p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-3.5 h-3.5',
                      i < (review.rating || 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-charcoal-200'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <span className="text-xs text-charcoal-400 whitespace-nowrap">
            {timeAgo(review.createdAt)}
          </span>
        </div>

        {/* Comment */}
        {review.comment && (
          <p className="text-sm text-charcoal-700 leading-relaxed">{review.comment}</p>
        )}

        {/* Photos */}
        {hasPhotos && (
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => openLightbox(index)}
                className="relative group"
              >
                <img
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-charcoal-100 group-hover:border-primary transition-colors"
                />
              </button>
            ))}
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {REACTIONS.map(({ key, label, emoji }) => {
              const count = reactions[key] || 0
              const isActive = userReaction === key
              return (
                <button
                  key={key}
                  onClick={() => handleReaction(key)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-charcoal-50 text-charcoal-500 hover:bg-charcoal-100'
                  )}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span>{count}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Admin Reply */}
        {review.adminReply && (
          <div className="bg-primary/5 rounded-lg p-3 pl-4 border-l-2 border-primary">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageCircle className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Phản hồi của quán</span>
            </div>
            <p className="text-sm text-charcoal-700">{review.adminReply}</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevLightbox() }}
                  className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors"
                >
                  <ChevronDown className="w-8 h-8 rotate-90" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextLightbox() }}
                  className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors"
                >
                  <ChevronDown className="w-8 h-8 -rotate-90" />
                </button>
              </>
            )}
            <motion.img
              key={lightboxIndex}
              src={photos[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default function ReviewList({ foodId }) {
  const dispatch = useDispatch()
  const { reviews, loading, error, pagination } = useSelector((state) => state.reviews)
  const { user } = useSelector((state) => state.auth)
  const currentUserId = user?._id || user?.id

  const [filterRating, setFilterRating] = useState(null)
  const [filterHasPhotos, setFilterHasPhotos] = useState(false)
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    if (!foodId) return
    dispatch(fetchReviewsByFood({
      foodId,
      params: {
        rating: filterRating,
        hasPhotos: filterHasPhotos,
        sort,
      },
    }))
  }, [foodId, filterRating, filterHasPhotos, sort, dispatch])

  const handleReaction = (reviewId, type) => {
    dispatch(addReaction({ reviewId, reactionType: type }))
  }

  const handleFilterRating = (value) => {
    setFilterRating((prev) => (prev === value ? null : value))
  }

  const togglePhotosFilter = () => {
    setFilterHasPhotos((prev) => !prev)
  }

  if (error) {
    return (
      <div className="text-center py-8 text-charcoal-500 text-sm">
        Không thể tải đánh giá. Vui lòng thử lại sau.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Rating filter chips */}
        {RATING_FILTERS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => handleFilterRating(value)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
              filterRating === value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-charcoal-600 border-charcoal-200 hover:border-primary hover:text-primary'
            )}
          >
            {value ? (
              <>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                {value}
              </>
            ) : (
              <>Tất cả</>
            )}
          </button>
        ))}

        {/* Has photos toggle */}
        <button
          onClick={togglePhotosFilter}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
            filterHasPhotos
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-charcoal-600 border-charcoal-200 hover:border-primary hover:text-primary'
          )}
        >
          <Camera className="w-3 h-3" />
          Có ảnh
        </button>

        {/* Sort dropdown */}
        <div className="ml-auto relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-white border border-charcoal-200 text-charcoal-700 text-xs font-medium pl-3 pr-8 py-1.5 rounded-full cursor-pointer hover:border-primary focus:outline-none focus:border-primary transition-colors"
          >
            {SORT_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-400 pointer-events-none" />
        </div>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-charcoal-400 text-sm">
          Chưa có đánh giá nào cho món ăn này.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              currentUserId={currentUserId}
              onReaction={handleReaction}
            />
          ))}
        </div>
      )}
    </div>
  )
}
