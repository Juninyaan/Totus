const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "booking_requested",
        "booking_accepted",
        "booking_cancelled",
        "booking_completed",
        "booking_upcoming",
        "attendance_marked",
        "reschedule_requested",
        "reschedule_countered",
        "reschedule_approved",
        "reschedule_declined",
        "payment_due",
        "payment_received",
        "subscription_active",
        "subscription_expiring",
        "subscription_expired",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ subscriptionId: 1, type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);