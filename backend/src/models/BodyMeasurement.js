const mongoose = require("mongoose");

const bodyMeasurementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    measuredAt: {
      type: String,
      required: true,
      trim: true,
    },
    weightKg: {
      type: Number,
      min: 0,
    },
    bodyFatPercent: {
      type: Number,
      min: 0,
    },
    chestCm: {
      type: Number,
      min: 0,
    },
    waistCm: {
      type: Number,
      min: 0,
    },
    hipsCm: {
      type: Number,
      min: 0,
    },
    thighCm: {
      type: Number,
      min: 0,
    },
    armCm: {
      type: Number,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

bodyMeasurementSchema.index({ userId: 1, measuredAt: -1 }, { unique: true });

module.exports = mongoose.model("BodyMeasurement", bodyMeasurementSchema);