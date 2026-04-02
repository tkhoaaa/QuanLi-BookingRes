import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosClient from '../api/axiosClient'

/*
 * Backend Service Contract:
 * GET /admin/audit-logs?page=1&limit=20&userId=&action=&resource=&startDate=&endDate=
 *   Response: { data: { logs: [...], pagination: {...} } }
 *   Log entry shape: {
 *     _id, timestamp, user: { _id, name, email, role },
 *     action: 'Created'|'Updated'|'Deleted',
 *     resource: 'Order'|'Food'|'User'|'Promo'|'Category'|'Branch',
 *     resourceId, details: { field, oldValue, newValue, summary }
 *   }
 * POST /admin/audit-logs/export - returns CSV
 *   Query params: userId, action, resource, startDate, endDate
 */

// Mock data for initial development
const MOCK_AUDIT_LOGS = [
  {
    _id: 'audit-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    user: { _id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@nhavien.com', role: 'admin' },
    action: 'Created',
    resource: 'Order',
    resourceId: 'ord001',
    details: { summary: 'Tạo đơn hàng mới #ORD001', field: null, oldValue: null, newValue: null },
  },
  {
    _id: 'audit-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    user: { _id: 'u2', name: 'Trần Thị Shipper', email: 'shipper@nhavien.com', role: 'shipper' },
    action: 'Updated',
    resource: 'Order',
    resourceId: 'ord002',
    details: { summary: 'Cập nhật trạng thái: pending -> confirmed', field: 'status', oldValue: 'pending', newValue: 'confirmed' },
  },
  {
    _id: 'audit-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: { _id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@nhavien.com', role: 'admin' },
    action: 'Updated',
    resource: 'Food',
    resourceId: 'food003',
    details: { summary: 'Cập nhật giá món: 45000 -> 50000', field: 'price', oldValue: 45000, newValue: 50000 },
  },
  {
    _id: 'audit-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    user: { _id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@nhavien.com', role: 'admin' },
    action: 'Created',
    resource: 'Promo',
    resourceId: 'promo001',
    details: { summary: 'Tạo mã giảm giá SUMMER2026', field: null, oldValue: null, newValue: null },
  },
  {
    _id: 'audit-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    user: { _id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@nhavien.com', role: 'admin' },
    action: 'Deleted',
    resource: 'Food',
    resourceId: 'food005',
    details: { summary: 'Xóa món ăn "Cơm chiên hải sản"', field: null, oldValue: null, newValue: null },
  },
  {
    _id: 'audit-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    user: { _id: 'u3', name: 'Lê Minh Khách', email: 'user1@nhavien.com', role: 'customer' },
    action: 'Created',
    resource: 'Order',
    resourceId: 'ord006',
    details: { summary: 'Đặt hàng tại nhà hàng', field: null, oldValue: null, newValue: null },
  },
  {
    _id: 'audit-007',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    user: { _id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@nhavien.com', role: 'admin' },
    action: 'Updated',
    resource: 'User',
    resourceId: 'u4',
    details: { summary: 'Thay đổi vai trò người dùng: customer -> shipper', field: 'role', oldValue: 'customer', newValue: 'shipper' },
  },
  {
    _id: 'audit-008',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    user: { _id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@nhavien.com', role: 'admin' },
    action: 'Created',
    resource: 'Branch',
    resourceId: 'branch001',
    details: { summary: 'Thêm chi nhánh mới: Chi nhánh Quận 3', field: null, oldValue: null, newValue: null },
  },
  {
    _id: 'audit-009',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    user: { _id: 'u2', name: 'Trần Thị Shipper', email: 'shipper@nhavien.com', role: 'shipper' },
    action: 'Updated',
    resource: 'Order',
    resourceId: 'ord007',
    details: { summary: 'Cập nhật trạng thái: delivering -> delivered', field: 'status', oldValue: 'delivering', newValue: 'delivered' },
  },
  {
    _id: 'audit-010',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    user: { _id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@nhavien.com', role: 'admin' },
    action: 'Created',
    resource: 'Food',
    resourceId: 'food010',
    details: { summary: 'Thêm món mới: Bún bò Huế', field: null, oldValue: null, newValue: null },
  },
  {
    _id: 'audit-011',
    timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    user: { _id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@nhavien.com', role: 'admin' },
    action: 'Updated',
    resource: 'Promo',
    resourceId: 'promo002',
    details: { summary: 'Cập nhật số lần sử dụng: 50 -> 100', field: 'usageLimit', oldValue: 50, newValue: 100 },
  },
  {
    _id: 'audit-012',
    timestamp: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    user: { _id: 'u3', name: 'Lê Minh Khách', email: 'user1@nhavien.com', role: 'customer' },
    action: 'Created',
    resource: 'Order',
    resourceId: 'ord008',
    details: { summary: 'Đặt hàng online', field: null, oldValue: null, newValue: null },
  },
  {
    _id: 'audit-013',
    timestamp: new Date(Date.now() - 1000 * 60 * 540).toISOString(),
    user: { _id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@nhavien.com', role: 'admin' },
    action: 'Deleted',
    resource: 'Promo',
    resourceId: 'promo003',
    details: { summary: 'Xóa mã giảm giá EXPIRED2025', field: null, oldValue: null, newValue: null },
  },
  {
    _id: 'audit-014',
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    user: { _id: 'u1', name: 'Nguyễn Văn Admin', email: 'admin@nhavien.com', role: 'admin' },
    action: 'Updated',
    resource: 'Category',
    resourceId: 'cat001',
    details: { summary: 'Đổi tên danh mục: "Món Chính" -> "Món Chính Premium"', field: 'name', oldValue: 'Món Chính', newValue: 'Món Chính Premium' },
  },
  {
    _id: 'audit-015',
    timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    user: { _id: 'u2', name: 'Trần Thị Shipper', email: 'shipper@nhavien.com', role: 'shipper' },
    action: 'Updated',
    resource: 'Order',
    resourceId: 'ord009',
    details: { summary: 'Cập nhật trạng thái: preparing -> picking', field: 'status', oldValue: 'preparing', newValue: 'picking' },
  },
]

const initialState = {
  logs: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    totalPages: 1,
  },
  filters: {
    userId: '',
    action: '',
    resource: '',
    startDate: '',
    endDate: '',
  },
}

export const fetchAuditLogs = createAsyncThunk(
  'audit/fetchAuditLogs',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      // Try to fetch from backend
      const query = new URLSearchParams()
      if (params.page) query.append('page', params.page)
      if (params.limit) query.append('limit', params.limit)
      if (params.userId) query.append('userId', params.userId)
      if (params.action) query.append('action', params.action)
      if (params.resource) query.append('resource', params.resource)
      if (params.startDate) query.append('startDate', params.startDate)
      if (params.endDate) query.append('endDate', params.endDate)

      const res = await axiosClient.get(`/admin/audit-logs?${query.toString()}`)
      return res.data.data
    } catch {
      // Fallback to mock data if backend not ready
      const state = getState()
      const filters = params.filters || state.audit.filters
      const page = params.page || 1
      const limit = params.limit || 15

      let filtered = [...MOCK_AUDIT_LOGS]
      if (filters.userId) filtered = filtered.filter(l => l.user._id === filters.userId)
      if (filters.action) filtered = filtered.filter(l => l.action === filters.action)
      if (filters.resource) filtered = filtered.filter(l => l.resource === filters.resource)
      if (filters.startDate) filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(filters.startDate))
      if (filters.endDate) filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(filters.endDate + 'T23:59:59'))

      const total = filtered.length
      const totalPages = Math.ceil(total / limit)
      const start = (page - 1) * limit
      const paginated = filtered.slice(start, start + limit)

      return {
        logs: paginated,
        pagination: { total, page, totalPages, limit },
      }
    }
  }
)

