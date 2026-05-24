const mongoose = require("mongoose");

const proposedSlotSchema = new mongoose.Schema(
  {
    bookingDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    groupProgramId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupFitnessProgram",
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trainer",
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
    },
    sessionMode: {
      type: String,
      enum: ["in_person", "online", "outdoor"],
      trim: true,
    },
    sessionLocation: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "completed", "cancelled"],
      default: "requested",
    },
    paymentStatus: {
      type: String,
      enum: ["not_due", "awaiting_payment", "paid", "refunded"],
      default: "not_due",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "wallet", "apple_pay", "google_pay"],
      trim: true,
    },
    paymentReference: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    accessStartDate: {
      type: Date,
    },
    accessEndDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    attendanceStatus: {
      type: String,
      enum: ["pending", "attended", "missed", "excused"],
      default: "pending",
    },
    attendanceNote: {
      type: String,
      trim: true,
    },
    attendanceMarkedAt: {
      type: Date,
    },
    attendanceMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rescheduleStatus: {
      type: String,
      enum: ["none", "requested_by_client", "counter_proposed_by_host", "counter_proposed_by_client", "approved", "declined"],
      default: "none",
    },
    rescheduleRequestedBy: {
      type: String,
      enum: ["user", "member", "trainer", "shop", "gym_owner", "admin"],
    },
    rescheduleReason: {
      type: String,
      trim: true,
    },
    proposedBookingDate: {
      type: Date,
    },
    proposedTimeSlot: {
      type: String,
      trim: true,
    },
    proposedSlots: {
      type: [proposedSlotSchema],
      default: [],
    },
    rescheduleUpdatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, bookingDate: -1 });
bookingSchema.index({ trainerId: 1, bookingDate: -1 });
bookingSchema.index({ shopId: 1, bookingDate: -1 });
bookingSchema.index({ serviceId: 1, bookingDate: -1 });
bookingSchema.index({ groupProgramId: 1, bookingDate: -1 });

module.exports = mongoose.model("Booking", bookingSchema);