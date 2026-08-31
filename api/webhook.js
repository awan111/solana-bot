export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Bot is running' });
  }
  try {
    const update = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (update && update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || '';
      let replyText = "Message received!";
      if (text === '/start') {
        replyText = "Hello! Solana Bot is active and running. 🚀\n\nUse /price to check token price and contract details.";
      } else if (text === '/price' || text.startsWith('/price')) {
        // Replace with your actual token contract address and price fetching logic if needed
        const tokenContract = "Your_Solana_Contract_Address_Here";
        const tokenPrice = "$0.0054";
        replyText = `📊 *Token Price & Contract Details*\n\n` +
                    `• *Price:* ${tokenPrice}\n` +
                    `• *Contract:* \`${tokenContract}\``;
      }
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: "Markdown",
          disable_web_page_preview: true
        }),
      });
      const tgResult = await tgRes.json();
      if (!tgResult.ok) {
        console.error("Telegram Error:", tgResult);
      }
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
