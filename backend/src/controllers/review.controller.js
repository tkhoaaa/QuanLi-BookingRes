const Review = require("../models/Review.model");
const Booking = require("../models/Booking.model");
const { ORDER_STATUS } = require("../utils/constants");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const createReview = asyncHandler(async (req, res) => {
  const { bookingId, foodId, rating, comment, images } = req.body;

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

  const review = await Review.create({
    user: req.user._id,
    booking: bookingId,
    food: foodId,
    rating,
    comment,
    images,
  });

  // Mark booking as reviewed
  booking.review = review._id;
  await booking.save();

  const populated = await Review.findById(review._id).populate("user", "name avatar");

  return res.status(201).json(new ApiResponse(201, populated, "Review created"));
});

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

const getFoodReviews = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Review.countDocuments({ food: foodId });
  const reviews = await Review.find({ food: foodId })
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit))
    .populate("user", "name avatar");

  return res.status(200).json(
    new ApiResponse(200, {
      reviews,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  );
});

module.exports = {
  createReview,
  deleteReview,
  getFoodReviews,
};
