const mongoose = require("mongoose");

const seatLockSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    seatId: { type: String, required: true }, // e.g. "Platinum-A5"
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lockedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// Create compound index for easy check seat lock state
seatLockSchema.index({ event: 1, seatId: 1 }, { unique: true });

module.exports = mongoose.model("SeatLock", seatLockSchema);
