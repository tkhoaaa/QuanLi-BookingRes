import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosClient from '../api/axiosClient'

const initialState = {
  overview: null,
  revenueChart: [],
  topItems: [],
  categoryRevenue: null,
  statusStats: [],
  loading: false,
  error: null,
  currentRange: '7d',
}

export const fetchAnalyticsOverview = createAsyncThunk(
  'analytics/fetchOverview',
  async ({ range = '7d' } = {}, { rejectWithValue }) => {
    try {
      const [overviewRes, revenueRes, topItemsRes, categoryRes, statusRes] = await Promise.all([
        axiosClient.get(`/analytics/overview?range=${range}`),
        axiosClient.get(`/analytics/revenue?range=${range}`),
        axiosClient.get(`/analytics/top-items?range=${range}&limit=10`),
        axiosClient.get(`/analytics/category-revenue?range=${range}`),
        axiosClient.get(`/analytics/order-status?range=${range}`),
      ])
      return {
        overview: overviewRes.data.data,
        revenueChart: revenueRes.data.data,
        topItems: topItemsRes.data.data,
        categoryRevenue: categoryRes.data.data,
        statusStats: statusRes.data.data,
        range,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics')
    }
  }
)

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAnalyticsOverview.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchAnalyticsOverview.fulfilled, (state, action) => {
      state.loading = false
      state.overview = action.payload.overview
      state.revenueChart = action.payload.revenueChart
      state.topItems = action.payload.topItems
      state.categoryRevenue = action.payload.categoryRevenue
      state.statusStats = action.payload.statusStats
      state.currentRange = action.payload.range
    })
    builder.addCase(fetchAnalyticsOverview.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })
  },
})

export const { clearError } = analyticsSlice.actions
export default analyticsSlice.reducer
