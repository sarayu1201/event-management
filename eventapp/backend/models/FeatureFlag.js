const mongoose = require("mongoose");

const featureFlagSchema = new mongoose.Schema(
  {
    flagKey: { type: String, required: true, unique: true }, // e.g. "coupons", "wallet_pass", "qr_rotation"
    isEnabled: { type: Boolean, default: true },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeatureFlag", featureFlagSchema);
