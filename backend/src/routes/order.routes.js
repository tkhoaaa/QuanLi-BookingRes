const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, orderController.createOrder);
router.get("/my-orders", verifyToken, orderController.getMyOrders);
router.get("/:id", verifyToken, orderController.getOrderDetail);
router.patch("/:id/status", verifyToken, restrictTo("admin", "shipper"), orderController.updateOrderStatus);
router.post("/:id/shipper", verifyToken, restrictTo("admin"), orderController.assignShipper);
router.post("/:id/cancel", verifyToken, orderController.cancelOrder);

module.exports = router;
