const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    organiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    accountHolderName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    upiId: { type: String, default: "" },
    transactionId: { type: String, default: null },
    adminNotes: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payout", payoutSchema);
