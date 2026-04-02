import { useState, useRef } from 'react'
import { Star, X, Camera, Loader2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/utils'
import { createReview } from '../../slices/reviewSlice'
import { uploadReviewPhotos } from '../../api/reviewApi'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'

export default function WriteReviewModal({ isOpen, onClose, foodId, foodName }) {
  const dispatch = useDispatch()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const handleStarClick = (star) => {
    setRating(star)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    addFiles(files)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    addFiles(files)
  }

  const addFiles = (files) => {
    if (photos.length + files.length > 5) {
      toast.error('Tối đa 5 ảnh')
      return
    }
    const newPhotos = files.slice(0, 5 - photos.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2),
    }))
    setPhotos((prev) => [...prev, ...newPhotos])
  }

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const removed = prev.find((p) => p.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá')
      return
    }
    if (comment.trim().length < 10) {
      toast.error('Bình luận phải có ít nhất 10 ký tự')
      return
    }

    setSubmitting(true)
    try {
      let photoUrls = []
      if (photos.length > 0) {
        setUploading(true)
        const files = photos.map((p) => p.file)
        const uploadRes = await uploadReviewPhotos(files)
        photoUrls = uploadRes.urls || uploadRes.data || []
        setUploading(false)
      }

      await dispatch(createReview({
        foodId,
        rating,
        comment: comment.trim(),
        photos: photoUrls,
      })).unwrap()

      toast.success('Cảm ơn bạn! Đánh giá đã được gửi.')
      handleClose()
    } catch (err) {
      toast.error(err || 'Gửi đánh giá thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const handleClose = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview))
    setRating(0)
    setComment('')
    setPhotos([])
    setUploading(false)
    setSubmitting(false)
    onClose()
  }

  const isLoading = submitting || uploading

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Viết đánh giá"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={isLoading || rating === 0 || comment.trim().length < 10}
          >
            {uploading ? 'Đang tải ảnh...' : 'Gửi đánh giá'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Food name */}
        {foodName && (
          <p className="text-sm text-charcoal-500 font-medium">Đánh giá: {foodName}</p>
        )}

        {/* Star Rating */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-charcoal-700">Bạn cảm thấy món ăn này thế nào?</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={cn(
                    'w-8 h-8 transition-colors',
                    star <= rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-charcoal-200 hover:text-amber-300'
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-charcoal-400">
            {rating === 1 && 'Rất tệ'}
            {rating === 2 && 'Tệ'}
            {rating === 3 && 'Bình thường'}
            {rating === 4 && 'Ngon'}
            {rating === 5 && 'Tuyệt vời'}
            {rating === 0 && 'Chọn số sao'}
          </p>
        </div>

        {/* Photo Upload */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4 text-charcoal-500" />
            <span className="text-sm font-medium text-charcoal-700">Thêm ảnh (tối đa 5)</span>
          </div>

          {/* Preview thumbnails */}
          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.preview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-charcoal-200"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button / drop zone */}
          {photos.length < 5 && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed border-charcoal-200 rounded-xl p-4 text-center cursor-pointer transition-colors',
                'hover:border-primary hover:bg-primary/5'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-charcoal-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Đang tải ảnh...</span>
                </div>
              ) : (
                <p className="text-sm text-charcoal-500">
                  Nhấn để chọn ảnh hoặc kéo thả ảnh vào đây
                </p>
              )}
            </div>
          )}
        </div>

        {/* Comment textarea */}
        <div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về món ăn này..."
            rows={4}
            className={cn(
              'w-full px-4 py-3 rounded-xl border-2 text-sm text-charcoal-800 placeholder-charcoal-400 resize-none transition-colors focus:outline-none',
              comment.length > 0 && comment.length < 10
                ? 'border-red-300 focus:border-red-400'
                : 'border-charcoal-200 focus:border-primary'
            )}
          />
          <p className={cn(
            'text-xs mt-1 text-right',
            comment.length < 10 ? 'text-red-400' : 'text-charcoal-400'
          )}>
            {comment.length}/10 ký tự tối thiểu
          </p>
        </div>
      </div>
    </Modal>
  )
}
