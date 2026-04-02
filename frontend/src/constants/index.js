// ── Order Status ────────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  PICKING: 'picking',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
}

export const ORDER_STATUS_COLORS = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Chờ xử lý' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Đã xác nhận' },
  preparing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Đang chuẩn bị' },
  picking: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Đang lấy hàng' },
  delivering: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Đang giao' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã giao' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Đã hủy' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Đã hoàn tiền' },
}

export const ORDER_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['picking', 'cancelled'],
  picking: ['delivering'],
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
}

// ── User Roles ─────────────────────────────────────────────
export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SHIPPER: 'shipper',
}

// ── Payment Methods ───────────────────────────────────────
export const PAYMENT_METHODS = {
  COD: 'COD',
  ONLINE: 'online',
}

// ── Fulfillment Types ─────────────────────────────────────
export const FULFILLMENT_TYPES = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
}

// ── Categories ────────────────────────────────────────────
export const CATEGORIES = [
  { value: 'mon-chinh', label: 'Món Chính' },
  { value: 'mon-phu', label: 'Món Phụ' },
  { value: 'do-uong', label: 'Đồ Uống' },
  { value: 'trang-mieng', label: 'Tráng Miệng' },
  { value: 'mon-nhanh', label: 'Món Nhanh' },
  { value: 'combo', label: 'Combo' },
]

// ── Notification Types ───────────────────────────────────
export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  PROMO: 'promo',
  SYSTEM: 'system',
  RESERVATION: 'reservation',
}

// ── Member Tiers ───────────────────────────────────────────
export const MEMBER_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  DIAMOND: 'diamond',
}

export const TIER_THRESHOLDS = {
  [MEMBER_TIERS.BRONZE]: 0,
  [MEMBER_TIERS.SILVER]: 500000,
  [MEMBER_TIERS.GOLD]: 2000000,
  [MEMBER_TIERS.DIAMOND]: 5000000,
}

export const TIER_BENEFITS = {
  [MEMBER_TIERS.BRONZE]: { pointsRate: 1, freeDelivery: false, discount: 0 },
  [MEMBER_TIERS.SILVER]: { pointsRate: 1.2, freeDelivery: false, discount: 2 },
  [MEMBER_TIERS.GOLD]: { pointsRate: 1.5, freeDelivery: true, discount: 5 },
  [MEMBER_TIERS.DIAMOND]: { pointsRate: 2, freeDelivery: true, discount: 10 },
}
