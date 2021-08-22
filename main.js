const TeleBot = require('telebot')
const searchYT = require('yt-search')
const YoutubeDlWrap = require("youtube-dl-wrap")
const youtubeDlWrap = new YoutubeDlWrap("./youtube-dl")
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
        .then(async _ => {
            const path = `storage/${video.title}.mp3`
            youtubeDlWrap.exec(['--extract-audio', '--audio-format mp3', video.url, "-o", path])
                .on('close', () => {
                    bot.sendAudio(chatID, `storage/${video.title}.mp3`)
                })
        })
})

bot.start()