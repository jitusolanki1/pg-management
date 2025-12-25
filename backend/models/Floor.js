import mongoose from "mongoose"

const floorSchema = new mongoose.Schema(
  {
    floorNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    totalRooms: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

export default mongoose.model("Floor", floorSchema)
