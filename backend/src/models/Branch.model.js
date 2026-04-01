const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Branch address is required"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    openingHours: {
      open: { type: String, default: "08:00" },
      close: { type: String, default: "22:00" },
    },
  },
  {
    timestamps: true,
  }
);

branchSchema.index({ isActive: 1 });

const Branch = mongoose.model("Branch", branchSchema);
module.exports = Branch;
