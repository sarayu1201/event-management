const mongoose = require("mongoose");

const queueJobSchema = new mongoose.Schema(
  {
    jobType: {
      type: String,
      enum: ["ticket_generation", "qr_rotate", "pdf_render", "email_notification", "seat_cleanup"],
      required: true
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    attempts: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    errorMessage: { type: String, default: "" },
    runAfter: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("QueueJob", queueJobSchema);
