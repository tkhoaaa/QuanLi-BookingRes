const Coupon = require("../models/Coupon.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort("-createdAt");
  return res.status(200).json(new ApiResponse(200, coupons));
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return res.status(201).json(new ApiResponse(201, coupon, "Coupon created"));
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }
  return res.status(200).json(new ApiResponse(200, coupon, "Coupon updated"));
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }
  return res.status(200).json(new ApiResponse(200, null, "Coupon deleted"));
});

const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }

  if (!coupon.isActive) {
    return res.status(400).json({ message: "Coupon is not active" });
  }

  const now = new Date();
  if (coupon.startDate > now) {
    return res.status(400).json({ message: "Coupon is not yet valid" });
  }
  if (coupon.endDate < now) {
    return res.status(400).json({ message: "Coupon has expired" });
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ message: "Coupon usage limit reached" });
  }
  if (subtotal && subtotal < coupon.minOrder) {
    return res.status(400).json({ message: `Minimum order is ${coupon.minOrder}` });
  }

  let discountAmount = coupon.value;
  if (coupon.type === "percent") {
    discountAmount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  }

  return res.status(200).json(
    new ApiResponse(200, {
      coupon,
      discountAmount: Math.round(discountAmount),
      freeShipping: coupon.freeShipping,
    })
  );
});

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
