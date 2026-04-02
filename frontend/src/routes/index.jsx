import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AdminLayout from '../layouts/AdminLayout'
import ShipperLayout from '../layouts/ShipperLayout'

// User pages
import HomePage from '../pages/HomePage'
import FoodDetailPage from '../pages/FoodDetailPage'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import RegisterAdminPage from '../pages/RegisterAdminPage'
import RegisterShipperPage from '../pages/RegisterShipperPage'
import ProfilePage from '../pages/ProfilePage'
import OrderHistoryPage from '../pages/OrderHistoryPage'
import OrderTrackingPage from '../pages/OrderTrackingPage'
import OrderSuccessPage from '../pages/OrderSuccessPage'
import WishlistPage from '../pages/WishlistPage'
import NotificationsPage from '../pages/NotificationsPage'
import NotFoundPage from '../pages/NotFoundPage'

// Admin pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminFoodsPage from '../pages/admin/AdminFoodsPage'
import AdminOrdersPage from '../pages/admin/AdminOrdersPage'
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminPromosPage from '../pages/admin/AdminPromosPage'
import AdminBranchesPage from '../pages/admin/AdminBranchesPage'

// Shipper pages
import ShipperDashboardPage from '../pages/shipper/ShipperDashboardPage'
import ShipperHistoryPage from '../pages/shipper/ShipperHistoryPage'

// Route guards
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'
import ShipperRoute from './ShipperRoute'

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Main layout ───────────────────────────────────── */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="food/:id" element={<FoodDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="register-admin" element={<RegisterAdminPage />} />
        <Route path="register-shipper" element={<RegisterShipperPage />} />
        <Route
          path="profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route
          path="orders"
          element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>}
        />
        <Route
          path="orders/:id"
          element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>}
        />
        <Route
          path="orders/:id/success"
          element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>}
        />
        <Route
          path="wishlist"
          element={<ProtectedRoute><WishlistPage /></ProtectedRoute>}
        />
        <Route
          path="notifications"
          element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* ── Admin layout ───────────────────────────────────── */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="foods" element={<AdminFoodsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="promos" element={<AdminPromosPage />} />
        <Route path="branches" element={<AdminBranchesPage />} />
      </Route>

      {/* ── Shipper layout ────────────────────────────────── */}
      <Route path="/shipper" element={<ShipperRoute><ShipperLayout /></ShipperRoute>}>
        <Route index element={<ShipperDashboardPage />} />
        <Route path="history" element={<ShipperHistoryPage />} />
      </Route>
    </Routes>
  )
}
