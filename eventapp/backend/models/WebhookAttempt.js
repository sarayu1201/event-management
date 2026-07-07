const mongoose = require("mongoose");

const webhookAttemptSchema = new mongoose.Schema(
  {
    endpoint: { type: mongoose.Schema.Types.ObjectId, ref: "WebhookEndpoint", required: true },
    eventType: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    statusCode: { type: Number, default: 0 },
    responseBody: { type: String, default: "" },
    status: { type: String, enum: ["success", "failed"], default: "failed" },
    attempts: { type: Number, default: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WebhookAttempt", webhookAttemptSchema);
