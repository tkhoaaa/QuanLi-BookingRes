const express = require("express");
const router = express.Router();
const loyaltyController = require("../controllers/loyalty.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

// All loyalty routes require authentication
router.use(verifyToken);

router.get("/me", loyaltyController.getMyLoyalty);
router.get("/history", loyaltyController.getPointsHistory);
router.post("/redeem", loyaltyController.redeemPoints);

module.exports = router;
