const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  PICKING: "picking",
  DELIVERING: "delivering",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const USER_ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  SHIPPER: "shipper",
};

const PAYMENT_METHODS = {
  COD: "COD",
  ONLINE: "online",
};

const FULFILLMENT_TYPES = {
  DELIVERY: "delivery",
  PICKUP: "pickup",
};

module.exports = { ORDER_STATUS, USER_ROLES, PAYMENT_METHODS, FULFILLMENT_TYPES };
