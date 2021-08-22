const TeleBot = require('telebot')
const searchYT = require('yt-search')
require('dotenv').config()

const token = process.env.API_KEY
const bot = new TeleBot(token)

async function findVideo(query) {
    const result = await searchYT(query)
    return (result.videos.length > 1) ? result.videos[0] : null
}

bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'))

bot.on('text', async (msg) => {
    const chatID = msg.chat.id
    const video = await findVideo(msg.text)

    bot.sendMessage(chatID, `Downloading ${video.title}...`)
        .then(_ => {
            
        })
})

bot.start()