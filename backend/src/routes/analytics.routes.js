const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");

router.use(verifyToken);
router.use(restrictTo("admin"));

router.get("/overview", analyticsController.getOverviewStats);
router.get("/revenue", analyticsController.getRevenueChart);
router.get("/top-items", analyticsController.getTopSellingItems);
router.get("/category-revenue", analyticsController.getCategoryRevenue);
router.get("/order-status", analyticsController.getOrderStatusStats);

module.exports = router;
