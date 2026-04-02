/**
 * Payment Service - Abstract payment providers (VNPay, MoMo) behind a clean interface.
 * All methods return mock/stub responses for now.
 */

const PAYMENT_METHODS = {
  VNPAY: "vnpay",
  MOMO: "momo",
};

/**
 * Generate a unique transaction ID.
 */
function generateTransactionId() {
  return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Encode order info into a URL-safe string.
 */
function encodeOrderInfo(order) {
  const info = {
    orderId: order._id.toString(),
    amount: order.total,
    method: "mock",
  };
  return Buffer.from(JSON.stringify(info)).toString("base64");
}

// ─── VNPay Stub ────────────────────────────────────────────────────────────────

/**
 * Create a mock VNPay payment URL for an order.
 * @param {Object} order - Order document
 * @returns {{ paymentUrl: string, transactionId: string }}
 */
async function createVNPayUrl(order) {
  const transactionId = generateTransactionId();
  const orderInfo = encodeOrderInfo(order);
  // Mock VNPay URL — replace with real VNPay API endpoint in production
  const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=${transactionId}&vnp_Amount=${order.total * 100}&vnp_OrderInfo=${encodeURIComponent(orderInfo)}&vnp_ReturnUrl=${encodeURIComponent(`${process.env.CLIENT_URL || "http://localhost:5173"}/payment/vnpay/return`)}&vnp_Locale=vn`;
  return { paymentUrl, transactionId };
}

/**
 * Verify VNPay return params and determine success/failure.
 * @param {Object} vnpParams - Query params from VNPay return URL
 * @returns {{ success: boolean, orderId?: string, amount?: number, message?: string }}
 */
async function verifyVNPay(vnpParams) {
  const { vnp_ResponseCode, vnp_TxnRef, vnp_Amount } = vnpParams;

  // vnp_ResponseCode: "00" means success
  if (vnp_ResponseCode === "00") {
    try {
      const decoded = JSON.parse(Buffer.from(decodeURIComponent(vnpParams.vnp_OrderInfo || ""), "base64").toString("utf8"));
      return {
        success: true,
        orderId: decoded.orderId || vnp_TxnRef,
        amount: parseInt(vnp_Amount, 10) / 100,
        message: "Thanh toan VNPay thanh cong",
      };
    } catch {
      return {
        success: true,
        orderId: vnp_TxnRef,
        amount: parseInt(vnp_Amount, 10) / 100,
        message: "Thanh toan VNPay thanh cong",
      };
    }
  }

  return {
    success: false,
    message: `Thanh toan that bai (ma loi: ${vnp_ResponseCode})`,
  };
}

// ─── MoMo Stub ─────────────────────────────────────────────────────────────────

/**
 * Create a mock MoMo QR URL for an order.
 * @param {Object} order - Order document
 * @returns {{ paymentUrl: string, qrCodeUrl: string, transactionId: string }}
 */
async function createMoMoUrl(order) {
  const transactionId = generateTransactionId();
  const orderInfo = encodeOrderInfo(order);
  // Mock MoMo deep-link / QR URL — replace with real MoMo API endpoint in production
  const paymentUrl = `momo://payment?amount=${order.total}&orderId=${transactionId}&orderInfo=${encodeURIComponent(orderInfo)}`;
  // Mock QR code URL pointing to a placeholder
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`;
  return { paymentUrl, qrCodeUrl, transactionId };
}

/**
 * Verify MoMo return params and determine success/failure.
 * @param {Object} momoParams - Query/body params from MoMo return
 * @returns {{ success: boolean, orderId?: string, amount?: number, message?: string }}
 */
async function verifyMoMo(momoParams) {
  const { resultCode, orderId, amount } = momoParams;

  // resultCode: 0 means success
  if (resultCode === 0 || resultCode === "0") {
    return {
      success: true,
      orderId: orderId,
      amount: parseFloat(amount || 0),
      message: "Thanh toan MoMo thanh cong",
    };
  }

  return {
    success: false,
    message: `Thanh toan that bai (ma loi: ${resultCode})`,
  };
}

// ─── Public Interface ───────────────────────────────────────────────────────────

/**
 * Create a payment URL for the given order and payment method.
 * @param {Object} order - Order document
 * @param {string} method - Payment method: "VNPAY" | "MOMO"
 * @returns {{ paymentUrl: string, transactionId: string, qrCodeUrl?: string }}
 */
async function createPaymentUrl(order, method) {
  if (method === "VNPAY") {
    return createVNPayUrl(order);
  }
  if (method === "MOMO") {
    return createMoMoUrl(order);
  }
  throw new Error(`Unsupported payment method: ${method}`);
}

/**
 * Verify a payment callback from the given payment method.
 * @param {string} method - Payment method: "VNPAY" | "MOMO"
 * @param {Object} params - Return/callback params
 * @returns {{ success: boolean, orderId?: string, amount?: number, message?: string }}
 */
async function verifyPayment(method, params) {
  if (method === "VNPAY") {
    return verifyVNPay(params);
  }
  if (method === "MOMO") {
    return verifyMoMo(params);
  }
  throw new Error(`Unsupported payment method: ${method}`);
}

/**
 * Process a refund for an order by creating a coupon equivalent to the order total.
 * @param {Object} order - Order document
 * @param {string} reason - Reason for refund
 * @returns {{ refundId: string, couponCode: string, status: string }}
 */
async function processRefund(order, reason) {
  const refundId = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Create a refund coupon for the customer
  const Coupon = require("../models/Coupon.model");
  const couponCode = `REFUND_${order._id.toString().slice(-8).toUpperCase()}`;

  await Coupon.create({
    code: couponCode,
    discountType: "fixed",
    discountAmount: order.total,
    minOrderValue: 0,
    maxUses: 1,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year validity
    isActive: true,
    description: `Refund coupon for order #${order._id.toString().slice(-8).toUpperCase()}. Ly do: ${reason || "Khong co ly do"}`,
  });

  return {
    refundId,
    couponCode,
    status: "completed",
    message: `Coupon ${couponCode} trị giá ${order.total} VND da duoc tao cho khach hang`,
  };
}

/**
 * Get payment status for a transaction.
 * @param {string} transactionId - Transaction ID
 * @param {string} method - Payment method
 * @returns {{ status: string, amount: number, time: Date }}
 */
async function getPaymentStatus(transactionId, method) {
  // Stub: always return a pending status with mock data
  // In production, query the payment provider's API
  return {
    status: "pending",
    transactionId,
    method,
    amount: 0,
    time: new Date(),
    message: "Payment status check not yet implemented — stub returns pending",
  };
}

module.exports = {
  PAYMENT_METHODS,
  createPaymentUrl,
  verifyPayment,
  processRefund,
  getPaymentStatus,
};
