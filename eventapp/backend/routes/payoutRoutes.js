const express = require("express");
const router = express.Router();
const {
  requestWithdrawal,
  getPayouts,
  getEarningsOverview,
} = require("../controllers/payoutController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.use(authorize("organiser"));

router.get("/", getPayouts);
router.get("/overview", getEarningsOverview);
router.post("/withdraw", requestWithdrawal);

module.exports = router;
