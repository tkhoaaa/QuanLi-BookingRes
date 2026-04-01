const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");

router.get("/stats", verifyToken, restrictTo("admin"), adminController.getStats);
router.get("/users", verifyToken, restrictTo("admin"), adminController.getAllUsers);
router.get("/shippers", verifyToken, restrictTo("admin"), adminController.getShippers);
router.get("/orders", verifyToken, restrictTo("admin"), adminController.getAllOrders);

module.exports = router;
