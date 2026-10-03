import { Telegraf, Markup } from "telegraf";
import TelegramUser from "../models/TelegramUser.js";
import Rental from "../models/Rental.js";
import Transaction from "../models/Transaction.js";
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID; // admin/egasi chat ID'si
const WEBSITE_URL = process.env.WEBSITE_URL; // https manzil (ixtiyoriy, Web App tugmasi uchun)

export const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;

const pendingTopup = new Set();

function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4 xonali, masalan 5665
}

function websiteKeyboard() {
  if (!WEBSITE_URL) return undefined;
  return Markup.inlineKeyboard([
    [Markup.button.webApp("🌐 Saytga kirish", WEBSITE_URL)],
  ]);
}

export function initBot() {
  if (!bot) {
    console.log("TELEGRAM_BOT_TOKEN yo'q — bot ishga tushmadi");
    return;
  }

  // /start — saytga kirish uchun bir martalik kod beradi (login code)
  bot.start(async (ctx) => {
    const telegramId = String(ctx.from.id);
    const code = randomCode();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 daqiqa amal qiladi

    await TelegramUser.findOneAndUpdate(
      { telegramId },
      {
        telegramId,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        verified: true,
        loginCode: code,
        loginCodeExpires: expires,
      },
      { upsert: true }
    );

    await ctx.reply(
      `Saytga kirish kodingiz: *${code}*\n\n` +
        `Ushbu kodni saytdagi "Telegram orqali kirish" oynasiga kiriting. Kod 5 daqiqa amal qiladi.`,
      { parse_mode: "Markdown", ...(websiteKeyboard() || {}) }
    );
  });

  bot.on("text", async (ctx, next) => {
    const telegramId = String(ctx.from.id);

    if (pendingTopup.has(telegramId)) {
      const amount = parseFloat(ctx.message.text.trim());
      if (!amount || amount <= 0) {
        return ctx.reply("Iltimos, faqat musbat son yuboring");
      }
      pendingTopup.delete(telegramId);

      const user = await TelegramUser.findOne({ telegramId });
      const tx = await Transaction.create({
        telegramUserId: telegramId,
        type: "topup",
        amount,
        method: "admin_manual",
        status: "pending",
      });

      await ctx.reply("So'rovingiz adminga yuborildi. Tasdiqlangach hisobingizga qo'shiladi.");

      if (OWNER_CHAT_ID) {
        const who = user?.username ? `@${user.username}` : telegramId;
        await bot.telegram.sendMessage(
          OWNER_CHAT_ID,
          `${who} hisobini ${amount} so'mga to'ldirishni so'ramoqda.\n` +
            `Admin panelda "To'lovlar" bo'limidan tasdiqlang (ID: ${tx._id}).`
        );
      }
      return;
    }

    return next();
  });

  bot.command("topup", (ctx) => {
    pendingTopup.add(String(ctx.from.id));
    ctx.reply("Qancha summaga hisobingizni to'ldirmoqchisiz? (faqat raqam yuboring, admin tasdiqlaydi)");
  });

  bot.command("balans", async (ctx) => {
    const user = await TelegramUser.findOne({ telegramId: String(ctx.from.id) });
    ctx.reply(`Hisobingiz: ${user?.balance ?? 0} so'm`);
  });

  bot.command("kod", async (ctx) => {
    const telegramId = String(ctx.from.id);
    const code = randomCode();
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    await TelegramUser.findOneAndUpdate({ telegramId }, { loginCode: code, loginCodeExpires: expires });
    ctx.reply(`Yangi kodingiz: *${code}* (5 daqiqa amal qiladi)`, { parse_mode: "Markdown" });
  });

  // Ijarani tasdiqlash / bekor qilish
  bot.action(/confirm_rental:(.+)/, async (ctx) => {
    const rentalId = ctx.match[1];
    const rental = await Rental.findById(rentalId).populate("nft");
    if (!rental || rental.status !== "pending_confirmation") {
      return ctx.answerCbQuery("Bu so'rov endi amal qilmaydi");
    }

    const user = await TelegramUser.findOne({ telegramId: rental.telegramUserId });
    if (!user || user.balance < rental.totalPrice) {
      await ctx.answerCbQuery("Hisobingizda mablag' yetarli emas", { show_alert: true });
      return;
    }

    user.balance -= rental.totalPrice;
    await user.save();

    rental.status = "active";
    await rental.save();

    await Transaction.create({
      telegramUserId: rental.telegramUserId,
      type: "rental",
      relatedRental: rental._id,
      amount: rental.totalPrice,
      method: "card_auto",
      status: "confirmed",
    });

    await ctx.editMessageText(
      `Tasdiqlandingiz! "${rental.nft.name}" ${rental.days} kunga sizga biriktirildi.`
    );

    if (OWNER_CHAT_ID) {
      const who = user.username ? `@${user.username}` : user.firstName || rental.telegramUserId;
      await bot.telegram.sendMessage(
        OWNER_CHAT_ID,
        `${who} "${rental.nft.name}" NFT'ni ${rental.days} kunga oldi. Summasi: ${rental.totalPrice} so'm.`
      );
    }
  });

  bot.action(/cancel_rental:(.+)/, async (ctx) => {
    const rentalId = ctx.match[1];
    await Rental.findByIdAndUpdate(rentalId, { status: "cancelled" });
    await ctx.editMessageText("Ijara bekor qilindi.");
  });

  bot.launch().catch((err) => {
    console.error("Bot ishga tushmadi (server ishlashda davom etadi):", err.message);
  });
  console.log("Telegram bot ishga tushirilmoqda (polling)...");
}

// Sayt orqali ijara boshlanganda foydalanuvchiga tasdiqlash so'rovini yuboradi
export async function sendRentalConfirmation(rental, nft) {
  if (!bot) return;

  await bot.telegram.sendMessage(
    rental.telegramUserId,
    `Diqqat! Siz "${nft.name}" NFT'ni ${rental.days} kunga ijaraga olmoqchisiz.\n` +
      `Narxi: ${rental.totalPrice} so'm, hisobingizdan yechiladi.\n` +
      `Tasdiqlamasangiz, ushbu imkoniyatdan ayrilasiz.`,
    Markup.inlineKeyboard([
      Markup.button.callback("✅ Tasdiqlash", `confirm_rental:${rental._id}`),
      Markup.button.callback("❌ Bekor qilish", `cancel_rental:${rental._id}`),
    ])
  );
}

// Oylik bo'lib-to'lash eslatmasi (scheduler.js dan chaqiriladi)
export async function sendInstallmentReminder(telegramUserId, nftName, amount, monthNumber, totalMonths) {
  if (!bot) return;
  await bot.telegram.sendMessage(
    telegramUserId,
    `Eslatma: "${nftName}" uchun ${monthNumber}/${totalMonths}-oylik to'lov muddati keldi.\n` +
      `Summasi: ${amount} so'm. Iltimos, to'lovni amalga oshiring.`
  );
}
