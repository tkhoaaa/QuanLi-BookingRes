import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
