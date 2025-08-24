import mongoose from "mongoose"

// Recommendation Schema (unchanged)
const recommendationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: [true, "Service ID is required"] },
    type: { type: String, enum: ["recent", "popular"], required: [true, "Recommendation type is required"] },
  },
  { timestamps: true },
)

export default mongoose.model("Recommendation", recommendationSchema)

