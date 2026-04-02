const Booking = require("../models/Booking.model");
const Food = require("../models/Food.model");
const User = require("../models/User.model");
const Branch = require("../models/Branch.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

function getDateRange(range) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  let start, end, prevStart, prevEnd;

  if (range === "today") {
    start = todayStart;
    end = todayEnd;
    prevStart = new Date(todayStart);
    prevStart.setDate(prevStart.getDate() - 1);
    prevEnd = todayStart;
  } else if (range === "7d") {
    start = new Date(todayStart);
    start.setDate(start.getDate() - 6);
    end = todayEnd;
    prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 7);
    prevEnd = start;
  } else if (range === "30d") {
    start = new Date(todayStart);
    start.setDate(start.getDate() - 29);
    end = todayEnd;
    prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 30);
    prevEnd = start;
  } else {
    // default to 7 days
    start = new Date(todayStart);
    start.setDate(start.getDate() - 6);
    end = todayEnd;
    prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 7);
    prevEnd = start;
  }

  return { start, end, prevStart, prevEnd };
}

// GET /api/analytics/overview
const getOverviewStats = asyncHandler(async (req, res) => {
  const { range = "7d", branchId } = req.query;
  const { start, end, prevStart, prevEnd } = getDateRange(range);

  const delivered = { status: "delivered" };
  const baseFilter = { ...delivered, updatedAt: { $gte: start, $lt: end } };
  const prevFilter = { ...delivered, updatedAt: { $gte: prevStart, $lt: prevEnd } };
  if (branchId) {
    baseFilter.branch = branchId;
    prevFilter.branch = branchId;
  }

  // Current period
  const currOrders = await Booking.find({
    ...delivered,
    updatedAt: { $gte: start, $lt: end },
  });
  const currRevenue = currOrders.reduce((s, o) => s + (o.total || 0), 0);
  const currOrderCount = currOrders.length;
  const avgOrderValue = currOrderCount > 0 ? Math.round(currRevenue / currOrderCount) : 0;

  // Previous period
  const prevOrders = await Booking.find({
    ...delivered,
    updatedAt: { $gte: prevStart, $lt: prevEnd },
  });
  const prevRevenue = prevOrders.reduce((s, o) => s + (o.total || 0), 0);
  const prevOrderCount = prevOrders.length;
  const prevAvg = prevOrderCount > 0 ? Math.round(prevRevenue / prevOrderCount) : 0;

  const revenueGrowth =
    prevRevenue > 0 ? Math.round(((currRevenue - prevRevenue) / prevRevenue) * 100) : currRevenue > 0 ? 100 : 0;
  const ordersGrowth =
    prevOrderCount > 0 ? Math.round(((currOrderCount - prevOrderCount) / prevOrderCount) * 100) : currOrderCount > 0 ? 100 : 0;
  const avgGrowth = prevAvg > 0 ? Math.round(((avgOrderValue - prevAvg) / prevAvg) * 100) : avgOrderValue > 0 ? 100 : 0;

  // Totals
  const totalOrders = await Booking.countDocuments({ status: "delivered" });
  const totalUsers = await User.countDocuments({ role: "customer" });
  const totalFoods = await Food.countDocuments();

  return res.status(200).json(
    new ApiResponse(200, {
      totalRevenue: currRevenue,
      totalOrders: currOrderCount,
      avgOrderValue,
      totalAllTimeOrders: totalOrders,
      totalUsers,
      totalFoods,
      revenueGrowth,
      ordersGrowth,
      avgGrowth,
      range,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    })
  );
});

// GET /api/analytics/revenue
const getRevenueChart = asyncHandler(async (req, res) => {
  const { range = "7d", branchId } = req.query;
  const { start, end } = getDateRange(range);

  let numDays;
  if (range === "today") {
    numDays = 1;
  } else if (range === "7d") {
    numDays = 7;
  } else {
    numDays = 30;
  }

  const baseFilter = { status: "delivered", updatedAt: { $gte: start, $lt: end } }
  if (branchId) baseFilter.branch = branchId;

  const bookings = await Booking.find(baseFilter);

  const chartData = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayBookings = bookings.filter((o) => {
      const od = new Date(o.updatedAt);
      return od >= dayStart && od < dayEnd;
    });

    chartData.push({
      date: dayStart.toISOString().split("T")[0],
      label: dayStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      shortLabel: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][dayStart.getDay()],
      revenue: dayBookings.reduce((s, o) => s + (o.total || 0), 0),
      orderCount: dayBookings.length,
    });
  }

  return res.status(200).json(new ApiResponse(200, chartData));
});

