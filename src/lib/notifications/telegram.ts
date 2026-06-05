type TelegramSendMessageParams = {
  text: string;
};

function getTelegramChatIds() {
  const singleChatId = process.env.TELEGRAM_CHAT_ID;
  const multipleChatIds = process.env.TELEGRAM_CHAT_IDS;

  const rawValue = multipleChatIds || singleChatId;

  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);
}

async function sendTelegramMessageToChat(params: {
  botToken: string;
  chatId: string;
  text: string;
}) {
  const response = await fetch(
    `https://api.telegram.org/bot${params.botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: params.chatId,
        text: params.text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(
      data.description ||
        `Failed to send Telegram message to chat ${params.chatId}.`
    );
  }

  return data;
}

export async function sendTelegramMessage({
  text,
}: TelegramSendMessageParams) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getTelegramChatIds();

  if (!botToken || chatIds.length === 0) {
    throw new Error("Telegram configuration is missing.");
  }

  const results = await Promise.allSettled(
    chatIds.map((chatId) =>
      sendTelegramMessageToChat({
        botToken,
        chatId,
        text,
      })
    )
  );

  const failedResults = results.filter(
    (result) => result.status === "rejected"
  );

  if (failedResults.length > 0) {
    console.error("[TELEGRAM] Some targets failed:", failedResults);
  }

  return {
    total: chatIds.length,
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: failedResults.length,
    results,
  };
}