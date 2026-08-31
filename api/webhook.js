export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const txData = req.body;
    
    // Helius webhook data se transaction signature nikalna
    const signature = txData && Array.isArray(txData) && txData[0]?.signature 
      ? txData[0].signature 
      : (txData?.signature || "N/A");

    const message = `🔔 *New LethalOrca (\$LORCA) Transaction!*\n\n• *Status:* Success\n• *Signature:* \`${signature.slice(0, 20)}...\``;

    const botToken = "8689687590:AAHSzJ_36tERZZzo4LhSMIavF30lUZI18wE";
    const chatId = "7586392121";

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

    return res.status(200).json({ success: true, message: "Sent to Telegram" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
