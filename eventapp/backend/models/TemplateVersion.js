const mongoose = require("mongoose");

const templateVersionSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    version: { type: Number, required: true },
    elements: { type: Array, default: [] },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    changeLog: { type: String, default: "" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

// Unique version per event
templateVersionSchema.index({ event: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("TemplateVersion", templateVersionSchema);
