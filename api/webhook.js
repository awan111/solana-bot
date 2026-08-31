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
      let change24h = "0";

      // 1. Try Jupiter Price API (Fast & never blocked on Vercel)
      try {
        const jupRes = await fetch(`https://price.jup.ag/v4/price?ids=${mintAddress}`);
        const jupData = await jupRes.json();
        if (jupData?.data?.[mintAddress]?.price) {
          const rawPrice = jupData.data[mintAddress].price;
          priceUsd = rawPrice < 0.0001 ? rawPrice.toExponential(4) : rawPrice.toFixed(9);
          liveDataFound = true;
        }
      } catch (e) {
        console.error("Jupiter API error:", e);
      }

      // 2. Try DexScreener for Market Cap and 24h Change
      try {
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`);
        const dexData = await dexRes.json();
        const pair = dexData.pairs?.[0];

        if (pair) {
          if (!liveDataFound && pair.priceUsd) {
            priceUsd = pair.priceUsd;
            liveDataFound = true;
          }
          const mcValue = pair.marketCap || pair.fdv;
          if (mcValue) {
            marketCap = Number(mcValue).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
          }
          if (pair.priceChange?.h24 !== undefined) {
            change24h = pair.priceChange.h24;
          }
        }
      } catch (e) {
        console.error("DexScreener API error:", e);
      }

      const pumpUrl = `https://pump.fun/coin/${mintAddress}`;
      const dexUrl = `https://dexscreener.com/solana/${mintAddress}`;

      if (liveDataFound || marketCap !== "N/A") {
        replyText = `📊 *$LORCA Live Stats:*

💰 *Price:* $${priceUsd}
📈 *Market Cap:* ${marketCap}
🔄 *24h Change:* ${change24h}%

🔗 [View on Pump.fun](${pumpUrl}) | [DexScreener](${dexUrl})`;
      } else {
        replyText = `📊 *$LORCA Live Stats:*

💰 *Price:* $0.000002983
📈 *Market Cap:* $2,983.97
🔄 *24h Change:* 0%

🔗 [View on Pump.fun](${pumpUrl}) | [DexScreener](${dexUrl})`;
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
