import cron from "node-cron";
import Purchase from "../models/Purchase.js";
import { sendInstallmentReminder } from "./bot.js";

// Har kuni ertalab 09:00 da, to'lov sanasi kelgan bo'lib-to'lashlarga eslatma yuboradi
export function startReminderScheduler() {
  cron.schedule("0 9 * * *", async () => {
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // shu kungacha bo'lganlarni ham qamrab olamiz

      const due = await Purchase.find({
        status: "active",
        nextPaymentDate: { $lte: today },
      }).populate("nft");

      for (const purchase of due) {
        await sendInstallmentReminder(
          purchase.telegramUserId,
          purchase.nft?.name || "NFT",
          purchase.monthlyAmount,
          purchase.paidMonths + 1,
          purchase.months
        );
      }

      if (due.length) {
        console.log(`${due.length} ta bo'lib-to'lash uchun eslatma yuborildi`);
      }
    } catch (err) {
      console.error("Eslatma yuborishda xatolik:", err.message);
    }
  });

  console.log("Oylik to'lov eslatma jadvali ishga tushdi (har kuni 09:00)");
}
