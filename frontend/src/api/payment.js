import axiosClient from "./axiosClient";

/**
 * Create a payment URL for an order.
 * @param {string} orderId - Order ID
 * @param {string} method - Payment method: "VNPAY" | "MOMO"
 * @returns {{ paymentUrl, transactionId, qrCodeUrl?, orderId, amount }}
 */
export function createPayment(orderId, method) {
  return axiosClient.post("/payments/create", { orderId, method });
}
