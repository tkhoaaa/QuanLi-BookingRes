import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../slices/authSlice'
import cartReducer from '../slices/cartSlice'
import foodsReducer from '../slices/foodsSlice'
import ordersReducer from '../slices/ordersSlice'
import notificationsReducer from '../slices/notificationsSlice'
import bookingsReducer from '../slices/bookingsSlice'
import wishlistReducer from '../slices/wishlistSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    foods: foodsReducer,
    orders: ordersReducer,
    notifications: notificationsReducer,
    bookings: bookingsReducer,
    wishlist: wishlistReducer,
  },
})
