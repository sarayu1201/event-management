const express = require("express");
const router = express.Router();
const {
  saveTemplate,
  getTemplates,
  setDefaultTemplate,
  deleteTemplate,
  saveCustomForm,
  getCustomForm,
  getBookingTickets,
  transferTicket,
  importAttendees,
  getCheckInDashboardStats
} = require("../controllers/ticketingController");
const { protect, authorize } = require("../middleware/auth");
const { rateLimiter, sanitizeInput } = require("../middleware/security");

router.use(rateLimiter(200, 15 * 60 * 1000));
router.use(sanitizeInput);

router.use(protect);

// Templates Designer
router.post("/templates", authorize("organiser", "admin"), saveTemplate);
router.get("/templates", authorize("organiser", "admin"), getTemplates);
router.put("/templates/:id/default", authorize("organiser", "admin"), setDefaultTemplate);
router.delete("/templates/:id", authorize("organiser", "admin"), deleteTemplate);

// Form Builder
router.post("/custom-forms/:eventId", authorize("organiser", "admin"), saveCustomForm);
router.get("/custom-forms/:eventId", getCustomForm);

// Tickets & Transfers
router.get("/bookings/:bookingId/tickets", getBookingTickets);
router.post("/tickets/:ticketId/transfer", transferTicket);
router.post("/tickets/import", authorize("organiser", "admin"), importAttendees);

// Stats checkin dashboard
router.get("/events/:eventId/checkin-dashboard", authorize("organiser", "admin"), getCheckInDashboardStats);

module.exports = router;
