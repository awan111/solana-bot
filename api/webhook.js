const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: "Markdown", disable_web_page_preview: true }),
});
const tgResult = await tgRes.json();
if (!tgResult.ok) {
    console.error("Telegram Error:", tgResult);
}
