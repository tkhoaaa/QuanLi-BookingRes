const Review = require("../models/Review.model");
const Booking = require("../models/Booking.model");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const getAllReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    rating = '',
    hasPhotos = '',
    sort = 'newest',
    dateFrom = '',
    dateTo = '',
  } = req.query;

  const query = {};

  if (rating) {
    query.rating = Number(rating);
  }

  if (hasPhotos === 'true') {
    query.$or = [
      { photos: { $exists: true, $ne: [] } },
      { images: { $exists: true, $ne: [] } },
    ];
  } else if (hasPhotos === 'false') {
    query.$and = [
      { $or: [{ photos: { $exists: false } }, { photos: [] }] },
      { $or: [{ images: { $exists: false } }, { images: [] }] },
    ];
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
  }

  const skip = (Number(page) - 1) * Number(limit);

  let sortOption = { createdAt: -1 };
  if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
  else if (sort === 'most_reactions') sortOption = { createdAt: -1 };

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name avatar email')
      .populate('food', 'name images')
      .populate('booking', 'orderCode')
      .lean(),
    Review.countDocuments(query),
  ]);

  // Apply text search in memory (searches user name, food name, comment)
  let filtered = reviews;
  if (search) {
    const q = search.toLowerCase();
    filtered = reviews.filter(r =>
      r.user?.name?.toLowerCase().includes(q) ||
      r.food?.name?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q)
    );
  }

  // Sort by reactions after filtering (since reactions field can't be sorted easily)
  if (sort === 'most_reactions') {
    filtered.sort((a, b) => {
      const aReactions = (a.reactions?.helpful || 0) + (a.reactions?.fun || 0) + (a.reactions?.love || 0);
      const bReactions = (b.reactions?.helpful || 0) + (b.reactions?.fun || 0) + (b.reactions?.love || 0);
      return bReactions - aReactions;
    });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      reviews: filtered,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
});

const replyToReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Reply text is required' });
  }

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  review.repliedText = text.trim();
  review.repliedAt = new Date();
  review.repliedBy = req.user._id;
  await review.save();

  const populated = await Review.findById(id)
    .populate('user', 'name avatar email')
    .populate('food', 'name images')
    .populate('booking', 'orderCode');

  return res.status(200).json(new ApiResponse(200, populated, 'Reply added'));
});

const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  await Booking.findByIdAndUpdate(review.booking, { review: null });
  await review.deleteOne();

  return res.status(200).json(new ApiResponse(200, null, 'Review deleted'));
});

module.exports = {
  getAllReviews,
  replyToReview,
  deleteReview,
};
