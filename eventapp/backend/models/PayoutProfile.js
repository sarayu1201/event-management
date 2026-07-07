const mongoose = require("mongoose");

const payoutProfileSchema = new mongoose.Schema(
  {
    organiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, required: true }, // e.g. "Company Account", "Personal UPI"
    accountHolderName: { type: String, required: true },
    bankName: { type: String, default: "" },
    branchName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    upiId: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },
    rejectedReason: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PayoutProfile", payoutProfileSchema);
