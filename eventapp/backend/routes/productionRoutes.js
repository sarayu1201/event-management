const express = require("express");
const router = express.Router();
const {
  getFeatureFlags,
  toggleFeatureFlag,
  getWebhooks,
  createWebhook,
  testWebhook,
  getWebhookLogs,
  getTemplateVersions,
  saveTemplateVersion,
  rollbackTemplateVersion,
  getOpenApiSpec
} = require("../controllers/productionController");
const { protect, authorize } = require("../middleware/auth");

router.get("/openapi.json", getOpenApiSpec);

router.use(protect);

// Feature flags routes
router.get("/flags", getFeatureFlags);
router.put("/flags/:key", authorize("admin"), toggleFeatureFlag);

// Webhook subscription routes
router.get("/webhooks", authorize("organiser", "admin"), getWebhooks);
router.post("/webhooks", authorize("organiser", "admin"), createWebhook);
router.post("/webhooks/:id/test", authorize("organiser", "admin"), testWebhook);
router.get("/webhooks/logs", authorize("organiser", "admin"), getWebhookLogs);

// Designer templates versioning routes
router.get("/events/:eventId/versions", authorize("organiser", "admin"), getTemplateVersions);
router.post("/events/:eventId/versions", authorize("organiser", "admin"), saveTemplateVersion);
router.post("/events/:eventId/versions/:version/rollback", authorize("organiser", "admin"), rollbackTemplateVersion);

module.exports = router;
