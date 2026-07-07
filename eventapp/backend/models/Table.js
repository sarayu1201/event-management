const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    tableName: { type: String, required: true }, // e.g. "VIP-1", "Table A1"
    tableNumber: { type: Number, required: true },
    category: {
      type: String,
      enum: ["Standard Table", "Premium Table", "VIP Table", "VVIP Table", "Lounge Table", "Couple Table", "Corporate Table", "Party Table"],
      default: "VIP Table"
    },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    location: { type: String, default: "Indoor" }, // e.g. "Indoor", "Outdoor", "Rooftop"
    shape: { type: String, enum: ["round", "rectangle", "square"], default: "round" },
    capacity: { type: Number, default: 4 },
    minPersons: { type: Number, default: 1 },
    maxPersons: { type: Number, default: 6 },
    price: { type: Number, required: true },
    discountType: { type: String, enum: ["Percentage", "Fixed Amount", "none"], default: "none" },
    discountValue: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 18 },
    services: [
      {
        name: { type: String, required: true },
        price: { type: Number, default: 0 },
        description: { type: String, default: "" }
      }
    ],
    positionX: { type: Number, default: 50 },
    positionY: { type: Number, default: 50 },
    width: { type: Number, default: 60 },
    height: { type: Number, default: 60 },
    rotation: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Available", "Reserved", "Booked", "Blocked", "Maintenance"],
      default: "Available"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
