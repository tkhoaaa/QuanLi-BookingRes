const mongoose = require("mongoose");
const Food = require("./Food.model");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    images: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ food: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ booking: 1 });

reviewSchema.post("save", async function () {
  const stats = await mongoose.model("Review").aggregate([
    { $match: { food: this.food } },
    {
      $group: {
        _id: "$food",
        ratingAverage: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Food.findByIdAndUpdate(this.food, {
      ratingAverage: Math.round(stats[0].ratingAverage * 10) / 10,
      ratingCount: stats[0].ratingCount,
    });
  }
});

reviewSchema.post("deleteOne", { document: true, query: false }, async function () {
  const stats = await mongoose.model("Review").aggregate([
    { $match: { food: this.food } },
    {
      $group: {
        _id: "$food",
        ratingAverage: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Food.findByIdAndUpdate(this.food, {
      ratingAverage: Math.round(stats[0].ratingAverage * 10) / 10,
      ratingCount: stats[0].ratingCount,
    });
  } else {
    await Food.findByIdAndUpdate(this.food, {
      ratingAverage: 0,
      ratingCount: 0,
    });
  }
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
