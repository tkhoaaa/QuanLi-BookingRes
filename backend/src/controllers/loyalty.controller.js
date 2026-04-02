const User = require("../models/User.model");
const PointTransaction = require("../models/PointTransaction.model");
const Coupon = require("../models/Coupon.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500000,
  gold: 2000000,
  diamond: 5000000,
};

const TIER_BENEFITS = {
  bronze: { pointsRate: 1, freeDelivery: false, discount: 0 },
  silver: { pointsRate: 1.2, freeDelivery: false, discount: 2 },
  gold: { pointsRate: 1.5, freeDelivery: true, discount: 5 },
  diamond: { pointsRate: 2, freeDelivery: true, discount: 10 },
};

const POINTS_PER_VND = 0.1; // 1 point per 10,000 VND spent
const POINTS_TO_REDEEM = 100; // 100 points = 10,000 VND discount
const REDEEM_VALUE = 10000; // 10,000 VND discount per 100 points

function recalculateTier(totalSpent) {
  if (totalSpent >= TIER_THRESHOLDS.diamond) return "diamond";
  if (totalSpent >= TIER_THRESHOLDS.gold) return "gold";
  if (totalSpent >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

function getNextTierThreshold(currentTier) {
  const order = ["bronze", "silver", "gold", "diamond"];
  const idx = order.indexOf(currentTier);
  if (idx >= order.length - 1) return null;
  return TIER_THRESHOLDS[order[idx + 1]];
}

// GET /api/loyalty/me
const getMyLoyalty = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const currentTier = user.memberTier || "bronze";
  const nextThreshold = getNextTierThreshold(currentTier);
  const benefits = TIER_BENEFITS[currentTier];

  const progress =
    nextThreshold
      ? Math.min(
          100,
          Math.round(
            ((user.totalSpent - TIER_THRESHOLDS[currentTier]) /
              (nextThreshold - TIER_THRESHOLDS[currentTier])) *
              100
          )
        )
      : 100;

  return res.status(200).json(
    new ApiResponse(200, {
      points: user.loyaltyPoints || 0,
      totalSpent: user.totalSpent || 0,
      memberTier: currentTier,
      tierLabel:
        currentTier === "bronze"
          ? "Đồng"
          : currentTier === "silver"
          ? "Bạc"
          : currentTier === "gold"
          ? "Vàng"
          : "Kim Cương",
      benefits,
      progress,
      nextTierThreshold: nextThreshold,
      nextTierLabel:
        nextThreshold === TIER_THRESHOLDS.silver
          ? "Bạc"
          : nextThreshold === TIER_THRESHOLDS.gold
          ? "Vàng"
          : nextThreshold === TIER_THRESHOLDS.diamond
          ? "Kim Cương"
          : null,
      pointsToNextTier:
        nextThreshold !== null ? nextThreshold - user.totalSpent : 0,
    })
  );
});

// GET /api/loyalty/history
const getPointsHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const total = await PointTransaction.countDocuments({ user: req.user._id });
  const transactions = await PointTransaction.find({ user: req.user._id })
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit))
    .populate("orderId", "orderCode")
    .populate("couponId", "code value type");

  return res.status(200).json(
    new ApiResponse(200, {
      transactions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
});

// POST /api/loyalty/redeem
const redeemPoints = asyncHandler(async (req, res) => {
  const { points } = req.body;

  if (!points || typeof points !== "number" || points < 100) {
    return res
      .status(400)
      .json({ message: "Tối thiểu 100 điểm để đổi" });
  }

  if (points % POINTS_TO_REDEEM !== 0) {
    return res
      .status(400)
      .json({ message: `Số điểm phải là bội số của ${POINTS_TO_REDEEM}` });
  }

  const user = await User.findById(req.user._id);

  if (user.loyaltyPoints < points) {
    return res
      .status(400)
      .json({ message: "Số dư điểm không đủ" });
  }

  // Calculate discount value
  const discountBatch = Math.floor(points / POINTS_TO_REDEEM);
  const totalDiscount = discountBatch * REDEEM_VALUE;

  // Generate unique coupon code
  const code = `DIEM${Date.now()}${Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0")}`;

  const coupon = await Coupon.create({
    code,
    type: "fixed",
    value: totalDiscount,
    minOrder: totalDiscount, // min order must be at least the discount value
    usageLimit: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
  });

  // Deduct points
  user.loyaltyPoints -= points;
  await user.save();

  // Record transaction
  await PointTransaction.create({
    user: user._id,
    type: "redeem",
    points: -points,
    description: `Đổi ${points} điểm = ${discountBatch} voucher ${formatCurrency(totalDiscount)}`,
    couponId: coupon._id,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      coupon: {
        code: coupon.code,
        value: coupon.value,
        type: coupon.type,
        minOrder: coupon.minOrder,
        endDate: coupon.endDate,
      },
      pointsRedeemed: points,
      discountValue: totalDiscount,
    }, "Đổi điểm thành công")
  );
});

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

module.exports = {
  getMyLoyalty,
  getPointsHistory,
  redeemPoints,
  recalculateTier,
  POINTS_PER_VND,
};
