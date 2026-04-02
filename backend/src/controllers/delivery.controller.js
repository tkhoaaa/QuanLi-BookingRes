const Booking = require("../models/Booking.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

/**
 * POST /api/delivery/:orderId/location
 * Shipper updates their current GPS location for an order.
 * Body: { lat: number, lng: number }
 */
const updateLocation = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { lat, lng } = req.body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ message: "lat and lng are required as numbers" });
  }

  const order = await Booking.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Only the assigned shipper can update location
  if (order.shipper?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the assigned shipper can update location" });
  }

  order.deliveryLocation = { lat, lng };
  await order.save();

  // TODO (Phase 11): Push location update via WebSocket/Socket.io to customer
  // emitToUser(order.user.toString(), "deliveryLocationUpdate", { orderId, lat, lng });
  // Example: emitToUser(order.user.toString(), "deliveryLocationUpdate", { orderId, lat, lng });

  return ApiResponse.success(res, {
    orderId: order._id,
    location: order.deliveryLocation,
    message: "Location updated",
  });
});

/**
 * GET /api/delivery/:orderId/location
 * Get the current delivery location for an order.
 */
const getOrderLocation = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Booking.findById(orderId).select("user deliveryLocation shippingAddress status shipper");
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Allow access to the order owner or any admin/shipper
  const isOwner = order.user?.toString() === req.user._id.toString();
  const isStaff = ["admin", "shipper"].includes(req.user.role);

  if (!isOwner && !isStaff) {
    return res.status(403).json({ message: "Access denied" });
  }

  return ApiResponse.success(res, {
    orderId: order._id,
    location: order.deliveryLocation || null,
    destination: order.shippingAddress,
    status: order.status,
  });
});

/**
 * POST /api/delivery/assign-batch
 * Assign multiple orders to a shipper at once.
 * Body: { orderIds: string[], shipperId: string }
 */
const assignMultipleOrders = asyncHandler(async (req, res) => {
  const { orderIds, shipperId } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ message: "orderIds must be a non-empty array" });
  }

  if (!shipperId) {
    return res.status(400).json({ message: "shipperId is required" });
  }

  // Update all orders in one operation
  const result = await Booking.updateMany(
    { _id: { $in: orderIds }, fulfillmentType: "delivery", status: { $in: ["picking", "delivering"] } },
    {
      $set: {
        shipper: shipperId,
        status: "delivering",
      },
    }
  );

  return ApiResponse.success(res, {
    matched: result.matchedCount,
    modified: result.modifiedCount,
    message: `${result.modifiedCount} don hang da duoc gan cho shipper`,
  });
});

module.exports = {
  updateLocation,
  getOrderLocation,
  assignMultipleOrders,
};
