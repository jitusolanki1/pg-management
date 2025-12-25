import mongoose from "mongoose"

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["FULLY_PLAN", "HALF_PLAN"],
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
)

export default mongoose.model("Plan", planSchema)
