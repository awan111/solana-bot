export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(200).json({ status: 'Bot is running' });
    }

    try {
        const update = req.body;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (update && update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text;

            let replyText = "Aapka message mil gaya hai!";
            if (text === '/start') {
                replyText = "Salam! Solana Bot active hai aur kaam kar raha hai. 🚀";
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
