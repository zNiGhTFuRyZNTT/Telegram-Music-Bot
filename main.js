const TeleBot = require('telebot')

require('dotenv').config()
const token = process.env.API_KEY
const bot = new TeleBot(token)

bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'))

bot.on('text', async (msg) => {
    chatID = msg.chat.id
    return bot.sendMessage(chatID, "Ahhhh bokon tooom")
})

bot.start()