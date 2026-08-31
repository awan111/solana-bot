export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const update = req.body;
    const message = update.message;

    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const botToken = "8689687590:AAHSzJ_36tERZZzo4LhSMIavF30lUZI18wE";

    let replyText = "";

    if (text === "/start" || text === "/help") {
      replyText = "🤖 LethalOrca ($LORCA) Bot Active!\n\nAvailable commands:\n/contract - Get official token contract\n/roadmap - View project phases\n/socials - Official links";
    } else if (text === "/contract") {
      replyText = "Contract: `7RqpgT532tsYakbgnTXECC4MHTEGu5HzBxVAkAAHpump` (Solana)";
    } else if (text === "/roadmap") {
      replyText = "🗺️ **LethalOrca Roadmap:**\n• Phase 1: Game Launch\n• Phase 2: Wallet Integration\n• Phase 3: Marketplace\n• Phase 4: Token Utility";
    } else if (text === "/socials") {
      replyText = "🌐 Official Website: https://lethalorca.com/";
    } else {
      replyText = "Unknown command. Use /start to see available commands.";
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: "Markdown"
      }),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
