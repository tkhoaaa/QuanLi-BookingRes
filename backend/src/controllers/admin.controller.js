const User = require("../models/User.model");
const Food = require("../models/Food.model");
const Booking = require("../models/Booking.model");
const { USER_ROLES } = require("../utils/constants");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalRevenue = await Booking.aggregate([
    { $match: { status: { $nin: ["cancelled"] }, paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);

  const totalOrders = await Booking.countDocuments({ status: { $ne: "cancelled" } });
  const totalUsers = await User.countDocuments({ role: USER_ROLES.CUSTOMER });
  const totalFoods = await Food.countDocuments();

  const topFoods = await Booking.aggregate([
    { $unwind: "$items" },
    { $group: { _id: "$items.food", name: { $first: "$items.name" }, totalSold: { $sum: "$items.quantity" } } },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    { $lookup: { from: "foods", localField: "_id", foreignField: "_id", as: "food" } },
    { $unwind: "$food" },
    { $project: { name: 1, totalSold: 1, image: "$food.images" } },
  ]);

  const ordersByStatus = await Booking.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const revenueByDay = await Booking.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo }, status: { $nin: ["cancelled"] }, paymentStatus: "paid" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders,
      totalUsers,
      totalFoods,
      topFoods,
      ordersByStatus,
      revenueByDay,
    })
  );
});

const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role } = req.query;
  const query = {};
  if (role) query.role = role;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query).sort("-createdAt").skip(skip).limit(Number(limit));

  return res.status(200).json(
    new ApiResponse(200, {
      users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  );
});

const getShippers = asyncHandler(async (req, res) => {
  const shippers = await User.find({ role: USER_ROLES.SHIPPER }).select("name phone email avatar");
  return res.status(200).json(new ApiResponse(200, shippers));
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Booking.countDocuments(query);
  const orders = await Booking.find(query)
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit))
    .populate("user", "name email phone")
    .populate("items.food", "name images price")
    .populate("shipper", "name phone");

  return res.status(200).json(
    new ApiResponse(200, {
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    })
  );
});

module.exports = {
  getStats,
  getAllUsers,
  getShippers,
  getAllOrders,
};
