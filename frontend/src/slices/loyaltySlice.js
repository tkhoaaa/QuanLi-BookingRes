import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosClient from '../api/axiosClient'

const initialState = {
  loyalty: null,
  history: [],
  historyPagination: null,
  loading: false,
  historyLoading: false,
  redeemLoading: false,
  error: null,
  redeemResult: null,
}

export const fetchMyLoyalty = createAsyncThunk(
  'loyalty/fetchMyLoyalty',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get('/loyalty/me')
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch loyalty info')
    }
  }
)

export const fetchPointsHistory = createAsyncThunk(
  'loyalty/fetchPointsHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20 } = params
      const res = await axiosClient.get(`/loyalty/history?page=${page}&limit=${limit}`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch points history')
    }
  }
)

export const redeemPoints = createAsyncThunk(
  'loyalty/redeemPoints',
  async (points, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post('/loyalty/redeem', { points })
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to redeem points')
    }
  }
)

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    clearRedeemResult: (state) => {
      state.redeemResult = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // fetchMyLoyalty
    builder.addCase(fetchMyLoyalty.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchMyLoyalty.fulfilled, (state, action) => {
      state.loading = false
      state.loyalty = action.payload
    })
    builder.addCase(fetchMyLoyalty.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // fetchPointsHistory
    builder.addCase(fetchPointsHistory.pending, (state) => {
      state.historyLoading = true
      state.error = null
    })
    builder.addCase(fetchPointsHistory.fulfilled, (state, action) => {
      state.historyLoading = false
      state.history = action.payload.transactions
      state.historyPagination = action.payload.pagination
    })
    builder.addCase(fetchPointsHistory.rejected, (state, action) => {
      state.historyLoading = false
      state.error = action.payload
    })

    // redeemPoints
    builder.addCase(redeemPoints.pending, (state) => {
      state.redeemLoading = true
      state.error = null
      state.redeemResult = null
    })
    builder.addCase(redeemPoints.fulfilled, (state, action) => {
      state.redeemLoading = false
      state.redeemResult = action.payload
      // Update points in loyalty
      if (state.loyalty) {
        state.loyalty.points -= action.payload.pointsRedeemed
      }
    })
    builder.addCase(redeemPoints.rejected, (state, action) => {
      state.redeemLoading = false
      state.error = action.payload
    })
  },
})

export const { clearRedeemResult, clearError } = loyaltySlice.actions
export default loyaltySlice.reducer
