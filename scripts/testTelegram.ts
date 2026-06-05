import "dotenv/config";
import { sendTelegramMessage } from "../src/lib/notifications/telegram";

async function main() {
  console.log("token exists:", Boolean(process.env.TELEGRAM_BOT_TOKEN));
  console.log("chat id exists:", Boolean(process.env.TELEGRAM_CHAT_ID));

  await sendTelegramMessage({
    text: "✅ Test notification dari Monitoring App berhasil.",
  });

  console.log("Telegram test sent.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});