import mongoose from "mongoose";

// Umumiy hisob va harajatlar tarixi uchun yagona to'lov jurnali
const transactionSchema = new mongoose.Schema(
  {
    telegramUserId: { type: String, required: true },
    type: {
      type: String,
      enum: ["rental", "installment", "purchase", "topup"],
      required: true,
    },
    relatedRental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental" },
    relatedPurchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["card_auto", "admin_manual"],
      default: "admin_manual",
    },
    cardUsed: { type: String }, // admin belgilagan karta raqami (masked)
    screenshotUrl: { type: String }, // to'lov screenshoti (ixtiyoriy)
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
