export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // 1. TELEGRAM BOT COMMANDS HANDLER (/price, /contract, etc.)
    if (body && body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text ? body.message.text.trim() : "";
      const tokenMint = "7RqpgT532tsYakbgnTXECC4MHTEGu5HzBxVAkAAHpump";

      let replyText = "";

      if (text.startsWith("/start") || text.startsWith("/help")) {
        replyText = `🤖 *LethalOrca ($LORCA) Bot Active!*\n\nAvailable commands:\n/price - Check live price & market cap\n/contract - Get official token contract\n/roadmap - View project phases\n/socials - Official links`;
      } 
      else if (text.startsWith("/contract")) {
        replyText = `📌 *Official Contract Address ($LORCA):*\n\`${tokenMint}\`\n\n*(Always verify on pump.fun!)*`;
      } 
      else if (text.startsWith("/roadmap")) {
        replyText = `🗺️ *LethalOrca Roadmap:*\n\n• *Phase 01:* Game Launch (LethalOrca Fishing)\n• *Phase 02:* Wallet Integration & Rewards\n• *Phase 03:* Marketplace & Community\n• *Phase 04:* In-Game Token Utility`;
      } 
      else if (text.startsWith("/socials")) {
        replyText = `🌐 *Official Links:*\n• Website: [lethalorca.com](https://lethalorca.com/)\n• Telegram: [Join Chat](https://t.me/lethalorca)\n• X / Twitter: [@lethalorcatdo](https://x.com/lethalorcatdo)`;
      } 
      else if (text.startsWith("/price")) {
        try {
          const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
          const data = await response.json();
          const pair = data.pairs && data.pairs[0];

          if (pair) {
            const priceUsd = pair.priceUsd || "N/A";
            const mCap = pair.marketCap || pair.fdv || "N/A";
            const priceChange = pair.priceChange?.h24 || "0";
            
            replyText = `📊 *$LORCA Live Stats:*\n\n💰 *Price:* $${priceUsd}\n📈 *Market Cap:* $${Number(mCap).toLocaleString()}\n🔄 *24h Change:* ${priceChange}%\n🔗 [View on DexScreener](${pair.url})`;
          } else {
            replyText = `📊 *$LORCA*: Trading data loading or pair not found yet on DexScreener.`;
          }
        } catch (err) {
          replyText = `⚠️ Error fetching price data right now.`;
        }
      }

      if (replyText) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: "Markdown",
            disable_web_page_preview: true
          }),
        });
      }

      return res.status(200).json({ success: true, message: "Telegram command handled" });
    }

    // 2. HELIUS WEBHOOK TRANSACTIONS HANDLER (Buy/Sell & Whale Alerts)
    const txs = body;
    if (!Array.isArray(txs) || txs.length === 0) {
      return res.status(200).json({ success: true, message: "No transactions found" });
    }

    const chatId = process.env.TELEGRAM_CHAT_ID;

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

    return res.status(200).json({ success: true, message: "Transactions sent to Telegram" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
