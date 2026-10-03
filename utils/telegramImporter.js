function extractMeta(html, property) {
  const regex = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const match = html.match(regex);
  return match ? match[1] : "";
}

function extractTelegramAttribute(description, label) {
  if (!description) return "";
  const regex = new RegExp(`${label}\\s*[:：]\\s*([^,\\n·]+)`, "i");
  const match = description.match(regex);
  return match ? match[1].trim() : "";
}

// Public t.me/nft/<Slug>-<number> sahifasidan NFT ma'lumotlarini o'qiydi
export async function readTelegramNft(url) {
  const parsedUrl = new URL(url);

  if (
    parsedUrl.hostname !== "t.me" &&
    parsedUrl.hostname !== "www.t.me" &&
    parsedUrl.hostname !== "telegram.me"
  ) {
    throw new Error("Faqat public t.me/nft/... link yuboring");
  }

  if (!parsedUrl.pathname.startsWith("/nft/")) {
    throw new Error("Bu Telegram NFT link emas");
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: { "user-agent": "NFT-Ijara-Telegram-Importer/1.0" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error("Telegram sahifasi ochilmadi");
  }

  const html = await response.text();

  const title = extractMeta(html, "og:title");
  const imageUrl = extractMeta(html, "og:image");
  const description = extractMeta(html, "og:description");

  const model = extractTelegramAttribute(description, "Model");
  const backdrop = extractTelegramAttribute(description, "Backdrop");
  const symbol = extractTelegramAttribute(description, "Symbol");

  const titleMatch = title.match(/^(.*?)(?:\s+#(\d+))?$/);
  const name = titleMatch?.[1] ?? "Telegram Collectible";
  const tokenId = titleMatch?.[2] ? `#${titleMatch[2]}` : "";

  // slug-number ni URL path'dan ajratib olamiz: /nft/JackInTheBox-14463
  const pathParts = parsedUrl.pathname.replace("/nft/", "").split("-");
  const tokenNumber = pathParts.pop();
  const slug = pathParts.join("-");

  return {
    sourceUrl: parsedUrl.toString(),
    slug,
    tokenNumber,
    name,
    imageUrl,
    model,
    backdrop,
    symbol,
    tokenId,
    accent: "#58b4c8",
    description: `Telegram collectible ${tokenId} · Model: ${model} · Backdrop: ${backdrop} · Symbol: ${symbol}`,
  };
}
