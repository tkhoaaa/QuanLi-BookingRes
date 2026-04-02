const Review = require("../models/Review.model");
const Booking = require("../models/Booking.model");
const { ORDER_STATUS } = require("../utils/constants");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

// GET /reviews/food/:foodId -- list reviews with pagination, filter by rating, filter by hasPhotos
const getFoodReviews = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const { page = 1, limit = 10, rating, hasPhotos } = req.query;

  const query = { food: foodId };
  if (rating) query.rating = Number(rating);
  if (hasPhotos === "true") query.photos = { $exists: true, $ne: [] };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit))
    .populate("user", "name avatar")
    .populate("repliedBy", "name avatar");

  return res.status(200).json(
    new ApiResponse(200, {
      reviews,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  );
});

// Alias for compatibility with existing route
const getReviewsByFood = getFoodReviews;

// POST /reviews -- create review with photos, update food ratingAverage/ratingCount
const createReview = asyncHandler(async (req, res) => {
  const { bookingId, foodId, rating, comment, images, photos } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (booking.status !== ORDER_STATUS.DELIVERED) {
    return res.status(400).json({ message: "Can only review delivered orders" });
  }

  // Check if food is in this order
  const foodInOrder = booking.items.some(
    (item) => item.food.toString() === foodId
  );
  if (!foodInOrder) {
    return res.status(400).json({ message: "Food not in this order" });
  }

  // Check if already reviewed
  const existing = await Review.findOne({ user: req.user._id, booking: bookingId, food: foodId });
  if (existing) {
    return res.status(400).json({ message: "Already reviewed this food in this order" });
  }

  // Merge photos and images arrays (photos takes precedence, max 5)
  const mergedPhotos = [
    ...(Array.isArray(photos) ? photos : []),
    ...(Array.isArray(images) ? images : []),
  ].slice(0, 5);

  const review = await Review.create({
    user: req.user._id,
    booking: bookingId,
    food: foodId,
    rating,
    comment,
    photos: mergedPhotos,
    images: mergedPhotos,
  });

  // Mark booking as reviewed
  booking.review = review._id;
  await booking.save();

  const populated = await Review.findById(review._id).populate("user", "name avatar");

  return res.status(201).json(new ApiResponse(201, populated, "Review created"));
});

// POST /reviews/:id/reaction -- add reaction (helpful/fun/love)
const addReaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reaction } = req.body; // 'helpful' | 'fun' | 'love'

  const allowedReactions = ["helpful", "fun", "love"];
  if (!allowedReactions.includes(reaction)) {
    return res.status(400).json({ message: "Invalid reaction type. Must be helpful, fun, or love." });
  }

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  review.reactions[reaction] = (review.reactions[reaction] || 0) + 1;
  await review.save();

  return res.status(200).json(
    new ApiResponse(200, { reactions: review.reactions }, "Reaction added")
  );
});

// POST /reviews/:id/reply -- admin replies to a review
const adminReplyReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { repliedText } = req.body;

  if (!repliedText || !repliedText.trim()) {
    return res.status(400).json({ message: "Reply text is required" });
  }

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  review.repliedBy = req.user._id;
  review.repliedAt = new Date();
  review.repliedText = repliedText.trim();
  await review.save();

  const populated = await Review.findById(review._id)
    .populate("user", "name avatar")
    .populate("repliedBy", "name avatar");

  return res.status(200).json(
    new ApiResponse(200, populated, "Reply added")
  );
});

// DELETE /reviews/:id -- soft delete or remove
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id);

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  await Booking.findByIdAndUpdate(review.booking, { review: null });
  await review.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, "Review deleted"));
});

module.exports = {
  getReviewsByFood,
  getFoodReviews,
  createReview,
  addReaction,
  adminReplyReview,
  deleteReview,
};
