const mongoose = require("mongoose");

const conflictLogSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    ticketId: { type: String, required: true },
    scanner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    errorType: { type: String, default: "DUPLICATE_OFFLINE_SCAN" },
    details: { type: String, default: "" },
    resolved: { type: Boolean, default: false },
    resolutionNotes: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ConflictLog", conflictLogSchema);
