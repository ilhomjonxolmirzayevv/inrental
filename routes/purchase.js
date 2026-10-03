import { Router } from "express";
import NFT from "../models/NFT.js";
import Purchase from "../models/Purchase.js";
import Transaction from "../models/Transaction.js";

const router = Router();

const ALLOWED_MONTHS = [3, 6, 12];

// POST /api/purchases  { nftId, telegramUserId, months }  months: 3 | 6 | 12
router.post("/", async (req, res) => {
  try {
    const { nftId, telegramUserId, months } = req.body;

    if (!telegramUserId) {
      return res.status(400).json({ message: "Avval Telegram orqali kiring" });
    }
    if (!ALLOWED_MONTHS.includes(Number(months))) {
      return res.status(400).json({ message: "Muddat 3, 6 yoki 12 oy bo'lishi kerak" });
    }

    const nft = await NFT.findById(nftId);
    if (!nft || !nft.buyPrice) {
      return res.status(404).json({ message: "NFT yoki narxi topilmadi" });
    }

    const monthlyAmount = +(nft.buyPrice / months).toFixed(2);

    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const purchase = await Purchase.create({
      nft: nft._id,
      telegramUserId,
      totalPrice: nft.buyPrice,
      months,
      monthlyAmount,
      nextPaymentDate,
    });

    res.status(201).json(purchase);
  } catch (err) {
    console.error("Purchase xatosi:", err.message);
    res.status(400).json({ message: err.message || "Sotib olishda xatolik" });
  }
});

// Bitta oylik to'lovni qayd etish (foydalanuvchi to'lov qilgach, admin yoki auto tasdiqlaydi)
router.post("/:id/pay", async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: "Topilmadi" });

    purchase.paidMonths += 1;

    if (purchase.paidMonths >= purchase.months) {
      purchase.status = "completed";
    } else {
      const next = new Date(purchase.nextPaymentDate);
      next.setMonth(next.getMonth() + 1);
      purchase.nextPaymentDate = next;
    }
    await purchase.save();

    await Transaction.create({
      telegramUserId: purchase.telegramUserId,
      type: "installment",
      relatedPurchase: purchase._id,
      amount: purchase.monthlyAmount,
      method: req.body.cardUsed ? "card_auto" : "admin_manual",
      cardUsed: req.body.cardUsed,
      screenshotUrl: req.body.screenshotUrl,
    });

    res.json(purchase);
  } catch (err) {
    res.status(400).json({ message: err.message || "To'lovda xatolik" });
  }
});

router.get("/user/:telegramUserId", async (req, res) => {
  const purchases = await Purchase.find({
    telegramUserId: req.params.telegramUserId,
  })
    .populate("nft")
    .sort({ createdAt: -1 });
  res.json(purchases);
});

export default router;
