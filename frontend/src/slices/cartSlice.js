import { createSlice } from '@reduxjs/toolkit'

const CART_STORAGE_KEY = 'res_booking_cart'

const loadCartFromStorage = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    return stored ? JSON.parse(stored) : { items: [], deliveryFee: 0, coupon: null }
  } catch {
    return { items: [], deliveryFee: 0, coupon: null }
  }
}

const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch {
    // ignore
  }
}

const initialState = loadCartFromStorage()

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    getCartFromStorage: (state) => {
      const stored = loadCartFromStorage()
      state.items = stored.items || []
      state.deliveryFee = stored.deliveryFee || 0
      state.coupon = stored.coupon || null
    },
    addItem: (state, action) => {
      const { food, quantity, variant, toppings = [] } = action.payload
      const variantStr = variant ? JSON.stringify(variant) : ''
      const toppingsStr = JSON.stringify(toppings.sort((a, b) => a._id.localeCompare(b._id)))

      const existingIndex = state.items.findIndex(
        (item) =>
          item.food._id === food._id &&
          item.variantStr === variantStr &&
          item.toppingsStr === toppingsStr
      )

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += quantity
      } else {
        state.items.push({ food, quantity, variant, toppings, variantStr, toppingsStr })
      }
      saveCartToStorage(state)
    },
    removeItem: (state, action) => {
      const index = action.payload
      state.items.splice(index, 1)
      saveCartToStorage(state)
    },
    updateQuantity: (state, action) => {
      const { index, quantity } = action.payload
      if (quantity <= 0) {
        state.items.splice(index, 1)
      } else {
        state.items[index].quantity = quantity
      }
      saveCartToStorage(state)
    },
    clearCart: (state) => {
      state.items = []
      state.coupon = null
      state.deliveryFee = 0
      saveCartToStorage(state)
    },
    setCoupon: (state, action) => {
      state.coupon = action.payload
      saveCartToStorage(state)
    },
    setDeliveryFee: (state, action) => {
      state.deliveryFee = action.payload
      saveCartToStorage(state)
    },
  },
})

export const {
  getCartFromStorage,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setCoupon,
  setDeliveryFee,
} = cartSlice.actions

// Selectors
export const selectCartItems = (state) => state.cart.items
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => {
    const variantPrice = item.variant?.price || 0
    const toppingsPrice = item.toppings.reduce((t, tp) => t + (tp.price || 0), 0)
    return sum + (item.food.price + variantPrice + toppingsPrice) * item.quantity
  }, 0)
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0)

export default cartSlice.reducer
