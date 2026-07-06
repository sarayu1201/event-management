const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Movies", "Concerts", "Plays", "Sports", "Comedy", "Workshops", "Festivals", "Other"],
    },
    bannerImage: { type: String, default: "" },
    venue: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, default: "" },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g. "19:30"
    price: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
    organiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    promoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["approved", "pending", "cancelled"],
      default: "approved",
    },
  },
  { timestamps: true }
);

eventSchema.index({ title: "text", city: "text", venue: "text" });

module.exports = mongoose.model("Event", eventSchema);
