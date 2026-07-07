const express = require("express");
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  assignPromoter,
  getFilters,
  duplicateEvent,
  togglePauseEvent,
  cancelEvent,
  checkInAttendee,
} = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/auth");

// Specific routes before "/:id" so they aren't swallowed by the param route
router.get("/mine/organiser", protect, authorize("organiser"), getMyEvents);
router.get("/meta/filters", getFilters);

router.get("/", getEvents);
router.get("/:id", getEventById);

router.post("/", protect, authorize("organiser"), createEvent);
router.put("/:id", protect, authorize("organiser"), updateEvent);
router.delete("/:id", protect, authorize("organiser"), deleteEvent);
router.post("/:id/assign-promoter", protect, authorize("organiser"), assignPromoter);
router.post("/:id/duplicate", protect, authorize("organiser"), duplicateEvent);
router.put("/:id/toggle-pause", protect, authorize("organiser"), togglePauseEvent);
router.put("/:id/cancel", protect, authorize("organiser"), cancelEvent);
router.post("/:id/check-in", protect, authorize("organiser"), checkInAttendee);

module.exports = router;
