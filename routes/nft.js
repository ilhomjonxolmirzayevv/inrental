import { Router } from "express";
import NFT from "../models/NFT.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Ommaga ochiq: aktiv NFT'lar ro'yxati (do'kon uchun)
router.get("/", async (req, res) => {
  const nfts = await NFT.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(nfts);
});

router.get("/:id", async (req, res) => {
  const nft = await NFT.findById(req.params.id);
  if (!nft) return res.status(404).json({ message: "NFT topilmadi" });
  res.json(nft);
});

// Faqat admin: yangi NFT qo'shish (telegram-preview'dan olingan ma'lumot + narx/kun)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const nft = await NFT.create(req.body);
    res.status(201).json(nft);
  } catch (err) {
    console.error("NFT yaratishda xatolik:", err.message);
    res.status(400).json({ message: err.message || "NFT saqlashda xatolik" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const nft = await NFT.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!nft) return res.status(404).json({ message: "NFT topilmadi" });
    res.json(nft);
  } catch (err) {
    console.error("NFT yangilashda xatolik:", err.message);
    res.status(400).json({ message: err.message || "NFT yangilashda xatolik" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await NFT.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: "O'chirildi" });
});

export default router;
