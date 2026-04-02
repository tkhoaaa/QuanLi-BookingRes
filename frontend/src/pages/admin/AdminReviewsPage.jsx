import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Search,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Trash2,
  X,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { fetchAllReviews, replyToReview, deleteReview, setFilters, clearFilters } from '../../slices/adminReviewSlice'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { formatDate } from '../../lib/utils'

const RATING_OPTIONS = [
  { value: '', label: 'Tất cả sao' },
  { value: '5', label: '5 sao' },
  { value: '4', label: '4 sao' },
  { value: '3', label: '3 sao' },
  { value: '2', label: '2 sao' },
  { value: '1', label: '1 sao' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'highest', label: 'Đánh giá cao nhất' },
  { value: 'most_reactions', label: 'Nhiều tương tác nhất' },
]

const RATING_COLORS = {
  5: 'text-yellow-500',
  4: 'text-yellow-400',
  3: 'text-yellow-300',
  2: 'text-orange-400',
  1: 'text-red-500',
}

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size >= 16 ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${star <= rating ? 'fill-current ' + (RATING_COLORS[rating] || 'text-yellow-400') : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

function PhotoGallery({ photos, foodName }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (!photos || photos.length === 0) return null

  const openLightbox = (idx) => {
    setLightboxIndex(idx)
    setLightboxOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-500">{photos.length} ảnh</span>
        <div className="flex gap-1 ml-1">
          {photos.slice(0, 3).map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt={`${foodName} photo ${i + 1}`}
              className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border border-gray-100"
              onClick={() => openLightbox(i)}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ))}
          {photos.length > 3 && (
            <button
              onClick={() => openLightbox(3)}
              className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center hover:bg-gray-200 transition-colors border border-gray-100"
            >
              +{photos.length - 3}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>

            <button
              className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + photos.length) % photos.length) }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={photos[lightboxIndex]}
              alt={`${foodName} photo ${lightboxIndex + 1}`}
              className="max-w-[85vw] max-h-[85vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/600?text=No+Image' }}
            />

            <button
              className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % photos.length) }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <span className="text-white text-sm">{lightboxIndex + 1} / {photos.length}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ReviewRow({ review, onReply, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [submittingReply, setSubmittingReply] = useState(false)
  const replyRef = useRef(null)

  const photos = review.photos || review.images || []
  const reactions = review.reactions || {}
  const totalReactions = (reactions.helpful || 0) + (reactions.fun || 0) + (reactions.love || 0)

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return
    setSubmittingReply(true)
    try {
      await onReply(review._id, replyText)
      setReplyText('')
      setShowReplyForm(false)
      toast.success('Đã trả lời đánh giá')
    } catch (err) {
      toast.error(err || 'Gửi trả lời thất bại')
    } finally {
      setSubmittingReply(false)
    }
  }

  useEffect(() => {
    if (showReplyForm && replyRef.current) {
      replyRef.current.focus()
    }
  }, [showReplyForm])

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
        {/* User */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
              {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{review.user?.name || 'Khách hàng'}</p>
              <p className="text-xs text-gray-400 truncate">{review.user?.email || ''}</p>
            </div>
          </div>
        </td>

        {/* Food */}
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={review.food?.name}>
            {review.food?.name || 'Món ăn'}
          </p>
          <p className="text-xs text-gray-400">#{review.booking?.orderCode?.slice(-8) || review._id?.slice(-6)}</p>
        </td>

        {/* Rating */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-900">{review.rating}</span>
            <StarRating rating={review.rating} size={14} />
          </div>
        </td>

        {/* Photos */}
        <td className="px-4 py-3">
          {photos.length > 0 ? (
            <div className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs text-green-700 font-medium">{photos.length}</span>
              <div className="flex -space-x-1">
                {photos.slice(0, 2).map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover border border-white"
                    onClick={() => {}}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400">--</span>
          )}
        </td>

        {/* Reactions */}
        <td className="px-4 py-3">
          {totalReactions > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {reactions.love > 0 && <span className="text-xs">&#10084;&#65039; {reactions.love}</span>}
                {reactions.helpful > 0 && <span className="text-xs">&#128077; {reactions.helpful}</span>}
                {reactions.fun > 0 && <span className="text-xs">&#128514; {reactions.fun}</span>}
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400">--</span>
          )}
        </td>

        {/* Date */}
        <td className="px-4 py-3">
          <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-1.5 rounded-lg transition-colors ${expanded ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
              title={expanded ? 'Thu gọn' : 'Xem chi tiết'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Detail Row */}
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={7} className="px-4 py-4 bg-gray-50/50">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Full Comment */}
                  {review.comment && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Bình luận:</p>
                      <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-100">
                        {review.comment}
                      </p>
                    </div>
                  )}

                  {/* Photo Gallery */}
                  {photos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Hình ảnh:</p>
                      <PhotoGallery photos={photos} foodName={review.food?.name || 'Food'} />
                    </div>
                  )}

                  {/* Admin Reply */}
                  {review.repliedText && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-700">Phản hồi từ Admin</p>
                        <span className="text-xs text-blue-500 ml-auto">
                          {review.repliedAt ? new Date(review.repliedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800">{review.repliedText}</p>
                    </div>
                  )}

                  {/* Reply Form */}
                  {!review.repliedText && (
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      {showReplyForm ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Viết phản hồi:</p>
                          <textarea
                            ref={replyRef}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Nhập phản hồi của bạn..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) handleSubmitReply()
                              if (e.key === 'Escape') setShowReplyForm(false)
                            }}
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => { setShowReplyForm(false); setReplyText('') }}
                              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={handleSubmitReply}
                              disabled={!replyText.trim() || submittingReply}
                              className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {submittingReply && <Loader2 className="w-3 h-3 animate-spin" />}
                              Gửi phản hồi
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowReplyForm(true)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Trả lời đánh giá này
                        </button>
                      )}
                    </div>
                  )}

                  {/* Delete */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => onDelete(review._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa đánh giá
                    </button>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}

export default function AdminReviewsPage() {
  const dispatch = useDispatch()
  const { reviews, loading, error, pagination, filters } = useSelector((state) => state.adminReview)
  const [deleteId, setDeleteId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search)

  // Debounce search
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    dispatch(fetchAllReviews(filters))
  }, [dispatch, filters])

  const handleSearchChange = (value) => {
    setSearchInput(value)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      dispatch(setFilters({ search: value }))
    }, 400)
  }

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }))
  }

  const handleClearFilters = () => {
    setSearchInput('')
    dispatch(clearFilters())
  }

  const handleReply = async (id, text) => {
    const result = await dispatch(replyToReview({ id, text }))
    if (replyToReview.rejected.match(result)) {
      throw new Error(result.payload)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await dispatch(deleteReview(deleteId)).unwrap()
      toast.success('Xóa đánh giá thành công')
      setDeleteId(null)
    } catch (err) {
      toast.error(err || 'Xóa thất bại')
    } finally {
      setDeleteLoading(false)
    }
  }

  const hasActiveFilters =
    filters.search || filters.rating || filters.hasPhotos || filters.dateFrom || filters.dateTo

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0'

  const withPhotos = reviews.filter(r => (r.photos || r.images || []).length > 0).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
            <p className="text-gray-500 text-sm">
              {pagination.total} đánh giá | TB: {avgRating} sao | {withPhotos} có ảnh
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        {/* Row 1: Search + Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên món, khách hàng, bình luận..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Rating Filter */}
          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            {RATING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Has Photos Filter */}
          <select
            value={filters.hasPhotos}
            onChange={(e) => handleFilterChange('hasPhotos', e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            <option value="">Tất cả</option>
            <option value="true">Có ảnh</option>
            <option value="false">Không ảnh</option>
          </select>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Date Range + Clear */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Từ ngày:</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Đến ngày:</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => dispatch(fetchAllReviews(filters))}
              className="text-sm text-primary hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Chưa có đánh giá nào</p>
            <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc để xem thêm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Người dùng</th>
                  <th className="px-4 py-3 font-medium">Món ăn</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Ảnh</th>
                  <th className="px-4 py-3 font-medium">Tương tác</th>
                  <th className="px-4 py-3 font-medium">Ngày</th>
                  <th className="px-4 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <ReviewRow
                    key={review._id}
                    review={review}
                    onReply={handleReply}
                    onDelete={(id) => setDeleteId(id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => dispatch(setFilters({ page: pagination.page - 1 }))}
            disabled={pagination.page <= 1}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            Trang {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => dispatch(setFilters({ page: pagination.page + 1 }))}
            disabled={pagination.page >= pagination.pages}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Xóa đánh giá"
        message="Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        loading={deleteLoading}
      />
    </div>
  )
}
