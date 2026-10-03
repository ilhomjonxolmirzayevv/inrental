import mongoose from "mongoose";

const nftSchema = new mongoose.Schema(
  {
    sourceUrl: { type: String, required: true }, // t.me/nft/<Slug>-<number>
    slug: { type: String, required: true },
    tokenNumber: { type: String },
    name: { type: String, required: true },
    imageUrl: { type: String },
    model: { type: String },      // model trait (animatsiya uchun)
    backdrop: { type: String },   // fon
    symbol: { type: String },     // pattern/symbol
    tokenId: { type: String },
    accent: { type: String, default: "#58b4c8" },
    description: { type: String },

    // Admin ixtiyoriy narxlash. Bo'sh bo'lsa - foydalanuvchi kun sonini o'zi tanlaydi
    rentalDays: { type: Number, default: null },
    rentalPrice: { type: Number, default: null },

    // sotib olish (bo'lib to'lash) narxi
    buyPrice: { type: Number, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("NFT", nftSchema);
