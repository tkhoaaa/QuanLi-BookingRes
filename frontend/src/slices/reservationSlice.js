import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosClient from '../api/axiosClient'

const initialState = {
  reservations: [],
  currentReservation: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  },
}

export const fetchReservations = createAsyncThunk(
  'reservation/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, branchId, date, status } = params
      const query = new URLSearchParams({ page })
      if (branchId) query.set('branchId', branchId)
      if (date) query.set('date', date)
      if (status) query.set('status', status)
      const res = await axiosClient.get(`/reservations?${query.toString()}`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reservations')
    }
  }
)

export const fetchMyReservations = createAsyncThunk(
  'reservation/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get('/reservations')
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your reservations')
    }
  }
)

export const fetchReservationById = createAsyncThunk(
  'reservation/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get(`/reservations/${id}`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reservation')
    }
  }
)

export const createReservation = createAsyncThunk(
  'reservation/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post('/reservations', data)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create reservation')
    }
  }
)

export const updateReservationStatus = createAsyncThunk(
  'reservation/updateStatus',
  async ({ id, status, tableNumber }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/reservations/${id}/status`, { status, tableNumber })
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update reservation')
    }
  }
)

export const cancelReservation = createAsyncThunk(
  'reservation/cancel',
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/reservations/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel reservation')
    }
  }
)

const reservationSlice = createSlice({
  name: 'reservation',
  initialState,
  reducers: {
    clearCurrentReservation: (state) => {
      state.currentReservation = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // fetchReservations
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.loading = false
        state.reservations = action.payload.reservations || []
        state.pagination = action.payload.pagination || initialState.pagination
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchMyReservations
    builder
      .addCase(fetchMyReservations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyReservations.fulfilled, (state, action) => {
        state.loading = false
        state.reservations = action.payload.reservations || action.payload || []
      })
      .addCase(fetchMyReservations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchReservationById
    builder
      .addCase(fetchReservationById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReservationById.fulfilled, (state, action) => {
        state.loading = false
        state.currentReservation = action.payload
      })
      .addCase(fetchReservationById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // createReservation
    builder
      .addCase(createReservation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.loading = false
        state.currentReservation = action.payload
        state.reservations.unshift(action.payload)
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // updateReservationStatus
    builder
      .addCase(updateReservationStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateReservationStatus.fulfilled, (state, action) => {
        state.loading = false
        const updated = action.payload
        const idx = state.reservations.findIndex((r) => r._id === updated._id)
        if (idx !== -1) state.reservations[idx] = updated
        if (state.currentReservation?._id === updated._id) {
          state.currentReservation = updated
        }
      })
      .addCase(updateReservationStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // cancelReservation
    builder
      .addCase(cancelReservation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(cancelReservation.fulfilled, (state, action) => {
        state.loading = false
        const id = action.payload
        const idx = state.reservations.findIndex((r) => r._id === id)
        if (idx !== -1) state.reservations[idx].status = 'cancelled'
        if (state.currentReservation?._id === id) {
          state.currentReservation.status = 'cancelled'
        }
      })
      .addCase(cancelReservation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearCurrentReservation, clearError } = reservationSlice.actions
export default reservationSlice.reducer
