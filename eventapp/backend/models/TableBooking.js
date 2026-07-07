const mongoose = require("mongoose");

const tableBookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    numberOfGuests: { type: Number, required: true },
    selectedServices: [
      {
        name: { type: String },
        price: { type: Number }
      }
    ],
    totalAmount: { type: Number, required: true },
    depositPaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    qrCode: { type: String, default: "" },
    checkInStatus: {
      type: String,
      enum: ["not-checked-in", "partially-checked-in", "checked-in"],
      default: "not-checked-in"
    },
    bookingStatus: {
      type: String,
      enum: ["confirmed", "cancelled", "upgraded"],
      default: "confirmed"
    },
    notes: { type: String, default: "" },
    auditHistory: [
      {
        status: { type: String },
        updatedBy: { type: String },
        reason: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("TableBooking", tableBookingSchema);
