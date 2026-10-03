import mongoose from "mongoose";

const rentalSchema = new mongoose.Schema(
  {
    nft: { type: mongoose.Schema.Types.ObjectId, ref: "NFT", required: true },
    telegramUserId: { type: String, required: true },
    days: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending_confirmation", "active", "completed", "cancelled"],
      default: "pending_confirmation",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Rental", rentalSchema);
