import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ShipperRoute({ children }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'shipper') {
    return <Navigate to="/" replace />
  }

  return children
}
