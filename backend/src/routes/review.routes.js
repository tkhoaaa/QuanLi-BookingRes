const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.get("/food/:foodId", reviewController.getFoodReviews);
router.post("/", verifyToken, reviewController.createReview);
router.delete("/:id", verifyToken, reviewController.deleteReview);

module.exports = router;
