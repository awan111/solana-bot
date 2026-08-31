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
      replyText = "🤖 LethalOrca ($LORCA) Bot Active!\n\nAvailable commands:\n/price - Check live price & market cap\n/contract - Get official token contract\n/roadmap - View project phases\n/socials - Official links";
    } else if (text === "/price") {
      let liveDataFound = false;
      
      // 1. Try Pump.fun API first (since it's a pump.fun token)
      try {
        const pfResponse = await fetch("https://frontend-api.pump.fun/coins/7RqpgT532tsYakbgnTXECC4MHTEGu5HzBxVAkAAHpump", {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json"
          }
        });
        const pfData = await pfResponse.json();
        
        if (pfData && pfData.usd_market_cap) {
          const marketCapUsd = pfData.usd_market_cap;
          const priceUsd = marketCapUsd / 1000000000;
          const formattedPrice = priceUsd < 0.0001 ? priceUsd.toExponential(4) : priceUsd.toFixed(9);
          const formattedMc = Number(marketCapUsd).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
          const pumpUrl = "https://pump.fun/coin/7RqpgT532tsYakbgnTXECC4MHTEGu5HzBxVAkAAHpump";
          
          replyText = `📊 $LORCA Live Stats (Pump.fun):\n\n💰 Price: $${formattedPrice}\n📈 Market Cap: ${formattedMc}\n🔄 Status: ${pfData.complete ? "Graduated (Raydium)" : "Bonding Curve"}\n\n🔗 [View on Pump.fun](${pumpUrl})`;
          liveDataFound = true;
        }
      } catch (err) {
        console.error("Pump.fun fetch error:", err);
      }

      // 2. Fallback to DexScreener API if Pump.fun fails
      if (!liveDataFound) {
        try {
          const dexResponse = await fetch("https://api.dexscreener.com/latest/dex/tokens/7RqpgT532tsYakbgnTXECC4MHTEGu5HzBxVAkAAHpump");
          const dexData = await dexResponse.json();
          const pair = dexData.pairs?.[0];
          
          if (pair) {
            const priceUsd = pair.priceUsd || "0";
            const marketCapUsd = pair.marketCap || pair.fdv || 0;
            const change24h = pair.priceChange?.h24 ?? "0";
            const dexUrl = pair.url || "https://dexscreener.com";
            const formattedMc = Number(marketCapUsd).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            
            replyText = `📊 $LORCA Live Stats (DexScreener):\n\n💰 Price: $${priceUsd}\n📈 Market Cap: ${formattedMc}\n🔄 24h Change: ${change24h}%\n\n🔗 [View on DexScreener](${dexUrl})`;
            liveDataFound = true;
          }
        } catch (err) {
          console.error("DexScreener fetch error:", err);
        }
      }

      if (!liveDataFound) {
        replyText = "📊 $LORCA Live Stats:\n\nLive data is currently updating. Please check [Pump.fun](https://pump.fun/coin/7RqpgT532tsYakbgnTXECC4MHTEGu5HzBxVAkAAHpump).";
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
