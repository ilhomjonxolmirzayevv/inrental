import { Router } from "express";
import Transaction from "../models/Transaction.js";
import TelegramUser from "../models/TelegramUser.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Foydalanuvchi uchun: umumiy hisob + harajatlar tarixi
router.get("/user/:telegramUserId", async (req, res) => {
  const history = await Transaction.find({
    telegramUserId: req.params.telegramUserId,
  }).sort({ createdAt: -1 });

  const total = history
    .filter((t) => t.status !== "rejected")
    .reduce((sum, t) => sum + t.amount, 0);

  res.json({ total, history });
});

// Admin analitika: umumiy tushum, so'nggi tranzaksiyalar, kunlik statistika
router.get("/admin/summary", requireAdmin, async (req, res) => {
  const all = await Transaction.find({ status: "confirmed" });
  const totalRevenue = all.reduce((sum, t) => sum + t.amount, 0);

  const byType = all.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + t.amount;
    return acc;
  }, {});

  const recent = await Transaction.find().sort({ createdAt: -1 }).limit(20);

  res.json({ totalRevenue, byType, recent });
});

// Admin: pending to'lovni tasdiqlash/rad etish
router.post("/admin/transactions/:id/confirm", requireAdmin, async (req, res) => {
  const tx = await Transaction.findByIdAndUpdate(
    req.params.id,
    { status: "confirmed" },
    { new: true }
  );

  // Hisob to'ldirish tasdiqlansa, foydalanuvchi balansiga qo'shamiz
  if (tx && tx.type === "topup") {
    await TelegramUser.findOneAndUpdate(
      { telegramId: tx.telegramUserId },
      { $inc: { balance: tx.amount } },
      { upsert: true }
    );
  }

  res.json(tx);
});

// Admin: tasdiqlanishi kutilayotgan tranzaksiyalar (topup so'rovlari va h.k.)
router.get("/admin/pending", requireAdmin, async (req, res) => {
  const pending = await Transaction.find({ status: "pending" }).sort({ createdAt: -1 });
  res.json(pending);
});

router.post("/admin/transactions/:id/reject", requireAdmin, async (req, res) => {
  const tx = await Transaction.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );
  res.json(tx);
});

export default router;
