const mongoose = require("mongoose");

const pointTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["earn", "redeem", "adjust"],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
  },
  {
    timestamps: true,
  }
);

pointTransactionSchema.index({ user: 1, createdAt: -1 });

const PointTransaction = mongoose.model("PointTransaction", pointTransactionSchema);
module.exports = PointTransaction;
