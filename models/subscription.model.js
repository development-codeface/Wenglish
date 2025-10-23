import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    discount: { type: Number, default: 0 },
    price: { type: Number, required: true },

    duration: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      required: true,
    },
    days: { type: Number, required: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subscriptionSchema.pre("validate", function (next) {
  const durationToDays = {
    weekly: 7,
    monthly: 30,
    yearly: 365,
  };
  this.days = durationToDays[this.duration] || 0;
  next();
});

export default mongoose.model("Subscription", subscriptionSchema);
