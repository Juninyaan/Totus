const mongoose = require("mongoose");

const groupFitnessTeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    focus: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

groupFitnessTeamSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("GroupFitnessTeam", groupFitnessTeamSchema);