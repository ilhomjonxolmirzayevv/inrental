import { Router } from "express";
import { readTelegramNft } from "../utils/telegramImporter.js";

const router = Router();

// POST /api/telegram/nft-preview  { url: "https://t.me/nft/JackInTheBox-14463" }
router.post("/nft-preview", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: "url kerak" });

    const preview = await readTelegramNft(url);
    res.json(preview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
