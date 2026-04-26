const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
  },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const deliveryOptionSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["in_person", "online", "outdoor"],
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    audience: {
      type: String,
      enum: ["all", "ladies"],
      default: "all",
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
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    location: locationSchema,
    schedule: {
      type: [scheduleSchema],
      default: [],
    },
    deliveryOptions: {
      type: [deliveryOptionSchema],
      default: [],
    },
    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1, type: 1, isActive: 1 });
serviceSchema.index({ trainerId: 1 });
serviceSchema.index({ shopId: 1 });

module.exports = mongoose.model("Service", serviceSchema);