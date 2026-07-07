const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true },
    images: [{ type: String }],
    organiserReply: { type: String, default: "" },
    organiserReplyDate: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
