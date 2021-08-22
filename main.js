const TeleBot = require('telebot')
const searchYT = require('yt-search')
const { exec } = require('child_process')
require('dotenv').config()

const youtube_dl_path = './youtube-dl'
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
    const vlen = video.duration.seconds

    if (vlen < 1200) {
        bot.sendMessage(chatID, `Downloading ${video.title}...`)
        .then(async _ => {
            const path = `storage/${video.title}.mp3`
            exec(`${youtube_dl_path} --extract-audio --audio-format mp3 "${video.url}" -o "${path}"`, (err, stdout, stderr) => {
                bot.sendAudio(chatID, path)
                    .then(_ => {
                        exec(`rm "${path}"`)
                    })
            })
        })
    } else {
        bot.sendMessage(chatID, `Your music is more than 20 Minutes.`)
    }
})

bot.start()