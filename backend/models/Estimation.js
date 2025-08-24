import mongoose from "mongoose";

const estimationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  services: [
    {
      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true,
      },
      packageId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        validate: {
          validator: async function (value) {
            const service = await mongoose.model("Service").findById(this.serviceId);
            return (
              service && service.pricing_packages.some((pkg) => pkg._id.equals(value))
            );
          },
          message: "Invalid package ID for the specified service",
        },
      },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  cards: [
    {
      cardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CardTemplate",
        required: true,
      },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  totalCost: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active",
  },
}, { timestamps: true });

estimationSchema.pre("save", async function (next) {
  let calculatedCost = 0;
  // Merge services with existing estimation
  for (const serviceItem of this.services) {
    const service = await mongoose.model("Service").findById(serviceItem.serviceId);
    if (!service) throw new Error(`Service with ID ${serviceItem.serviceId} not found`);
    const selectedPackage = service.pricing_packages.find((pkg) =>
      pkg._id.equals(serviceItem.packageId)
    );
    if (!selectedPackage) {
      throw new Error(`Package with ID ${serviceItem.packageId} not found`);
    }
    calculatedCost += selectedPackage.price * serviceItem.quantity;
  }
  // Merge cards with existing estimation
  for (const cardItem of this.cards) {
    const card = await mongoose.model("CardTemplate").findById(cardItem.cardId);
    if (!card) throw new Error(`Card with ID ${cardItem.cardId} not found`);
    calculatedCost += card.price_per_card * cardItem.quantity;
  }
  this.totalCost = calculatedCost;
  next();
});

export default mongoose.model("Estimation", estimationSchema);