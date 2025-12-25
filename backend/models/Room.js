import mongoose from "mongoose"

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
    },
    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
    },
    roomType: {
      type: String,
      enum: ["AC", "NON_AC"],
      required: true,
    },
    totalBeds: {
      type: Number,
      required: true,
      min: 1,
    },
    occupiedBeds: {
      type: Number,
      default: 0,
    },
    gridPosition: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
)

export default mongoose.model("Room", roomSchema)
