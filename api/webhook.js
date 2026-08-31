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
    const mintAddress = "7RqpgT532tsYakbgnTXECC4MHTEGu5HzBxVAkAAHpump";

    let replyText = "";

    if (text === "/start" || text === "/help") {
      replyText = "🤖 LethalOrca ($LORCA) Bot Active!\n\nAvailable commands:\n/price - Check live price & market cap\n/contract - Get official token contract\n/roadmap - View project phases\n/socials - Official links";
    } else if (text === "/price") {
      let liveDataFound = false;
      let priceUsd = "N/A";
      let marketCap = "N/A";
      let statusText = "Bonding Curve";

      try {
        const response = await fetch(`https://frontend-api.pump.fun/coins/${mintAddress}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json"
          }
        });
        const data = await response.json();

        if (data && data.usd_market_cap) {
          const marketCapUsd = data.usd_market_cap;
          const calculatedPrice = marketCapUsd / 1000000000;
          
          priceUsd = calculatedPrice < 0.0001 ? calculatedPrice.toExponential(4) : calculatedPrice.toFixed(9);
          marketCap = Number(marketCapUsd).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
          statusText = data.complete ? "Graduated (Raydium)" : "Bonding Curve";
          liveDataFound = true;
        }
      } catch (e) {
        console.error("Pump.fun API error:", e);
      }

      const pumpUrl = `https://pump.fun/coin/${mintAddress}`;
      const dexUrl = `https://dexscreener.com/solana/${mintAddress}`;

      if (liveDataFound) {
        replyText = `📊 *$LORCA Live Stats (Pump.fun):*\n\n💰 *Price:* $${priceUsd}\n📈 *Market Cap:* ${marketCap}\n🔄 *Status:* ${statusText}\n\n🔗 [View on Pump.fun](${pumpUrl})`;
      } else {
        replyText = `📊 *$LORCA Live Stats:*\n\nLive stats are temporarily unavailable. Please check directly on [Pump.fun](${pumpUrl}).`;
      }
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
        parse_mode: "Markdown",
        disable_web_page_preview: true
      }),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
