const mongoose = require("mongoose");

const checkInLogSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    ticketId: { type: String, required: true },
    scanner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gate: { type: String, default: "Gate 1" },
    entryType: { type: String, enum: ["entry", "exit"], default: "entry" },
    timestamp: { type: Date, default: Date.now },
    device: { type: String, default: "Mobile Scanner" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CheckInLog", checkInLogSchema);
