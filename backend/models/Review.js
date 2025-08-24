import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    card_template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CardTemplate",
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking ID is required"],
    },
    stars: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

reviewSchema.pre("save", async function (next) {
  // Ensure either service_id or card_template_id is present
  if (!this.service_id && !this.card_template_id) {
    throw new Error("Either service_id or card_template_id is required");
  }
  if (this.service_id && this.card_template_id) {
    throw new Error("Cannot review both a service and a card template");
  }

  // Prevent vendors from reviewing their own services or cards
  if (this.service_id) {
    const service = await mongoose.model("Service").findById(this.service_id);
    if (service && service.vendor_id.toString() === this.user_id.toString()) {
      throw new Error("Vendors cannot review their own services");
    }
  } else if (this.card_template_id) {
    const card = await mongoose.model("CardTemplate").findById(this.card_template_id);
    if (card && card.vendor_id.toString() === this.user_id.toString()) {
      throw new Error("Vendors cannot review their own card templates");
    }
  }

  next();
});

export default mongoose.model("Review", reviewSchema);