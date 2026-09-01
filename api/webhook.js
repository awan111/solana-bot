export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // 1. TELEGRAM BOT COMMANDS HANDLER
    if (body && body.message) {
      const msgChatId = body.message.chat.id;
      const text = body.message.text ? body.message.text.trim() : "";
      const tokenMint = "7RqpgT532tsYakbgnTXECC4MHTEGu5HzBxVAkAAHpump";

      let replyText = `🤖 *LethalOrca ($LORCA) Bot Active!*\nUse /price to check live stats.`;

      if (text.startsWith("/price")) {
        const pumpFunUrl = `https://pump.fun/coin/${tokenMint}`;
        replyText = `📊 *$LORCA* is live on pump.fun!\n🔗 [View on Pump.fun](${pumpFunUrl})`;
      }

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: msgChatId,
          text: replyText,
          parse_mode: "Markdown",
          disable_web_page_preview: true
        }),
      });

      return res.status(200).json({ success: true, message: "Telegram command handled" });
    }

    // 2. HELIUS WEBHOOK TRANSACTIONS (Supports both single object & array)
    const txs = Array.isArray(body) ? body : (body ? [body] : []);
    if (txs.length === 0) {
      return res.status(200).json({ success: true, message: "No transactions found" });
    }

    for (const tx of txs) {
      const description = tx.description || "New transaction detected!";
      const type = tx.type || "TRANSACTION";
      const signature = tx.signature || "";

      let solAmount = 0;
      if (tx.nativeTransfers && Array.isArray(tx.nativeTransfers)) {
        for (const nt of tx.nativeTransfers) {
          const sol = nt.amount / 1e9;
          if (sol > solAmount) solAmount = sol;
        }
      }

      const match = description.match(/([\d.]+)\s*SOL/i);
      if (match && match[1]) {
        const parsedSol = parseFloat(match[1]);
        if (parsedSol > solAmount) solAmount = parsedSol;
      }

      const isWhale = solAmount >= 1;

      let message = isWhale 
        ? `🐋 *WHALE ALERT! Massive Buy Detected!*\n\n` 
        : `🚨 *New Pump.fun / Solana Alert!*\n\n`;

      message += `📌 *Type:* ${type}\n`;
      if (solAmount > 0) {
        message += `💰 *SOL Amount:* ${solAmount.toFixed(2)} SOL\n`;
      }
      message += `📝 *Details:* ${description}\n`;
      if (signature) {
        message += `🔗 [View on Solscan](https://solscan.io/tx/${signature})`;
      }

      if (botToken && chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown"
          }),
        });
      }
    }

    return res.status(200).json({ success: true, message: "Transactions sent to Telegram" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
