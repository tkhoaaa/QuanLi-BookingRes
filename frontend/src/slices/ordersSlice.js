import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosClient from '../api/axiosClient'

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
}

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post('/orders', orderData)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order')
    }
  }
)

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMyOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams()
      if (params.page) query.append('page', params.page)
      if (params.limit) query.append('limit', params.limit)
      if (params.status) query.append('status', params.status)

      const res = await axiosClient.get(`/orders/my-orders?${query.toString()}`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders')
    }
  }
)

export const fetchOrderDetail = createAsyncThunk(
  'orders/fetchOrderDetail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get(`/orders/${id}`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order')
    }
  }
)

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/orders/${id}/status`, { status })
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status')
    }
  }
)

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post(`/orders/${id}/cancel`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order')
    }
  }
)

// Admin fetch all orders
export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAllOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams()
      if (params.page) query.append('page', params.page)
      if (params.limit) query.append('limit', params.limit)
      if (params.status) query.append('status', params.status)
      if (params.search) query.append('search', params.search)

      const res = await axiosClient.get(`/orders/all?${query.toString()}`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders')
    }
  }
)

// Assign shipper
export const assignShipper = createAsyncThunk(
  'orders/assignShipper',
  async ({ orderId, shipperId }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post(`/orders/${orderId}/shipper`, { shipperId })
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign shipper')
    }
  }
)

// Shipper accept order
export const acceptOrder = createAsyncThunk(
  'orders/acceptOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post(`/orders/${orderId}/accept`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept order')
    }
  }
)

// Shipper complete order
export const completeOrder = createAsyncThunk(
  'orders/completeOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post(`/orders/${orderId}/complete`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete order')
    }
  }
)

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Create Order
    builder.addCase(createOrder.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(createOrder.fulfilled, (state, action) => {
      state.loading = false
      state.currentOrder = action.payload
      state.orders.unshift(action.payload)
    })
    builder.addCase(createOrder.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Fetch My Orders
    builder.addCase(fetchMyOrders.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchMyOrders.fulfilled, (state, action) => {
      state.loading = false
      state.orders = action.payload.orders || []
    })
    builder.addCase(fetchMyOrders.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Fetch Order Detail
    builder.addCase(fetchOrderDetail.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchOrderDetail.fulfilled, (state, action) => {
      state.loading = false
      state.currentOrder = action.payload
    })
    builder.addCase(fetchOrderDetail.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Update Order Status
    builder.addCase(updateOrderStatus.fulfilled, (state, action) => {
      const idx = state.orders.findIndex((o) => o._id === action.payload._id)
      if (idx >= 0) state.orders[idx] = action.payload
      if (state.currentOrder?._id === action.payload._id) {
        state.currentOrder = action.payload
      }
    })

    // Cancel Order
    builder.addCase(cancelOrder.fulfilled, (state, action) => {
      const idx = state.orders.findIndex((o) => o._id === action.payload._id)
      if (idx >= 0) state.orders[idx] = action.payload
      if (state.currentOrder?._id === action.payload._id) {
        state.currentOrder = action.payload
      }
    })

    // Fetch All Orders (admin)
    builder.addCase(fetchAllOrders.pending, (state) => {
      state.loading = true
    })
    builder.addCase(fetchAllOrders.fulfilled, (state, action) => {
      state.loading = false
      state.orders = action.payload.orders || []
    })
    builder.addCase(fetchAllOrders.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Assign Shipper
    builder.addCase(assignShipper.fulfilled, (state, action) => {
      const idx = state.orders.findIndex((o) => o._id === action.payload._id)
      if (idx >= 0) state.orders[idx] = action.payload
    })

    // Accept Order (shipper)
    builder.addCase(acceptOrder.fulfilled, (state, action) => {
      const idx = state.orders.findIndex((o) => o._id === action.payload._id)
      if (idx >= 0) state.orders[idx] = action.payload
      if (state.currentOrder?._id === action.payload._id) {
        state.currentOrder = action.payload
      }
    })

    // Complete Order (shipper)
    builder.addCase(completeOrder.fulfilled, (state, action) => {
      const idx = state.orders.findIndex((o) => o._id === action.payload._id)
      if (idx >= 0) state.orders[idx] = action.payload
      if (state.currentOrder?._id === action.payload._id) {
        state.currentOrder = action.payload
      }
    })
  },
})

export const { clearCurrentOrder, clearError } = ordersSlice.actions
export default ordersSlice.reducer
