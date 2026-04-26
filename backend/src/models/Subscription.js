const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    kind: {
      type: String,
      enum: ["day_entry", "membership", "event_access"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_payment", "active", "expired", "cancelled"],
      default: "pending_payment",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    activatedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, endDate: 1 });
subscriptionSchema.index({ shopId: 1, status: 1, endDate: 1 });
subscriptionSchema.index({ bookingId: 1 }, { unique: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);