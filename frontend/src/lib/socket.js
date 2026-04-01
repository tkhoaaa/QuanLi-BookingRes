import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
})

export function initSocket() {
  if (!socket.connected) {
    socket.connect()
  }

  const token = localStorage.getItem('accessToken')
  if (token) {
    socket.emit('authenticate', token)
  }
}

export function joinRoom(userId) {
  socket.emit('joinRoom', userId)
}

export function leaveRoom(userId) {
  socket.emit('leaveRoom', userId)
}

export function joinAdminRoom() {
  socket.emit('joinAdminRoom')
}

export function leaveAdminRoom() {
  socket.emit('leaveAdminRoom')
}

export function joinShipperRoom() {
  socket.emit('joinShipperRoom')
}

export function leaveShipperRoom() {
  socket.emit('leaveShipperRoom')
}

export default socket
