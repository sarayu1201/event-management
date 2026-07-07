const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, required: true, enum: ["open", "in-progress", "resolved", "closed"], default: "open" },
    category: { type: String, required: true, enum: ["general", "payment", "booking", "other"], default: "general" },
    responses: [
      {
        sender: { type: String, required: true }, // "user", "agent", "organiser"
        senderName: { type: String, required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
