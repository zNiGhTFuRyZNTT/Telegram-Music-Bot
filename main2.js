const bot = new Telegraf(process.env.BOT_TOKEN);
const dotenv = require('dotenv').config();
const ytdl = require('ytdl-core');
const { exec } = require("child_process");
const fs = require('fs');
// replace the value in .env file with the Telegram token you receive from @BotFather
const token = process.env.API_KEY;
const bot = new TelegramBot(token, {polling: true});



