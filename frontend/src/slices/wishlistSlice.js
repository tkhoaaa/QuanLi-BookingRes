import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosClient from '../api/axiosClient'

const initialState = {
  items: [],     // Array of food objects
  ids: [],       // Array of food._id strings for fast lookup
  loading: false,
  error: null,
}

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get('/auth/wishlist')
      return res.data.data || []
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist')
    }
  }
)

export const addToWishlist = createAsyncThunk(
  'wishlist/add',
  async (foodId, { rejectWithValue }) => {
    try {
      await axiosClient.post(`/auth/wishlist/${foodId}`)
      return foodId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist')
    }
  }
)

export const removeFromWishlist = createAsyncThunk(
  'wishlist/remove',
  async (foodId, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/auth/wishlist/${foodId}`)
      return foodId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist')
    }
  }
)

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addLocalWishlist: (state, action) => {
      const food = action.payload
      if (!state.ids.includes(food._id)) {
        state.items.push(food)
        state.ids.push(food._id)
      }
    },
    removeLocalWishlist: (state, action) => {
      const foodId = action.payload
      state.items = state.items.filter((f) => f._id !== foodId)
      state.ids = state.ids.filter((id) => id !== foodId)
    },
    clearWishlist: (state) => {
      state.items = []
      state.ids = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.ids = action.payload.map((f) => f._id)
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Add — re-fetch to keep items in sync
      .addCase(addToWishlist.fulfilled, (state, action) => {
        if (!state.ids.includes(action.payload)) {
          state.ids.push(action.payload)
        }
      })
      // Remove
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter((f) => f._id !== action.payload)
        state.ids = state.ids.filter((id) => id !== action.payload)
      })
  },
})

export const { addLocalWishlist, removeLocalWishlist, clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
