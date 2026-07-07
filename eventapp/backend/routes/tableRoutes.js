const express = require("express");
const router = express.Router();
const {
  createTable,
  updateTable,
  deleteTable,
  getEventTables,
  createTableBooking,
  getTableBooking,
  cancelTableBooking,
  checkInTable,
  upgradeTable,
  transferTable
} = require("../controllers/tableController");
const { protect, authorize } = require("../middleware/auth");

// Organizer routes
router.post("/tables", protect, authorize("organiser", "admin"), createTable);
router.put("/tables/:id", protect, authorize("organiser", "admin"), updateTable);
router.delete("/tables/:id", protect, authorize("organiser", "admin"), deleteTable);
router.get("/events/:eventId/tables", protect, getEventTables);

// Customer bookings routes
router.get("/events/:eventId/table-layout", protect, getEventTables); // alias for layout visual fetch
router.post("/table-bookings", protect, createTableBooking);
router.get("/table-bookings/:id", protect, getTableBooking);
router.put("/table-bookings/:id/cancel", protect, cancelTableBooking);
router.put("/table-bookings/:id/check-in", protect, authorize("scanner", "organiser", "admin"), checkInTable);
router.put("/table-bookings/:id/upgrade", protect, authorize("organiser", "admin"), upgradeTable);
router.put("/table-bookings/:id/transfer", protect, transferTable);

module.exports = router;
