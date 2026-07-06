const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getBookingsForEvent,
} = require("../controllers/bookingController");
const { protect, authorize } = require("../middleware/auth");

router.post("/", protect, authorize("user"), createBooking);
router.get("/mine", protect, authorize("user"), getMyBookings);
router.get("/event/:eventId", protect, authorize("organiser"), getBookingsForEvent);
router.get("/:id", protect, getBookingById);

module.exports = router;
