import mongoose from "mongoose"

// BlockedUsers Schema (unchanged)
const blockedUsersSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^\+923[0-4][0-9]{8}$/, "Phone must be a valid Pakistani number starting with +923"],
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, required: [true, "Reason for blocking is required"] },
  },
  { timestamps: true },
)

export default mongoose.model("BlockedUsers", blockedUsersSchema)