// GET /api/analytics/top-items
const getTopSellingItems = asyncHandler(async (req, res) => {
  const { range = "7d", limit = 10, branchId } = req.query;
  const { start, end } = getDateRange(range);

  const baseFilter = { status: "delivered", updatedAt: { $gte: start, $lt: end } };
  if (branchId) baseFilter.branch = branchId;

  const bookings = await Booking.find(baseFilter).populate("items.food", "name category images");

  const soldCount = {};
  bookings.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = item.food?._id?.toString() || item.name;
      if (!soldCount[key]) {
        soldCount[key] = {
          foodId: item.food?._id,
          name: item.food?.name || item.name || "Unknown",
          category: item.food?.category || item.category,
          image: item.food?.images?.[0] || item.image,
          quantity: 0,
          revenue: 0,
        };
      }
      soldCount[key].quantity += item.quantity || 1;
      soldCount[key].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });

  const topItems = Object.values(soldCount)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, Number(limit));

  return res.status(200).json(new ApiResponse(200, topItems));
});

// GET /api/analytics/category-revenue
const getCategoryRevenue = asyncHandler(async (req, res) => {
  const { range = "7d", branchId } = req.query;
  const { start, end } = getDateRange(range);

  const baseFilter = { status: "delivered", updatedAt: { $gte: start, $lt: end } };
  if (branchId) baseFilter.branch = branchId;

  const bookings = await Booking.find(baseFilter).populate("items.food", "category");

  const catRevenue = {};
  let totalRevenue = 0;
  bookings.forEach((order) => {
    (order.items || []).forEach((item) => {
      const cat = item.food?.category || "other";
      const itemRevenue = (item.price || 0) * (item.quantity || 1);
      catRevenue[cat] = (catRevenue[cat] || 0) + itemRevenue;
      totalRevenue += itemRevenue;
    });
  });

  const result = Object.entries(catRevenue)
    .map(([category, value]) => ({
      category,
      revenue: value,
      percent: totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return res.status(200).json(
    new ApiResponse(200, {
      categories: result,
      totalRevenue,
    })
  );
});

// GET /api/analytics/order-status
const getOrderStatusStats = asyncHandler(async (req, res) => {
  const { range = "7d", branchId } = req.query;
  const { start, end } = getDateRange(range);

  const baseFilter = { updatedAt: { $gte: start, $lt: end } };
  if (branchId) baseFilter.branch = branchId;

  const bookings = await Booking.find(baseFilter);

  const counts = {};
  bookings.forEach((o) => {
    counts[o.status] = (counts[o.status] || 0) + 1;
  });

  const statusColors = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    preparing: "#f97316",
    picking: "#a855f7",
    delivering: "#06b6d4",
    delivered: "#22c55e",
    cancelled: "#ef4444",
  };

  const result = Object.entries(counts)
    .map(([status, count]) => ({
      status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: statusColors[status] || "#6b7280",
    }))
    .sort((a, b) => b.count - a.count);

  return res.status(200).json(new ApiResponse(200, result));
});

// GET /api/analytics/branch-comparison
const getBranchComparison = asyncHandler(async (req, res) => {
  const { range = '7d' } = req.query;
  const { start, end } = getDateRange(range);

  const branches = await Branch.find({ isActive: true }).sort('name');

  const comparison = await Promise.all(
    branches.slice(0, 5).map(async (branch) => {
      const bookings = await Booking.find({
        status: 'delivered',
        updatedAt: { $gte: start, $lt: end },
        branch: branch._id,
      });
      const revenue = bookings.reduce((s, o) => s + (o.total || 0), 0);
      const orderCount = bookings.length;
      return {
        branchId: branch._id,
        branchName: branch.name,
        revenue,
        orderCount,
        avgOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      };
    })
  );

  const sorted = comparison.sort((a, b) => b.revenue - a.revenue);

  return res.status(200).json(new ApiResponse(200, sorted));
});

module.exports = {
  getOverviewStats,
  getRevenueChart,
  getTopSellingItems,
  getCategoryRevenue,
  getOrderStatusStats,
  getBranchComparison,
};
