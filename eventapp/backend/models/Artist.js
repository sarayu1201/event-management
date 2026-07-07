const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema(
  {
    organiser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    stageName: { type: String, default: "" },
    photo: { type: String, default: "" },
    bio: { type: String, default: "" },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" }
    },
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Artist", artistSchema);
