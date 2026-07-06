const express = require("express");
const router = express.Router();
const {
  processPayment,
  createPaymentSession,
  verifyPayment,
  handleCashfreeWebhook,
} = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/auth");

router.post("/process/:bookingId", protect, authorize("user"), processPayment);
router.post("/create-session/:bookingId", protect, authorize("user"), createPaymentSession);
router.post("/verify", protect, authorize("user"), verifyPayment);
router.post("/webhook", handleCashfreeWebhook);

module.exports = router;
