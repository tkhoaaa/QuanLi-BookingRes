import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Resolve food image URL from the images array or legacy single image field.
 * Handles both /uploads/... paths (needs API base prefix) and external URLs.
 */
export function resolveFoodImage(images, fallback = 'https://via.placeholder.com/300?text=Food') {
  const arr = Array.isArray(images) ? images : images ? [images] : []
  const url = arr[0] || fallback
  if (url.startsWith('/uploads/')) {
    return `${API_BASE}${url}`
  }
  return url
}

/**
 * Merge class names with tailwind-merge
 */
export function cn(...classes) {
  return twMerge(clsx(classes))
}

/**
 * Format currency in VND
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format date
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return ''
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }
  return new Date(dateString).toLocaleDateString('vi-VN', defaultOptions)
}

/**
 * Format date with time
 */
export function formatDateTime(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} ngay truoc`
  if (hours > 0) return `${hours} gio truoc`
  if (minutes > 0) return `${minutes} phut truoc`
  return 'Vua xong'
}
