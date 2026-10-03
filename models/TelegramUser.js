import mongoose from "mongoose";

// Botdan tasdiqlangan / kod orqali saytga kirgan foydalanuvchilar
const telegramUserSchema = new mongoose.Schema(
  {
    telegramId: { type: String, required: true, unique: true },
    username: { type: String },
    firstName: { type: String },
    verified: { type: Boolean, default: false },
    balance: { type: Number, default: 0 }, // umumiy hisob

    // Saytga kirish uchun bot bergan vaqtinchalik kod (masalan 5665)
    loginCode: { type: String },
    loginCodeExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("TelegramUser", telegramUserSchema);
