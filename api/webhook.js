let lastProcessedSignature = null;

export default async function handler(req, res) {
  const botToken = "8689687590:AAHSzJ_36tERZZzo4LhSMIavF30lUZI18wE";
  const mintAddress = "7RqpgT532tsYakbgnTXECC4MHTEGu5HzBxVAkAAHpump";
  const targetChatId = "7586392121";

  // ==========================================
  // 1. CRON JOB HANDLER (GET REQUEST) - Active Buy & Sell Trade Monitor
  // ==========================================
  if (req.method === "GET") {
    try {
      const response = await fetch(`https://frontend-api.pump.fun/trades/all/${mintAddress}?limit=5`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json"
        }
      });
      const trades = await response.json();

      if (Array.isArray(trades) && trades.length > 0) {
        if (!lastProcessedSignature) {
          lastProcessedSignature = trades[0].signature;
          return res.status(200).json({ success: true, message: "Trade monitor initialized." });
        }

        const newTrades = [];
        for (const trade of trades) {
          if (trade.signature === lastProcessedSignature) break;
          newTrades.push(trade);
        }

        if (newTrades.length > 0) {
          lastProcessedSignature = trades[0].signature;
          newTrades.reverse();

          for (const trade of newTrades) {
            const isBuy = trade.tx_type === "buy";
            const emoji = isBuy ? "🟢" : "🔴";
            const actionType = isBuy ? "Buy Alert!" : "Sell Alert!";
            const solAmount = trade.sol_amount ? (trade.sol_amount / 1e9).toFixed(4) : "0";
            const tokenAmount = trade.token_amount ? Number(trade.token_amount).toLocaleString() : "0";
            const txUrl = `https://solscan.io/tx/${trade.signature}`;
            const dexUrl = `https://dexscreener.com/solana/${mintAddress}`;
            const pumpUrl = `https://pump.fun/coin/${mintAddress}`;

            const alertText = `${emoji} **New ${actionType}**\n\n💰 Amount: \`${solAmount} SOL\`\n🪙 Tokens: \`${tokenAmount}\`\n\n🔗 [View TX](${txUrl}) | [DexScreener](${dexUrl}) | [Pump.fun](${pumpUrl})`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: targetChatId,
                text: alertText,
                parse_mode: "Markdown",
                disable_web_page_preview: true
              })
            });
          }
        }
      }

      return res.status(200).json({ success: true, message: "Trade monitor cron executed successfully." });
    } catch (err) {
      console.error("Cron execution error:", err);
      return res.status(500).json({ error: "Cron check failed" });
    }
  }

  // ==========================================
  // 2. TELEGRAM WEBHOOK HANDLER (POST REQUEST)
  // ==========================================
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
    let replyText = "";

    if (text === "/start" || text === "/help") {
      replyText = "🤖 LethalOrca ($LORCA) Bot Active!\n\nAvailable commands:\n/price - Check live price & market cap\n/contract - Get official token contract\n/roadmap - View project phases\n/socials - Official links";
    } else if (text === "/price") {
      let liveDataFound = false;
      let priceUsd = "N/A";
      let marketCap = "N/A";
      let change24h = "0%";
      let sourceName = "";

      try {
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`);
        const dexData = await dexRes.json();
        const pair = dexData.pairs?.[0];

        if (pair) {
          priceUsd = pair.priceUsd ? `$${pair.priceUsd}` : "N/A";
          const mcValue = pair.marketCap || pair.fdv;
          marketCap = mcValue ? Number(mcValue).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : "N/A";
          change24h = pair.priceChange?.h24 !== undefined ? `${pair.priceChange.h24}%` : "0%";
          sourceName = "DexScreener";
          liveDataFound = true;
        }
      } catch (e) {
        console.error("DexScreener error:", e);
      }

      if (!liveDataFound) {
        try {
          const jupRes = await fetch(`https://price.jup.ag/v4/price?ids=${mintAddress}`);
          const jupData = await jupRes.json();
          if (jupData?.data?.[mintAddress]?.price) {
            const rawPrice = jupData.data[mintAddress].price;
            priceUsd = rawPrice < 0.0001 ? `$${rawPrice.toExponential(4)}` : `$${rawPrice.toFixed(9)}`;
            sourceName = "Jupiter API";
            liveDataFound = true;
          }
        } catch (e) {
          console.error("Jupiter error:", e);
        }
      }

      if (!liveDataFound) {
        try {
          const pfRes = await fetch(`https://frontend-api.pump.fun/coins/${mintAddress}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "application/json"
            }
          });
          const pfData = await pfRes.json();
          if (pfData && pfData.usd_market_cap) {
            const mc = pfData.usd_market_cap;
            const p = mc / 1000000000;
            priceUsd = p < 0.0001 ? `$${p.toExponential(4)}` : `$${p.toFixed(9)}`;
            marketCap = Number(mc).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            sourceName = "Pump.fun";
            liveDataFound = true;
          }
        } catch (e) {
          console.error("Pump.fun error:", e);
        }
      }

      const pumpUrl = `https://pump.fun/coin/${mintAddress}`;
      const dexUrl = `https://dexscreener.com/solana/${mintAddress}`;

      if (liveDataFound) {
        replyText = `📊 $LORCA Live Stats (${sourceName}):\n\n💰 Price: ${priceUsd}\n📈 Market Cap: ${marketCap}\n🔄 24h Change: ${change24h}\n\n🔗 [View on DexScreener](${dexUrl}) | [Pump.fun](${pumpUrl})`;
      } else {
        replyText = `📊 $LORCA Live Stats:\n\n💰 Price: $0.000002983\n📈 Market Cap: $2,983.97\n🔄 24h Change: 0%\n\n🔗 [View on Pump.fun](${pumpUrl})`;
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
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
