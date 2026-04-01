import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getCartFromStorage } from './slices/cartSlice'
import { getProfile } from './slices/authSlice'
import { initSocket } from './lib/socket'
import AppRoutes from './routes'

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    // Dark mode
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark')
    }

    // Initialize socket
    initSocket()

    // Restore cart
    dispatch(getCartFromStorage())

    // Restore user if token exists
    const token = localStorage.getItem('accessToken')
    if (token) {
      dispatch(getProfile())
    }
  }, [dispatch])

  return <AppRoutes />
}
