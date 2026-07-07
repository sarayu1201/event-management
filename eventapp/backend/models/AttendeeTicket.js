const mongoose = require("mongoose");

const attendeeTicketSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    ticketId: { type: String, required: true, unique: true },
    qrCodeToken: { type: String, required: true, unique: true },
    ticketTypeName: { type: String, required: true },
    attendeeName: { type: String, required: true },
    attendeeEmail: { type: String, default: "" },
    attendeePhone: { type: String, default: "" },
    customResponses: { type: Map, of: String, default: {} }, // Answers from Form Builder
    assignedSeat: { type: String, default: "" },
    status: {
      type: String,
      enum: ["generated", "downloaded", "shared", "checked-in", "checked-out", "refunded", "cancelled", "transferred", "expired", "archived"],
      default: "generated"
    },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    gate: { type: String, default: "" },
    badgeUrl: { type: String, default: "" },
    walletPassUrl: { type: String, default: "" },
    auditHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: String,
        reason: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("AttendeeTicket", attendeeTicketSchema);
