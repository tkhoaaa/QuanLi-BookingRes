const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const reviewController = require("../controllers/review.controller");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

// Multer config for review photo uploads
const reviewPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/reviews"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `review-photo-${uniqueSuffix}${ext}`);
  },
});

const reviewPhotoFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only image files are allowed (jpeg, jpg, png, webp)"));
};

const uploadReviewPhotos = multer({
  storage: reviewPhotoStorage,
  fileFilter: reviewPhotoFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB per file, max 5 files
});

// POST /api/reviews/upload-photos -- upload multiple review photos
const uploadReviewPhotosHandler = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  const urls = req.files.map((file) => `/uploads/reviews/${file.filename}`);
  return res.status(200).json(
    new ApiResponse(200, { urls, count: urls.length }, "Photos uploaded")
  );
});

// Public routes
router.get("/food/:foodId", reviewController.getFoodReviews);

// Authenticated routes
router.post("/", verifyToken, reviewController.createReview);
router.post("/:id/reaction", verifyToken, reviewController.addReaction);

// Admin-only routes
router.post("/:id/reply", verifyToken, restrictTo("admin"), reviewController.adminReplyReview);

// Photo upload (authenticated)
router.post(
  "/upload-photos",
  verifyToken,
  uploadReviewPhotos.array("photos", 5),
  uploadReviewPhotosHandler
);

// Authenticated delete
router.delete("/:id", verifyToken, reviewController.deleteReview);

module.exports = router;
