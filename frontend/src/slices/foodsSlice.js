import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosClient from '../api/axiosClient'

const initialState = {
  foods: [],
  currentFood: null,
  filters: {
    search: '',
    category: '',
    sort: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 12,
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  },
  loading: false,
  error: null,
}

export const fetchFoods = createAsyncThunk(
  'foods/fetchFoods',
  async (params, { getState, rejectWithValue }) => {
    try {
      const state = getState()
      const filters = params || state.foods.filters
      const query = new URLSearchParams()
      if (filters.search) query.append('search', filters.search)
      if (filters.category) query.append('category', filters.category)
      if (filters.sort) query.append('sort', filters.sort)
      if (filters.order) query.append('order', filters.order)
      if (filters.page) query.append('page', filters.page)
      if (filters.limit) query.append('limit', filters.limit)
      if (filters.isAvailable !== undefined && filters.isAvailable !== null) {
        query.append('isAvailable', filters.isAvailable)
      }

      const res = await axiosClient.get(`/foods?${query.toString()}`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch foods')
    }
  }
)

export const fetchFoodById = createAsyncThunk(
  'foods/fetchFoodById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get(`/foods/${id}`)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch food')
    }
  }
)

export const createFood = createAsyncThunk(
  'foods/createFood',
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post('/foods', data)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create food')
    }
  }
)

export const updateFood = createAsyncThunk(
  'foods/updateFood',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.put(`/foods/${id}`, data)
      return res.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update food')
    }
  }
)

export const deleteFood = createAsyncThunk(
  'foods/deleteFood',
  async (id, { rejectWithValue }) => {
    try {
      await axiosClient.delete(`/foods/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete food')
    }
  }
)

const foodsSlice = createSlice({
  name: 'foods',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
    clearCurrentFood: (state) => {
      state.currentFood = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch Foods
    builder.addCase(fetchFoods.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchFoods.fulfilled, (state, action) => {
      state.loading = false
      state.foods = action.payload.foods || []
      state.pagination = action.payload.pagination || {
        total: 0,
        page: 1,
        limit: state.filters.limit,
        totalPages: 1,
      }
    })
    builder.addCase(fetchFoods.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Fetch Food By ID
    builder.addCase(fetchFoodById.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchFoodById.fulfilled, (state, action) => {
      state.loading = false
      state.currentFood = action.payload
    })
    builder.addCase(fetchFoodById.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Create Food
    builder.addCase(createFood.fulfilled, (state, action) => {
      state.foods.unshift(action.payload)
    })

    // Update Food
    builder.addCase(updateFood.fulfilled, (state, action) => {
      const index = state.foods.findIndex((f) => f._id === action.payload._id)
      if (index >= 0) state.foods[index] = action.payload
      if (state.currentFood?._id === action.payload._id) state.currentFood = action.payload
    })

    // Delete Food
    builder.addCase(deleteFood.fulfilled, (state, action) => {
      state.foods = state.foods.filter((f) => f._id !== action.payload)
    })
  },
})

export const { setFilters, resetFilters, clearCurrentFood, clearError } = foodsSlice.actions
export default foodsSlice.reducer
