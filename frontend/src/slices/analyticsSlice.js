import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosClient from '../api/axiosClient'

const initialState = {
  overview: null,
  revenueChart: [],
  topItems: [],
  categoryRevenue: null,
  statusStats: [],
  branchComparison: [],
  loading: false,
  error: null,
  currentRange: '7d',
  currentBranchId: '',
}

export const fetchAnalyticsOverview = createAsyncThunk(
  'analytics/fetchOverview',
  async ({ range = '7d', branchId = '' } = {}, { rejectWithValue }) => {
    try {
      const branchParam = branchId ? `&branchId=${branchId}` : '';
      const [overviewRes, revenueRes, topItemsRes, categoryRes, statusRes, comparisonRes] = await Promise.all([
        axiosClient.get(`/analytics/overview?range=${range}${branchParam}`),
        axiosClient.get(`/analytics/revenue?range=${range}${branchParam}`),
        axiosClient.get(`/analytics/top-items?range=${range}&limit=10${branchParam}`),
        axiosClient.get(`/analytics/category-revenue?range=${range}${branchParam}`),
        axiosClient.get(`/analytics/order-status?range=${range}${branchParam}`),
        axiosClient.get(`/analytics/branch-comparison?range=${range}`),
      ])
      return {
        overview: overviewRes.data.data,
        revenueChart: revenueRes.data.data,
        topItems: topItemsRes.data.data,
        categoryRevenue: categoryRes.data.data,
        statusStats: statusRes.data.data,
        branchComparison: comparisonRes.data.data || [],
        range,
        branchId,
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
      state.branchComparison = action.payload.branchComparison
      state.currentRange = action.payload.range
      state.currentBranchId = action.payload.branchId
    })
    builder.addCase(fetchAnalyticsOverview.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })
  },
})

export const { clearError } = analyticsSlice.actions
export default analyticsSlice.reducer
