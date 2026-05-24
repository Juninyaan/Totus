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

const nextClassSchema = new mongoose.Schema(
  {
    classDate: { type: Date },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    bringNote: { type: String, trim: true },
  },
  { _id: false }
);

const eventDaySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    eventDate: { type: Date },
    note: { type: String, trim: true },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["attended", "missed", "excused"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const intentionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classDate: {
      type: Date,
      required: true,
    },
    intendsToAttend: {
      type: Boolean,
      required: true,
    },
    updatedAt: {
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
    assignedTrainerIds: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trainer",
      }],
      default: [],
    },
    memberIds: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      default: [],
    },
    nextClass: {
      type: nextClassSchema,
      default: () => ({}),
    },
    eventDay: {
      type: eventDaySchema,
      default: () => ({}),
    },
    attendance: {
      type: [attendanceSchema],
      default: [],
    },
    intentions: {
      type: [intentionSchema],
      default: [],
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