const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    websiteLink: {
      type: String,
      trim: true,
    },
    peakHoursBusy: {
      type: String,
      trim: true,
    },
    peakHoursQuiet: {
      type: String,
      trim: true,
    },
    peakHoursNotes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

shopSchema.index({ shopName: 1 });
shopSchema.index({ categories: 1 });

module.exports = mongoose.model("Shop", shopSchema);