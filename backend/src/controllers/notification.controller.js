const Notification = require("../models/Notification.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const total = await Notification.countDocuments({ user: req.user._id });
  const notifications = await Notification.find({ user: req.user._id })
    .sort("-createdAt")
    .skip(skip)
    .limit(Number(limit));

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    })
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  return res.status(200).json(new ApiResponse(200, notification, "Marked as read"));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  return res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
