const express = require("express");
const router = express.Router();
const { register, login, getMe, sendOTP, verifyOTP, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

module.exports = router;
