import mongoose from "mongoose";

const cardTemplateSchema = new mongoose.Schema({
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Vendor ID is required"],
  },
  status: {
    type: String,
    enum: ["pending", "published", "rejected"],
    default: "pending",
  },
  // Add after line 10 (after vendor_id field)
name: {
  type: String,
  required: [false, "Card name is required"],
  trim: true,
  minlength: [3, "Card name must be at least 3 characters"],
  maxlength: [100, "Card name cannot exceed 100 characters"],
},
  type: {
    type: String,
    enum: ["simple", "editable", "static", "non-editable"],
    required: [true, "Card type is required"],
  },
  price_per_card: {
    type: Number,
    required: [true, "Price per card is required"],
  },
  quantity_available: {
    type: Number,
    required: [true, "Quantity available is required"],
  },
  city: {
    type: String,
    enum: ["Lahore", "Karachi", "Islamabad"],
    required: [true, "City is required"],
  },
  front_image: {
    type: String,
    required: [
      function () {
        return ["static", "non-editable"].includes(this.type);
      },
      "Front image is required for static/non-editable cards",
    ],
  },
  settings: {
    type: Object,
    required: [
      function () {
        return this.type === "editable" && !this.front_image;
      },
      "Settings are required for editable cards without a front image",
    ],
  },
  format: {
    type: [String],
    required: [true, "Format is required"],
  },
  design_time: {
    type: String,
    required: [true, "Design time is required"],
  },
  description: { type: String },
  gallery: { type: [String], default: [] },
  dimensions: { type: String },
  avg_rating: { type: Number, default: 0 },
  review_count: { type: Number, default: 0 },
  discount: { type: Number },
  discount_expiry: { type: Date },
}, { timestamps: true });

cardTemplateSchema.pre("save", async function (next) {
  // Clear expired discounts
  if (this.discount_expiry && new Date(this.discount_expiry) < new Date()) {
    this.discount = 0;
    this.discount_expiry = null;
  }
  next();
});

export default mongoose.model("CardTemplate", cardTemplateSchema);