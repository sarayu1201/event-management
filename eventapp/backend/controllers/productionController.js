const crypto = require("crypto");
const axios = require("axios");
const FeatureFlag = require("../models/FeatureFlag");
const WebhookEndpoint = require("../models/WebhookEndpoint");
const WebhookAttempt = require("../models/WebhookAttempt");
const TemplateVersion = require("../models/TemplateVersion");
const LoginHistory = require("../models/LoginHistory");

// Webhook Dispatcher Helper
const dispatchWebhook = async (ownerId, eventType, payload) => {
  try {
    const endpoints = await WebhookEndpoint.find({ owner: ownerId, events: eventType, isActive: true });
    for (const ep of endpoints) {
      // Generate HMAC signature signature verification header
      const signature = crypto
        .createHmac("sha256", ep.secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      try {
        const res = await axios.post(ep.url, payload, {
          headers: {
            "Content-Type": "application/json",
            "x-eventhub-signature": signature
          },
          timeout: 4000
        });

        await WebhookAttempt.create({
          endpoint: ep._id,
          eventType,
          payload,
          statusCode: res.status,
          responseBody: JSON.stringify(res.data || {}).substring(0, 500),
          status: "success"
        });
      } catch (err) {
        await WebhookAttempt.create({
          endpoint: ep._id,
          eventType,
          payload,
          statusCode: err.response?.status || 500,
          responseBody: err.message || "Timeout / connection error",
          status: "failed"
        });
      }
    }
  } catch (err) {
    console.error("Webhook dispatching failure", err);
  }
};

// ==========================================
// 1. FEATURE FLAGS CONTROLS
// ==========================================

const getFeatureFlags = async (req, res, next) => {
  try {
    // Seed default flags if database is empty
    const count = await FeatureFlag.countDocuments();
    if (count === 0) {
      await FeatureFlag.insertMany([
        { flagKey: "coupons", isEnabled: true, description: "Coupon discount validation module" },
        { flagKey: "wallet_pass", isEnabled: true, description: "Apple & Google wallet downloads" },
        { flagKey: "qr_rotation", isEnabled: true, description: "Time-rotating secure QR codes" },
        { flagKey: "seat_selection", isEnabled: true, description: "Checkout seat locks maps" }
      ]);
    }

    const flags = await FeatureFlag.find();
    res.json(flags);
  } catch (err) {
    next(err);
  }
};

const toggleFeatureFlag = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { isEnabled } = req.body;

    let flag = await FeatureFlag.findOne({ flagKey: key });
    if (!flag) {
      flag = new FeatureFlag({ flagKey: key });
    }
    flag.isEnabled = isEnabled;
    await flag.save();

    res.json({ message: `Feature flag '${key}' updated successfully.`, flag });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. WEBHOOK MANAGEMENT CONTROLLERS
// ==========================================

const getWebhooks = async (req, res, next) => {
  try {
    const endpoints = await WebhookEndpoint.find({ owner: req.user._id });
    res.json(endpoints);
  } catch (err) {
    next(err);
  }
};

const createWebhook = async (req, res, next) => {
  try {
    const { url, events } = req.body;
    if (!url) return res.status(400).json({ message: "Webhook payload URL is required" });

    const secret = "whsec_" + crypto.randomBytes(16).toString("hex");

    const endpoint = await WebhookEndpoint.create({
      url,
      secret,
      events: events || ["booking.created", "payment.success"],
      owner: req.user._id
    });

    res.status(201).json(endpoint);
  } catch (err) {
    next(err);
  }
};

const testWebhook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ep = await WebhookEndpoint.findById(id);
    if (!ep) return res.status(404).json({ message: "Endpoint not found" });

    const payload = {
      event: "webhook.test",
      timestamp: new Date(),
      data: { test: true, message: "Hello EventHub webhook consumer!" }
    };

    // Calculate HMAC
    const signature = crypto
      .createHmac("sha256", ep.secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    let statusCode = 200;
    let status = "success";
    let responseBody = "Simulation successful";

    try {
      const resp = await axios.post(ep.url, payload, {
        headers: { "x-eventhub-signature": signature },
        timeout: 3000
      });
      statusCode = resp.status;
      responseBody = JSON.stringify(resp.data || {});
    } catch (err) {
      statusCode = err.response?.status || 500;
      responseBody = err.message || "Timeout error";
      status = "failed";
    }

    const log = await WebhookAttempt.create({
      endpoint: ep._id,
      eventType: "webhook.test",
      payload,
      statusCode,
      responseBody: responseBody.substring(0, 500),
      status
    });

    res.json({ message: "Test payload dispatched successfully", log });
  } catch (err) {
    next(err);
  }
};

const getWebhookLogs = async (req, res, next) => {
  try {
    const endpoints = await WebhookEndpoint.find({ owner: req.user._id });
    const epIds = endpoints.map(e => e._id);
    const logs = await WebhookAttempt.find({ endpoint: { $in: epIds } }).sort({ createdAt: -1 }).limit(30);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. TICKET TEMPLATE VERSION HISTORY
// ==========================================

const getTemplateVersions = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const list = await TemplateVersion.find({ event: eventId }).sort({ version: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
};

const saveTemplateVersion = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { elements, changeLog, publish } = req.body;

    const count = await TemplateVersion.countDocuments({ event: eventId });
    const version = count + 1;

    const vDoc = await TemplateVersion.create({
      event: eventId,
      version,
      elements: elements || [],
      status: publish ? "published" : "draft",
      changeLog: changeLog || `Saved version ${version}`,
      updatedBy: req.user._id
    });

    if (publish) {
      // Mark all others draft
      await TemplateVersion.updateMany({ event: eventId, _id: { $ne: vDoc._id } }, { status: "draft" });
    }

    res.status(201).json(vDoc);
  } catch (err) {
    next(err);
  }
};

const rollbackTemplateVersion = async (req, res, next) => {
  try {
    const { eventId, version } = req.params;
    const target = await TemplateVersion.findOne({ event: eventId, version: Number(version) });
    if (!target) return res.status(404).json({ message: "Version not found" });

    // Mark it as published published, others as drafts
    target.status = "published";
    await target.save();

    await TemplateVersion.updateMany({ event: eventId, _id: { $ne: target._id } }, { status: "draft" });

    res.json({ message: `Successfully rolled back design template coordinates to version ${version}`, target });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4. OPENAPI SWAGGER SPECIFICATION JSON
// ==========================================

const getOpenApiSpec = async (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "EventHub Platform API Specification",
      version: "2.0.0",
      description: "Enterprise backend API endpoints documentation for event ticketing, payments, scanners, and feature flags."
    },
    servers: [{ url: "/api/v2" }],
    paths: {
      "/auth/login": {
        post: {
          summary: "Authenticates users via mobile number and credentials otp verification",
          responses: { 200: { description: "Successful login validation and JWT return" } }
        }
      },
      "/events": {
        get: {
          summary: "Lists all approved and active visibility ticket bookings events list",
          responses: { 200: { description: "Array of events matching location boundaries" } }
        }
      }
    }
  });
};

module.exports = {
  getFeatureFlags,
  toggleFeatureFlag,
  getWebhooks,
  createWebhook,
  testWebhook,
  getWebhookLogs,
  getTemplateVersions,
  saveTemplateVersion,
  rollbackTemplateVersion,
  getOpenApiSpec,
  dispatchWebhook
};
