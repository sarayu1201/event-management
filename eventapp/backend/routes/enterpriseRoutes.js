const express = require("express");
const router = express.Router();
const {
  searchEvents,
  getSuggestions,
  toggleFavorite,
  getFavorites,
  getRecommendations,
  trackRecentlyViewed,
  getRecentlyViewed,
  createReview,
  getEventReviews,
  replyToReview,
  validateCoupon,
  createSupportTicket,
  getSupportTickets,
  replyToSupportTicket,
  getNotifications,
  markNotificationRead,
  downloadEventCalendar,
  requestRefund,
  getOrganiserAnalytics,
  exportAttendeesCSV,
  trackCampaignClick,
  sendBroadcast,
  createCoupon,
  getAllCoupons
} = require("../controllers/enterpriseController");
const { protect, authorize } = require("../middleware/auth");
const { rateLimiter, sanitizeInput } = require("../middleware/security");

// Global Security Middleware for enterprise routes
router.use(rateLimiter(150, 15 * 60 * 1000)); // 150 requests per 15 minutes limit
router.use(sanitizeInput);

// Public searches
router.get("/events/search", searchEvents);
router.get("/events/suggestions", getSuggestions);
router.get("/events/:id/ics", downloadEventCalendar);
router.get("/reviews/event/:eventId", getEventReviews);
router.post("/marketing/click", trackCampaignClick);

// Protected routes (Any logged-in user)
router.use(protect);

router.post("/favorites/toggle", toggleFavorite);
router.get("/favorites", getFavorites);
router.get("/recommendations", getRecommendations);
router.post("/recently-viewed", trackRecentlyViewed);
router.get("/recently-viewed", getRecentlyViewed);

router.post("/reviews", createReview);
router.post("/coupons/validate", validateCoupon);

router.post("/support/tickets", createSupportTicket);
router.get("/support/tickets", getSupportTickets);
router.post("/support/tickets/:id/reply", replyToSupportTicket);

router.get("/notifications", getNotifications);
router.put("/notifications/:id/read", markNotificationRead);

router.post("/bookings/:id/refund", requestRefund);

// Organiser protected routes
router.post("/reviews/:id/reply", authorize("organiser"), replyToReview);
router.get("/organiser/analytics", authorize("organiser"), getOrganiserAnalytics);
router.get("/events/:id/attendees/export", authorize("organiser"), exportAttendeesCSV);

// Admin protected routes
router.post("/admin/broadcast", authorize("admin"), sendBroadcast);
router.post("/admin/coupons", authorize("admin"), createCoupon);
router.get("/admin/coupons", authorize("admin"), getAllCoupons);

module.exports = router;
