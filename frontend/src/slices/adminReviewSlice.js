import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchAllAdminReviews as apiFetchAll, replyToReview as apiReply, deleteReview as apiDelete } from '../api/reviewApi'

const initialState = {
  reviews: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
  },
  filters: {
    search: '',
    rating: '',
    hasPhotos: '',
    sort: 'newest',
    dateFrom: '',
    dateTo: '',
  },
}

export const fetchAllReviews = createAsyncThunk(
  'adminReview/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiFetchAll({ page: 1, limit: 50, ...params })
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews')
    }
  }
)

export const replyToReview = createAsyncThunk(
  'adminReview/reply',
  async ({ id, text }, { rejectWithValue }) => {
    try {
      const res = await apiReply(id, text)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reply')
    }
  }
)

export const deleteReview = createAsyncThunk(
  'adminReview/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiDelete(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete review')
    }
  }
)

const adminReviewSlice = createSlice({
  name: 'adminReview',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAllReviews.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllReviews.fulfilled, (state, action) => {
        state.loading = false
        state.reviews = action.payload.reviews || []
        state.pagination = action.payload.pagination || initialState.pagination
      })
      .addCase(fetchAllReviews.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // reply
      .addCase(replyToReview.fulfilled, (state, action) => {
        const idx = state.reviews.findIndex(r => r._id === action.payload._id)
        if (idx !== -1) {
          state.reviews[idx] = action.payload
        }
      })
      // delete
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter(r => r._id !== action.payload)
        state.pagination.total = Math.max(0, state.pagination.total - 1)
      })
  },
})

export const { setFilters, clearFilters, clearError } = adminReviewSlice.actions
export default adminReviewSlice.reducer
