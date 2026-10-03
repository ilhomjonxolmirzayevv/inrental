import { Router } from "express";
import NFT from "../models/NFT.js";
import Rental from "../models/Rental.js";
import { sendRentalConfirmation } from "../bot/bot.js";

const router = Router();

// POST /api/rentals  { nftId, telegramUserId, days }
// Rental "pending_confirmation" holatida yaratiladi, so'ng botga tasdiqlash so'rovi ketadi.
// Pulni yechish va "active"ga o'tkazish bot.js ichidagi confirm_rental tugmasida bo'ladi.
router.post("/", async (req, res) => {
  try {
    const { nftId, telegramUserId, days } = req.body;

    if (!telegramUserId) {
      return res.status(400).json({ message: "Telegram ID kerak (saytni Telegram ichida oching yoki ID kiriting)" });
    }

    const nft = await NFT.findById(nftId);
    if (!nft) return res.status(404).json({ message: "NFT topilmadi" });

    const finalDays = nft.rentalDays ?? days;
    if (!finalDays) return res.status(400).json({ message: "Kun soni kerak" });

    const pricePerDay = nft.rentalPrice
      ? nft.rentalPrice / (nft.rentalDays || finalDays)
      : null;
    const totalPrice = nft.rentalPrice ?? pricePerDay * finalDays;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(finalDays));

    const rental = await Rental.create({
      nft: nft._id,
      telegramUserId,
      days: finalDays,
      totalPrice,
      endDate,
      status: "pending_confirmation",
    });

    await sendRentalConfirmation(rental, nft);

    res.status(201).json({
      ...rental.toObject(),
      message: "Tasdiqlash so'rovi Telegram botga yuborildi",
    });
  } catch (err) {
    console.error("Rental xatosi:", err.message);
    res.status(400).json({ message: err.message || "Ijara rasmiylashtirishda xatolik" });
  }
});

router.get("/user/:telegramUserId", async (req, res) => {
  const rentals = await Rental.find({
    telegramUserId: req.params.telegramUserId,
  })
    .populate("nft")
    .sort({ createdAt: -1 });
  res.json(rentals);
});

export default router;
