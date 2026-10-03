import mongoose from "mongoose";

// Bo'lib to'lash (installment) orqali sovg'a sotib olish — 3, 6 yoki 12 oylik
const purchaseSchema = new mongoose.Schema(
  {
    nft: { type: mongoose.Schema.Types.ObjectId, ref: "NFT", required: true },
    telegramUserId: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    months: { type: Number, enum: [3, 6, 12], required: true },
    monthlyAmount: { type: Number, required: true },
    paidMonths: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    nextPaymentDate: { type: Date, required: true }, // har oy shu sanada eslatma boradi
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
