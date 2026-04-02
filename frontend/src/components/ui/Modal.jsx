import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
  showClose = true,
  footer,
}) {
  // Close on ESC key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — flex container với padding an toàn */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 p-3 sm:p-4 md:p-6 flex items-start sm:items-center justify-center overflow-y-auto"
            onClick={onClose}
          >
            {/* Modal container — flex column, scroll bên trong */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-full bg-white rounded-xl shadow-2xl flex flex-col max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-32px)] md:max-h-[calc(100vh-48px)]',
                sizeClasses[size],
                className
              )}
            >
              {/* Header — cố định trên cùng */}
              {(title || showClose) && (
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
                  {title && (
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
                  )}
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                      aria-label="Dong modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Body — scroll độc lập */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0">
                {children}
              </div>

              {/* Footer — cố định dưới cùng */}
              {footer && (
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-gray-50 rounded-b-xl shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
