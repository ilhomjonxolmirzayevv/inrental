import { Router } from "express";
import TelegramUser from "../models/TelegramUser.js";

const router = Router();

// POST /api/telegram-auth/verify  { code }
// Foydalanuvchi botdan olgan kodni saytga kiritganda chaqiriladi
router.post("/verify", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Kod kiriting" });

    const user = await TelegramUser.findOne({ loginCode: String(code) });
    if (!user) {
      return res.status(400).json({ message: "Kod noto'g'ri yoki eskirgan" });
    }
    if (!user.loginCodeExpires || user.loginCodeExpires < new Date()) {
      return res.status(400).json({ message: "Kod muddati tugagan, botdan /kod bilan yangisini oling" });
    }

    user.loginCode = null;
    user.loginCodeExpires = null;
    await user.save();

    res.json({
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      balance: user.balance,
    });
  } catch (err) {
    res.status(400).json({ message: err.message || "Kirishda xatolik" });
  }
});

export default router;
