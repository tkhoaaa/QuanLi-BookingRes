const Booking = require("../models/Booking.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const { createPaymentUrl, verifyPayment, processRefund } = require("../services/payment.service");

/**
 * POST /api/payments/create
 * Create a payment URL for an order.
 * Body: { orderId: string, method: "VNPAY" | "MOMO" }
 */
const createPayment = asyncHandler(async (req, res) => {
  const { orderId, method } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "orderId is required" });
  }
  if (!["VNPAY", "MOMO"].includes(method)) {
    return res.status(400).json({ message: "method must be VNPAY or MOMO" });
  }

  const order = await Booking.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Ensure the order belongs to the authenticated user
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  // Only allow online payment orders
  if (order.paymentMethod === "COD") {
    return res.status(400).json({ message: "This order uses COD payment" });
  }

  // Prevent double payment
  if (order.paymentStatus === "paid") {
    return res.status(400).json({ message: "Order already paid" });
  }

  const result = await createPaymentUrl(order, method);

  // Save transaction ID on the order
  order.transactionId = result.transactionId;
  await order.save();

  return ApiResponse.success(res, {
    ...result,
    orderId: order._id,
    amount: order.total,
  });
});

/**
 * GET /api/payments/vnpay/return
 * VNPay return/callback handler.
 */
const vnpayReturn = asyncHandler(async (req, res) => {
  const result = await verifyPayment("VNPAY", req.query);

  if (result.success && result.orderId) {
    await Booking.findByIdAndUpdate(result.orderId, {
      paymentStatus: "paid",
      paidAt: new Date(),
    });
  }

  // Redirect to frontend success/failure page
  const redirectUrl = result.success
    ? `${process.env.CLIENT_URL || "http://localhost:5173"}/orders/${result.orderId}?payment=success`
    : `${process.env.CLIENT_URL || "http://localhost:5173"}/orders/${result.orderId}?payment=failed`;

  return res.redirect(redirectUrl);
});

/**
 * GET /api/payments/momo/return
 * MoMo return/callback handler.
 */
const momoReturn = asyncHandler(async (req, res) => {
  const result = await verifyPayment("MOMO", req.query);

  if (result.success && result.orderId) {
    await Booking.findByIdAndUpdate(result.orderId, {
      paymentStatus: "paid",
      paidAt: new Date(),
    });
  }

  const redirectUrl = result.success
    ? `${process.env.CLIENT_URL || "http://localhost:5173"}/orders/${result.orderId}?payment=success`
    : `${process.env.CLIENT_URL || "http://localhost:5173"}/orders/${result.orderId}?payment=failed`;

  return res.redirect(redirectUrl);
});

/**
 * POST /api/payments/refund
 * Request a refund for an order — creates a refund coupon.
 * Body: { orderId: string, reason?: string }
 */
const requestRefund = asyncHandler(async (req, res) => {
  const { orderId, reason } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "orderId is required" });
  }

  const order = await Booking.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Only admin or the order owner can request refund
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  if (order.paymentStatus !== "paid") {
    return res.status(400).json({ message: "Only paid orders can be refunded" });
  }

  if (order.paymentMethod === "COD") {
    return res.status(400).json({ message: "COD orders cannot be refunded via this method" });
  }

  const refundResult = await processRefund(order, reason);

  // Update order payment status
  order.paymentStatus = "refunded";
  await order.save();

  return ApiResponse.success(res, refundResult);
});

module.exports = {
  createPayment,
  vnpayReturn,
  momoReturn,
  requestRefund,
};
