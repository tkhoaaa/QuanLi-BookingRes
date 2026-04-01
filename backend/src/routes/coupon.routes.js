const express = require("express");
const router = express.Router();
const couponController = require("../controllers/coupon.controller");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");

router.get("/validate", couponController.validateCoupon);

router.get("/", verifyToken, restrictTo("admin"), couponController.getCoupons);
router.post("/", verifyToken, restrictTo("admin"), couponController.createCoupon);
router.put("/:id", verifyToken, restrictTo("admin"), couponController.updateCoupon);
router.delete("/:id", verifyToken, restrictTo("admin"), couponController.deleteCoupon);

module.exports = router;
