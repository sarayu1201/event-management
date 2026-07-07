const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    seats: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    promoCodeUsed: { type: String, default: null, uppercase: true },
    promoter: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "card" },
    transactionId: { type: String, default: null },
    bookingStatus: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    ticketTypeName: { type: String, default: "General Admission" },
    checkedIn: { type: Boolean, default: false },
    checkInTime: { type: Date, default: null },
    // Ticket GST tax fields
    gstRate: { type: Number, default: 0 }, // GST percent (e.g. 18)
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    hsnCode: { type: String, default: "9996" },
    // Exit/Re-entry tracking
    checkOutTime: { type: Date, default: null },
    checkInHistory: [
      {
        gate: String,
        entryType: { type: String, enum: ["entry", "exit"], default: "entry" },
        timestamp: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
