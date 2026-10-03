import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import telegramRoutes from "./routes/telegram.js";
import nftRoutes from "./routes/nft.js";
import rentalRoutes from "./routes/rental.js";
import purchaseRoutes from "./routes/purchase.js";
import accountRoutes from "./routes/account.js";
import telegramAuthRoutes from "./routes/telegramAuth.js";
import { initBot } from "./bot/bot.js";
import { startReminderScheduler } from "./bot/scheduler.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/nfts", nftRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/telegram-auth", telegramAuthRoutes);

app.get("/api/config", (req, res) => {
  res.json({
    adminContactUrl: process.env.ADMIN_CONTACT_URL || "",
    botUsername: process.env.TELEGRAM_BOT_USERNAME || "",
  });
});

// Kutilmagan xatolar uchun umumiy tutqich — server yiqilmasdan, xato xabari qaytadi
app.use((err, req, res, next) => {
  console.error("Server xatosi:", err);
  res.status(500).json({ message: err.message || "Server xatosi" });
});


// Har ehtimolga qarshi: qayerdadir kutilmagan Promise xatosi chiqsa ham server o'chib qolmasin
process.on("unhandledRejection", (err) => {
  console.error("Ushlanmagan promise xatosi:", err);
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server ${PORT}-portda ishga tushdi`));
    try {
      initBot();
      startReminderScheduler();
    } catch (err) {
      console.error("Bot ishga tushirishda xatolik (server ishlashda davom etadi):", err.message);
    }
  })
  .catch((err) => {
    console.error("MongoDB ulanishida xatolik:", err.message);
    process.exit(1);
  });
