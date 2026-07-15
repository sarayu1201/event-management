const express = require("express");
const router = express.Router();
const { register, login, getMe, sendOTP, verifyOTP, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { rateLimiter } = require("../middleware/security");

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", rateLimiter(5, 10 * 60 * 1000), sendOTP);
router.post("/verify-otp", rateLimiter(5, 10 * 60 * 1000), verifyOTP);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

module.exports = router;
