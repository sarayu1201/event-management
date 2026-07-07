const express = require("express");
const router = express.Router();
const {
  updateGSTProfile,
  updateBusinessSettings,
  uploadDocuments,
  createPayoutProfile,
  getPayoutProfiles,
  setDefaultPayoutProfile,
  addCollaborator,
  addEventMedia,
  createArtist,
  getArtists,
  assignArtistToEvent,
  createScannerAccount,
  getScanners,
  resetScannerPassword,
  scannerGateCheckIn,
  getVerificationQueue,
  verifyOrganiserBadge,
  updateEventLifecycleStatus
} = require("../controllers/businessController");
const { protect, authorize } = require("../middleware/auth");
const { rateLimiter, sanitizeInput } = require("../middleware/security");

// Security settings
router.use(rateLimiter(200, 15 * 60 * 1000));
router.use(sanitizeInput);

// Scanner Login (Gate checkin triggers)
router.post("/scanner/check-in", protect, authorize("scanner", "organiser", "admin"), scannerGateCheckIn);

// Protected routes (Organisers, Admins)
router.use(protect);

// GST & Document center
router.post("/profile/gst", authorize("organiser", "admin"), updateGSTProfile);
router.post("/settings", authorize("organiser", "admin"), updateBusinessSettings);
router.post("/documents", authorize("organiser", "admin"), uploadDocuments);

// Payout profiles
router.post("/payout-profiles", authorize("organiser", "admin"), createPayoutProfile);
router.get("/payout-profiles", authorize("organiser", "admin"), getPayoutProfiles);
router.put("/payout-profiles/:id/default", authorize("organiser", "admin"), setDefaultPayoutProfile);

// Collaborators & Media
router.post("/events/:id/collaborators", authorize("organiser", "admin"), addCollaborator);
router.post("/events/:id/media", authorize("organiser", "admin"), addEventMedia);

// Artists
router.post("/artists", authorize("organiser", "admin"), createArtist);
router.get("/artists", authorize("organiser", "admin"), getArtists);
router.post("/events/:id/artists", authorize("organiser", "admin"), assignArtistToEvent);

// Scanner gate accounts creation
router.post("/scanners", authorize("organiser", "admin"), createScannerAccount);
router.get("/scanners", authorize("organiser", "admin"), getScanners);
router.put("/scanners/:id/reset-password", authorize("organiser", "admin"), resetScannerPassword);

// Admin exclusive verifications workflows
router.get("/admin/verifications", authorize("admin"), getVerificationQueue);
router.post("/admin/verifications/:id", authorize("admin"), verifyOrganiserBadge);
router.post("/admin/events/:id/flow", authorize("admin"), updateEventLifecycleStatus);

module.exports = router;
