import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchReviewsByFood as apiFetchReviews, createReview as apiCreateReview, addReaction as apiAddReaction } from '../api/reviewApi'

const initialState = {
  reviews: [],
  currentReview: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
  },
}

export const fetchReviewsByFood = createAsyncThunk(
  'reviews/fetchByFood',
  async ({ foodId, params }, { rejectWithValue }) => {
    try {
      const res = await apiFetchReviews(foodId, params)
      return res
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews')
    }
  }
)

export const createReview = createAsyncThunk(
  'reviews/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiCreateReview(data)
      return res
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create review')
    }
  }
)

export const addReaction = createAsyncThunk(
  'reviews/addReaction',
  async ({ reviewId, reactionType }, { rejectWithValue }) => {
    try {
      const res = await apiAddReaction(reviewId, reactionType)
      return { reviewId, reactionType, data: res }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add reaction')
    }
  }
)

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviews: (state) => {
      state.reviews = []
      state.pagination = { page: 1, totalPages: 1, total: 0 }
    },
    clearReviewError: (state) => {
      state.error = null
    },
    optimisticAddReaction: (state, action) => {
      const { reviewId, reactionType, userId } = action.payload
      const review = state.reviews.find((r) => r._id === reviewId)
      if (review) {
        if (!review.reactions) review.reactions = { helpful: 0, funny: 0, love: 0 }
        if (!review.userReactions) review.userReactions = {}
        if (review.userReactions[userId] === reactionType) {
          review.reactions[reactionType] = Math.max(0, (review.reactions[reactionType] || 0) - 1)
          delete review.userReactions[userId]
        } else {
          const prev = review.userReactions[userId]
          if (prev && review.reactions[prev] !== undefined) {
            review.reactions[prev] = Math.max(0, review.reactions[prev] - 1)
          }
          review.reactions[reactionType] = (review.reactions[reactionType] || 0) + 1
          review.userReactions[userId] = reactionType
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchReviewsByFood
      .addCase(fetchReviewsByFood.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReviewsByFood.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload
        if (payload.pagination) {
          state.reviews = payload.reviews
          state.pagination = payload.pagination
        } else {
          state.reviews = payload.reviews || payload
          state.pagination = payload.pagination || state.pagination
        }
      })
      .addCase(fetchReviewsByFood.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // createReview
      .addCase(createReview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload && action.payload._id) {
          state.reviews.unshift(action.payload)
          state.pagination.total += 1
        }
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // addReaction
      .addCase(addReaction.fulfilled, (state, action) => {
        const { reviewId, reactionType } = action.payload
        const review = state.reviews.find((r) => r._id === reviewId)
        if (review) {
          review.reactions = action.payload.data?.reactions || review.reactions
          review.userReactions = action.payload.data?.userReactions || review.userReactions
        }
      })
  },
})

export const { clearReviews, clearReviewError, optimisticAddReaction } = reviewSlice.actions
export default reviewSlice.reducer
