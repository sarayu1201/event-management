const express = require("express");
const router = express.Router();
const { getMyPromotedEvents, getMyStats } = require("../controllers/promoterController");
const { protect, authorize } = require("../middleware/auth");

router.get("/events", protect, authorize("promoter"), getMyPromotedEvents);
router.get("/stats", protect, authorize("promoter"), getMyStats);

module.exports = router;
