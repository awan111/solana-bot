export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const txs = req.body;
    if (!Array.isArray(txs) || txs.length === 0) {
      return res.status(200).json({ success: true, message: "No transactions found" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    for (const tx of txs) {
      const description = tx.description || "New transaction detected!";
      const type = tx.type || "TRANSACTION";
      const signature = tx.signature || "";

      let message = `🚨 *New Pump.fun / Solana Alert!*\n\n`;
      message += `📌 *Type:* ${type}\n`;
      message += `📝 *Details:* ${description}\n`;
      if (signature) {
        message += `🔗 [View on Solscan](https://solscan.io/tx/${signature})`;
      }

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown"
        }),
      });
    }

    return res.status(200).json({ success: true, message: "Sent to Telegram" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
