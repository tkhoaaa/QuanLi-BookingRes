const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservation.controller");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");

// Public with auth: list and create (filtered by user role in controller)
router.get("/", verifyToken, reservationController.getReservations);
router.get("/:id", verifyToken, reservationController.getReservation);
router.post("/", verifyToken, reservationController.createReservation);
router.patch("/:id/status", verifyToken, restrictTo("admin"), reservationController.updateReservationStatus);
router.delete("/:id", verifyToken, reservationController.cancelReservation);

module.exports = router;
