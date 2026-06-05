import "dotenv/config";

console.log("cwd:", process.cwd());
console.log("TELEGRAM_BOT_TOKEN exists:", Boolean(process.env.TELEGRAM_BOT_TOKEN));
console.log("TELEGRAM_CHAT_ID exists:", Boolean(process.env.TELEGRAM_CHAT_ID));
console.log("TELEGRAM_BOT_TOKEN length:", process.env.TELEGRAM_BOT_TOKEN?.length);
console.log("TELEGRAM_CHAT_ID:", process.env.TELEGRAM_CHAT_ID);
