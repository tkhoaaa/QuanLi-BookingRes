import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  bookings: [],
  currentBooking: null,
}

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action) => {
      state.bookings = action.payload
    },
    addBooking: (state, action) => {
      state.bookings.unshift(action.payload)
    },
    updateBooking: (state, action) => {
      const idx = state.bookings.findIndex((b) => b._id === action.payload._id)
      if (idx >= 0) state.bookings[idx] = action.payload
      if (state.currentBooking?._id === action.payload._id) {
        state.currentBooking = action.payload
      }
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null
    },
  },
})

export const { setBookings, addBooking, updateBooking, setCurrentBooking, clearCurrentBooking } =
  bookingsSlice.actions
export default bookingsSlice.reducer
