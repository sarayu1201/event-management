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

router.use(protect);

// Organizer routes
router.post("/tables", authorize("organiser", "admin"), createTable);
router.put("/tables/:id", authorize("organiser", "admin"), updateTable);
router.delete("/tables/:id", authorize("organiser", "admin"), deleteTable);
router.get("/events/:eventId/tables", getEventTables);

// Customer bookings routes
router.get("/events/:eventId/table-layout", getEventTables); // alias for layout visual fetch
router.post("/table-bookings", createTableBooking);
router.get("/table-bookings/:id", getTableBooking);
router.put("/table-bookings/:id/cancel", cancelTableBooking);
router.put("/table-bookings/:id/check-in", authorize("scanner", "organiser", "admin"), checkInTable);
router.put("/table-bookings/:id/upgrade", authorize("organiser", "admin"), upgradeTable);
router.put("/table-bookings/:id/transfer", transferTable);

module.exports = router;
