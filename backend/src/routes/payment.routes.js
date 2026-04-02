const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// POST /api/payments/create — authenticated, creates payment URL
router.post("/create", verifyToken, paymentController.createPayment);

// GET /api/payments/vnpay/return — public callback (VNPay redirects here)
router.get("/vnpay/return", paymentController.vnpayReturn);

// GET /api/payments/momo/return — public callback (MoMo redirects here)
router.get("/momo/return", paymentController.momoReturn);

// POST /api/payments/refund — authenticated, request refund
router.post("/refund", verifyToken, paymentController.requestRefund);

module.exports = router;
