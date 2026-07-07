const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  toggleUserStatus,
  createPromoterAccount,
  getAllEvents,
  updateEventStatus,
  getAllBookings,
  getAllWithdrawals,
  processWithdrawalRequest,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

// Protect all admin routes and authorize role "admin"
router.use(protect);
router.use(authorize("admin"));

router.get("/users", getAllUsers);
router.put("/users/:id/toggle-active", toggleUserStatus);
router.post("/promoters", createPromoterAccount);

router.get("/events", getAllEvents);
router.put("/events/:id/status", updateEventStatus);

router.get("/bookings", getAllBookings);

router.get("/withdrawals", getAllWithdrawals);
router.put("/withdrawals/:id", processWithdrawalRequest);

module.exports = router;
