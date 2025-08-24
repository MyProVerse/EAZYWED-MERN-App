import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Vendor ID is required"],
  },
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  package_id: {
    type: mongoose.Schema.Types.ObjectId,
    validate: {
      validator: async function (value) {
        if (!this.service_id) return true;
        const service = await mongoose.model("Service").findById(this.service_id);
        if (!service) return false;
        return service.pricing_packages.some((pkg) => pkg._id.equals(value));
      },
      message: "Invalid package ID for the specified service",
    },
  },
  card_template_id: { type: mongoose.Schema.Types.ObjectId, ref: "CardTemplate" },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "canceled"],
    default: "pending",
  },
  date_time: {
    type: Date,
    required: [true, "Booking date and time are required"],
  },
  event_date: { type: Date, default: null },
  completed_at: { type: Date, default: null },
  price: { type: Number, required: true },
  reviewAllowed: { type: Boolean, default: false },
  quantity: { type: Number, default: 1 }, // Added for Wedding Venues
}, { timestamps: true });

bookingSchema.pre("save", async function (next) {
  // Validate service_id or card_template_id presence
  if (!this.service_id && !this.card_template_id) {
    throw new Error("Either service_id or card_template_id is required");
  }
  if (this.service_id && this.card_template_id) {
    throw new Error("Cannot book both a service and a card template in one booking");
  }
  // Prevent self-booking
  if (this.user_id.toString() === this.vendor_id.toString()) {
    throw new Error("You cannot book your own service or card");
  }
  // Check for duplicate bookings only for services
  if (this.service_id) {
    const existingBooking = await mongoose.model("Booking").findOne({
      _id: { $ne: this._id },
      user_id: this.user_id,
      service_id: this.service_id,
      date_time: this.date_time,
      status: { $in: ["pending", "confirmed"] },
    });
    if (existingBooking && this.isNew) {
      throw new Error("A booking already exists for this service at the specified time");
    }
  }
  // Set completed_at and reviewAllowed for completed status
  if (this.status === "completed" && !this.completed_at) {
    this.completed_at = new Date();
    this.reviewAllowed = true;
  }
  // Set event_date for confirmed status
  if (this.status === "confirmed" && !this.event_date) {
    this.event_date = this.date_time;
  }
  // Calculate price for service
  if (this.service_id && this.package_id && !this.price) {
    const service = await mongoose.model("Service").findById(this.service_id);
    const selectedPackage = service?.pricing_packages?.find((pkg) =>
      pkg._id.equals(this.package_id)
    );
    if (selectedPackage) this.price = selectedPackage.price * this.quantity;
  }
  // Calculate price for card
  else if (this.card_template_id && !this.price) {
    const card = await mongoose.model("CardTemplate").findById(this.card_template_id);
    if (card) this.price = card.price_per_card * this.quantity;
  }
  next();
});

export default mongoose.model("Booking", bookingSchema);