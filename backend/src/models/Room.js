const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Room name must be at least 2 characters"],
      maxlength: [30, "Room name cannot exceed 30 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [150, "Description cannot exceed 150 characters"],
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Tracks users who have ever joined this room
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    // Virtual field: member count
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: message count (requires Message model)
roomSchema.virtual("messageCount", {
  ref: "Message",
  localField: "_id",
  foreignField: "room",
  count: true,
});

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
