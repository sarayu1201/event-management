const mongoose = require("mongoose");

const ticketTemplateSchema = new mongoose.Schema(
  {
    organiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    backgroundImage: { type: String, default: "" },
    backgroundColor: { type: String, default: "#1e3c72" },
    themeColor: { type: String, default: "#ff007f" },
    logoUrl: { type: String, default: "" },
    sponsorLogoUrl: { type: String, default: "" },
    fontFamily: { type: String, default: "Arial" },
    fontSize: { type: String, default: "14px" },
    qrPosition: { type: String, default: "right" }, // left, right, center
    headerStyle: { type: String, default: "banner" },
    footerStyle: { type: String, default: "terms" },
    watermarkText: { type: String, default: "" },
    borderStyle: { type: String, default: "solid" },
    layoutType: {
      type: String,
      enum: ["Classic", "Modern", "Premium", "VIP", "Conference", "Festival", "Luxury", "Minimal"],
      default: "Classic"
    },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TicketTemplate", ticketTemplateSchema);
