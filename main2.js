const TeleBot = require('telebot');

const dotenv = require('dotenv').config();
const ytdl = require('ytdl-core');
const { exec } = require("child_process");
const fs = require('fs');
// replace the value in .env file with the Telegram token you receive from @BotFather
const token = process.env.API_KEY;
const bot = new TeleBot(token);

bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'));


bot.on('text', async (msg) => {
    chatID = msg.chat.id;
    return bot.sendMessage(chatID, "Ahhhh bokon tooom");
    
});

bot.start();