const express = require("express");
const router = express.Router();
const {
  lockSeat,
  releaseSeat,
  getLockedSeats,
  initiateTransfer,
  confirmTransfer,
  getSecureQRToken,
  logConflict,
  getObservabilityHealth,
  getObservabilityJobs
} = require("../controllers/enterpriseTicketingController");
const { protect, authorize } = require("../middleware/auth");
const { rateLimiter, sanitizeInput } = require("../middleware/security");

router.use(rateLimiter(200, 15 * 60 * 1000));
router.use(sanitizeInput);

router.use(protect);

// Seating lock engine
router.post("/seat-locks", lockSeat);
router.post("/seat-locks/release", releaseSeat);
router.get("/events/:eventId/seat-locks", getLockedSeats);

// OTP Verified transfers
router.post("/tickets/:ticketId/transfer/initiate", initiateTransfer);
router.post("/tickets/:ticketId/transfer/confirm", confirmTransfer);

// Rotating QR codes & secure tokens
router.get("/tickets/:ticketId/secure-qr", getSecureQRToken);

// Offline conflict logs
router.post("/scanner/conflicts", authorize("scanner", "organiser", "admin"), logConflict);

// Observability health status logs
router.get("/observability/health", authorize("admin"), getObservabilityHealth);
router.get("/observability/jobs", authorize("admin"), getObservabilityJobs);

module.exports = router;
