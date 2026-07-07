const mongoose = require("mongoose");

const webhookEndpointSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    secret: { type: String, required: true },
    events: { type: [String], default: ["booking.created", "payment.success"] },
    isActive: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WebhookEndpoint", webhookEndpointSchema);
