import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  notifications: [],
  unreadCount: 0,
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload)
      if (!action.payload.isRead) {
        state.unreadCount += 1
      }
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find((n) => n._id === action.payload)
      if (notification && !notification.isRead) {
        notification.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllAsRead: (state) => {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }))
      state.unreadCount = 0
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload.notifications || action.payload || []
      state.unreadCount = action.payload.unreadCount || 0
    },
    clearNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
    },
  },
})

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  setNotifications,
  clearNotifications,
} = notificationsSlice.actions

export const selectUnreadCount = (state) => state.notifications.unreadCount
export default notificationsSlice.reducer
