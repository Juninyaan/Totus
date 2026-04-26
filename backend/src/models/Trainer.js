const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const trainerPortfolioSchema = new mongoose.Schema(
  {
    headline: { type: String, trim: true },
    coachingStyle: { type: String, trim: true },
    certifications: {
      type: [String],
      default: [],
    },
    achievements: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const trainerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialties: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    bio: {
      type: String,
      trim: true,
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
    portfolio: {
      type: trainerPortfolioSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

trainerSchema.index({ specialties: 1 });

module.exports = mongoose.model("Trainer", trainerSchema);