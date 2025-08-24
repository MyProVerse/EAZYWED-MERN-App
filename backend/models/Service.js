import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Vendor ID is required"],
  },
  category: {
    type: String,
    enum: [
      "Wedding Venues",
      "Photographers",
      "Bridal Makeup",
      "Henna Artists",
      "Bridal Wear",
      "Car Rental",
    ],
    required: [true, "Service category is required"],
  },
  status: {
    type: String,
    enum: ["pending", "published", "rejected"],
    default: "pending",
  },
  name: { type: String, required: [true, "Service name is required"] },
  city: {
    type: String,
    enum: ["Lahore", "Karachi", "Islamabad"],
    required: [true, "City is required"],
  },
  photos: {
    type: [String],
    validate: {
      validator: (v) => v.length >= 1 && v.length <= 5 && new Set(v).size === v.length,
      message: "1 to 5 unique photos are required",
    },
    required: [true, "At least one photo is required"],
  },
  description: {
    type: String,
    required: [true, "Service description is required"],
  },
  additional_info: { type: String },
  pricing_packages: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      inclusions: { type: String },
    },
  ],
  location_map: { type: String },
  address: { type: String },
  discount: { type: Number },
  discount_expiry: { type: Date },
  availability: {
    working_hours: {
      type: String,
      required: [true, "Working hours are required"],
    },
    working_days: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: [true, "Working days are required"],
    },
  },
  price_range: {
    type: String,
    match: [/^\d+-\d+$/, 'Price range must be in the format "min-max" (e.g., "1000-3000")'],
    required: [true, "Price range is required"],
  },
  details: {
    cancellation_policy: {
      type: String,
      enum: ["Non-refundable", "Partially Refundable", "Fully Refundable"],
    },
    staff: { type: [String], enum: ["Male", "Female"] },
    venue_type: {
      type: String,
      enum: ["Hall", "Marquee", "Banquet", "Outdoor"],
    },
    amenities: { type: [String] },
    parking_space: { type: Number },
    catering_type: { type: String, enum: ["Internal", "External"] },
    wheelchair_accessible: { type: Boolean },
    expertise: {
      type: [String],
      enum: [
        "Weddings",
        "Birthdays",
        "Corporate",
        "Parties",
        "Engagements",
        "Modern",
        "Arabic",
        "Indian",
      ],
    },
    services_for: { type: [String], enum: ["Male", "Female"] },
    location_type: { type: String, enum: ["Salon", "Home", "Studio"] },
    home_service: { type: Boolean },
    mehndi_type: {
      type: String,
      enum: ["Organic/Natural", "Artificial", "Chemical"],
    },
    has_team: { type: Boolean },
    sells_mehndi: { type: Boolean },
    cities_covered: { type: [String] },
    material: { type: String },
    size: { type: String, enum: ["S", "M", "L", "XL"] },
    length: { type: Number },
    bust: { type: Number },
    design: { type: String },
    rental_duration: { type: [Number] },
    seats: { type: Number },
    doors: { type: Number },
    transmission: { type: String, enum: ["auto", "manual"] },
  },
}, { timestamps: true });

serviceSchema.pre("save", async function (next) {
  // Clear expired discounts
  if (this.discount_expiry && new Date(this.discount_expiry) < new Date()) {
    this.discount = 0;
    this.discount_expiry = null;
  }
  next();
});

export default mongoose.model("Service", serviceSchema);