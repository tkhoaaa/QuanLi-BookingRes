const Reservation = require("../models/Reservation.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const getReservations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, branchId, date, status } = req.query;

  const query = {};

  // Customers see only their own reservations
  if (req.user.role === "customer") {
    query.customer = req.user._id;
  }

  if (branchId) {
    query.branch = branchId;
  }
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }
  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Reservation.countDocuments(query);
  const reservations = await Reservation.find(query)
    .sort({ date: -1, time: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("customer", "name email phone")
    .populate("branch", "name address phone");

  return res.status(200).json(
    new ApiResponse(200, {
      reservations,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    })
  );
});

const getReservation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reservation = await Reservation.findById(id)
    .populate("customer", "name email phone")
    .populate("branch", "name address phone");

  if (!reservation) {
    return res.status(404).json({ message: "Reservation not found" });
  }

  // Customers can only view their own reservations
  if (req.user.role === "customer" && reservation.customer._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Access denied" });
  }

  return res.status(200).json(new ApiResponse(200, reservation));
});

const createReservation = asyncHandler(async (req, res) => {
  const { branch, date, time, guests, name, phone, note } = req.body;

  // Validate date is not in the past
  const reservationDate = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (reservationDate < now) {
    return res.status(400).json({ message: "Cannot book a date in the past" });
  }

  // Validate time format
  const timeRegex = /^([01]\d|2[0-3]):([03]0)$/;
  if (!timeRegex.test(time)) {
    return res.status(400).json({ message: "Invalid time format. Use HH:00 or HH:30" });
  }

  const reservation = await Reservation.create({
    customer: req.user._id,
    branch,
    date,
    time,
    guests,
    name,
    phone,
    note,
  });

  const populated = await Reservation.findById(reservation._id)
    .populate("customer", "name email phone")
    .populate("branch", "name address phone");

  return res.status(201).json(new ApiResponse(201, populated, "Reservation created"));
});

const updateReservationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, tableNumber } = req.body;

  const reservation = await Reservation.findById(id);
  if (!reservation) {
    return res.status(404).json({ message: "Reservation not found" });
  }

  // Validate status transition
  const validTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  if (!validTransitions[reservation.status].includes(status)) {
    return res.status(400).json({
      message: `Cannot change status from '${reservation.status}' to '${status}'`,
    });
  }

  reservation.status = status;
  if (tableNumber !== undefined) {
    reservation.tableNumber = tableNumber;
  }
  await reservation.save();

  const updated = await Reservation.findById(id)
    .populate("customer", "name email phone")
    .populate("branch", "name address phone");

  return res.status(200).json(new ApiResponse(200, updated, "Reservation status updated"));
});

const cancelReservation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const reservation = await Reservation.findById(id);
  if (!reservation) {
    return res.status(404).json({ message: "Reservation not found" });
  }

  // Customers can only cancel their own pending/confirmed reservations
  if (req.user.role === "customer") {
    if (reservation.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (!["pending", "confirmed"].includes(reservation.status)) {
      return res.status(400).json({ message: "Cannot cancel a completed or already cancelled reservation" });
    }
  }

  reservation.status = "cancelled";
  await reservation.save();

  return res.status(200).json(new ApiResponse(200, null, "Reservation cancelled"));
});

module.exports = {
  getReservations,
  getReservation,
  createReservation,
  updateReservationStatus,
  cancelReservation,
};
