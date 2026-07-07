const mongoose = require("mongoose");

const customFormSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, unique: true },
    fields: [
      {
        label: { type: String, required: true },
        fieldType: {
          type: String,
          enum: ["text", "textarea", "number", "email", "phone", "dropdown", "checkbox", "radio", "date", "file"],
          default: "text"
        },
        required: { type: Boolean, default: false },
        options: [{ type: String }], // for dropdown, checkbox group, radio
        conditionalField: { type: String, default: "" }, // logic checks
        conditionalValue: { type: String, default: "" }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomForm", customFormSchema);
