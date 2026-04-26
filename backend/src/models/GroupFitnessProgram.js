const mongoose = require("mongoose");

const waitlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupFitnessProgramSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupFitnessTeam",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "MVR",
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    coach: {
      type: String,
      required: true,
      trim: true,
    },
    days: {
      type: [String],
      default: [],
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalSlots: {
      type: Number,
      required: true,
      min: 1,
    },
    bookedSlots: {
      type: Number,
      default: 0,
      min: 0,
    },
    linkedServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    serviceMatchTerms: {
      type: [String],
      default: [],
    },
    waitlist: {
      type: [waitlistSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

groupFitnessProgramSchema.index({ teamId: 1, startDate: 1 });
groupFitnessProgramSchema.index({ title: 1, teamId: 1 }, { unique: true });

module.exports = mongoose.model("GroupFitnessProgram", groupFitnessProgramSchema);