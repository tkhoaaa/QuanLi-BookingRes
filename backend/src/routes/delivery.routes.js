const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/delivery.controller");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");

// POST /api/delivery/:orderId/location — shipper updates GPS
router.post("/:orderId/location", verifyToken, restrictTo("shipper"), deliveryController.updateLocation);

// GET /api/delivery/:orderId/location — get current location (owner/admin/shipper)
router.get("/:orderId/location", verifyToken, deliveryController.getOrderLocation);

// POST /api/delivery/assign-batch — admin assigns multiple orders to a shipper
router.post("/assign-batch", verifyToken, restrictTo("admin"), deliveryController.assignMultipleOrders);

module.exports = router;
