import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { selectCartItems, removeItem, updateQuantity, selectCartTotal } from '../../slices/cartSlice'
import { formatCurrency } from '../../lib/utils'
import Button from './Button'

export default function CartSidebar({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const items = useSelector(selectCartItems)
  const total = useSelector(selectCartTotal)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-gray-900">Gio hang ({items.length})</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <ShoppingBag className="w-16 h-16 text-gray-200 mb-3" />
                  <p className="text-gray-500">Gio hang trong</p>
                  <Button onClick={onClose} className="mt-3" variant="outline" size="sm">
                    Tiep tuc mua sam
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {items.map((item, index) => (
                    <div key={`${item.food._id}-${item.variantStr}-${item.toppingsStr}`} className="p-4 flex gap-3">
                      <img
                        src={item.food.image || 'https://via.placeholder.com/80'}
                        alt={item.food.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.food.name}
                        </h4>
                        {item.variant && (
                          <p className="text-xs text-gray-500">{item.variant.name}</p>
                        )}
                        {item.toppings.length > 0 && (
                          <p className="text-xs text-gray-500">
                            + {item.toppings.map((t) => t.name).join(', ')}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-primary">
                            {formatCurrency(
                              (item.food.price + (item.variant?.price || 0) +
                                item.toppings.reduce((s, t) => s + (t.price || 0), 0)) *
                                item.quantity
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                dispatch(updateQuantity({ index, quantity: item.quantity - 1 }))
                              }
                              className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() =>
                                dispatch(updateQuantity({ index, quantity: item.quantity + 1 }))
                              }
                              className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => dispatch(removeItem(index))}
                              className="w-6 h-6 flex items-center justify-center rounded text-red-500 hover:bg-red-50 ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t px-4 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tam tinh</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="block w-full"
                >
                  <Button className="w-full">Thanh toan</Button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