export const exportAuditLogs = createAsyncThunk(
  'audit/exportAuditLogs',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) query.append(k, v)
      })
      const res = await axiosClient.get(`/admin/audit-logs/export?${query.toString()}`, { responseType: 'blob' })
      return res.data
    } catch {
      // Fallback: generate CSV from mock data
      let filtered = [...MOCK_AUDIT_LOGS]
      if (filters.userId) filtered = filtered.filter(l => l.user._id === filters.userId)
      if (filters.action) filtered = filtered.filter(l => l.action === filters.action)
      if (filters.resource) filtered = filtered.filter(l => l.resource === filters.resource)
      if (filters.startDate) filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(filters.startDate))
      if (filters.endDate) filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(filters.endDate + 'T23:59:59'))

      const headers = ['Timestamp', 'User', 'Email', 'Action', 'Resource', 'Resource ID', 'Details']
      const rows = filtered.map(l => [
        new Date(l.timestamp).toLocaleString('vi-VN'),
        l.user.name,
        l.user.email,
        l.action,
        l.resource,
        l.resourceId,
        l.details.summary,
      ])

      const csvContent = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      return blob
    }
  }
)

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAuditLogs.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchAuditLogs.fulfilled, (state, action) => {
      state.loading = false
      state.logs = action.payload.logs || action.payload.data || []
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination
      }
    })
    builder.addCase(fetchAuditLogs.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })
  },
})

export const { setFilters, resetFilters, clearError } = auditSlice.actions
export default auditSlice.reducer
