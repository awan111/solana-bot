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

      let replyText = "";

      if (text === "/start" || text === "/help") {
        replyText = "🤖 *LethalOrca ($LORCA) Bot Active!*\n\nAvailable commands:\n/price - Check live price & market cap\n/contract - Get official token contract\n/roadmap - View project phases\n/socials - Official links";
      } else if (text === "/price") {
        let liveDataFound = false;
        
        // Try Pump.fun API first
        try {
          const pfResponse = await fetch(`https://frontend-api.pump.fun/coins/${tokenMint}`, {
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
            const pumpUrl = `https://pump.fun/coin/${tokenMint}`;
            
            replyText = `📊 *$LORCA* Live Stats (Pump.fun):\n\n💰 Price: $${formattedPrice}\n📈 Market Cap: ${formattedMc}\n🔄 Status: ${pfData.complete ? "Graduated (Raydium)" : "Bonding Curve"}\n\n🔗 [View on Pump.fun](${pumpUrl})`;
            liveDataFound = true;
          }
        } catch (err) {
          console.error("Pump.fun fetch error:", err);
        }

        // Fallback to DexScreener API if Pump.fun fails
        if (!liveDataFound) {
          try {
            const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
            const dexData = await dexResponse.json();
            const pair = dexData.pairs?.[0];
            
            if (pair) {
              const priceUsd = pair.priceUsd || "0";
              const marketCapUsd = pair.marketCap || pair.fdv || 0;
              const change24h = pair.priceChange?.h24 ?? "0";
              const dexUrl = pair.url || `https://dexscreener.com/solana/${tokenMint}`;
              const formattedMc = Number(marketCapUsd).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
              
              replyText = `📊 *$LORCA* Live Stats (DexScreener):\n\n💰 Price: $${priceUsd}\n📈 Market Cap: ${formattedMc}\n🔄 24h Change: ${change24h}%\n\n🔗 [View on DexScreener](${dexUrl})`;
              liveDataFound = true;
            }
          } catch (err) {
            console.error("DexScreener fetch error:", err);
          }
        }

        if (!liveDataFound) {
          replyText = `📊 *$LORCA* Live Stats:\n\nLive data is currently updating. Please check [Pump.fun](https://pump.fun/coin/${tokenMint}).`;
        }
      } else if (text === "/contract") {
        replyText = `Contract: \`${tokenMint}\` (Solana)`;
      } else if (text === "/roadmap") {
        replyText = "🗺️ *LethalOrca Roadmap:*\n• Phase 1: Game Launch\n• Phase 2: Wallet Integration\n• Phase 3: Marketplace\n• Phase 4: Token Utility";
      } else if (text === "/socials") {
        replyText = "🌐 Official Website: https://lethalorca.com/";
      } else {
        replyText = "Unknown command. Use /start to see available commands.";
      }

      if (botToken) {
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
      }

      return res.status(200).json({ success: true, message: "Telegram command handled" });
    }

    // 2. HELIUS WEBHOOK TRANSACTIONS
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
        ? `🐋 WHALE ALERT! Massive Buy Detected!\n\n` 
        : `🚨 New Pump.fun / Solana Alert!\n\n`;

      message += `📌 Type: ${type}\n`;
      if (solAmount > 0) {
        message += `💰 SOL Amount: ${solAmount.toFixed(2)} SOL\n`;
      }
      message += `📝 Details: ${description}\n`;
      if (signature) {
        message += `🔗 View on Solscan: https://solscan.io/tx/${signature}`;
      }

      if (botToken && chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message
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
