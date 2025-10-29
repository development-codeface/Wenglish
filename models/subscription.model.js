import mongoose from "mongoose";

const multilingualField = {
  en: { type: String, required: true },
  hi: { type: String },
  ta: { type: String },
  te: { type: String },
  kn: { type: String },
  ml: { type: String },
};

const subscriptionSchema = new mongoose.Schema(
  {
    title: multilingualField,
    description: multilingualField,
    image: { type: String },
    price: { type: Number, required: true },

    duration: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      required: true,
    },
    days: { type: Number, required: true },

    isActive: { type: Boolean, default: true },
    discount: { type: mongoose.Schema.Types.ObjectId, ref: "Discount" },
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
