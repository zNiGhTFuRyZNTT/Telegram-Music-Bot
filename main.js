const TeleBot = require('telebot')
const searchYT = require('yt-search')
const { exec } = require('child_process')
require('dotenv').config()

const youtube_dl_path = './youtube-dl'
const token = process.env.API_KEY
const bot = new TeleBot(token)
const status = []

async function findVideo(query) {
    const result = await searchYT(query)
    return (result.videos.length > 1) ? result.videos[0] : null
}

bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'))

bot.on('text', async (msg) => {
    const chatID = msg.chat.id

    if (status[chatID]) {
        bot.sendMessage(chatID, `Please wait until your last query is completed.`)
        return
    }

    status[chatID] = true
    const video = await findVideo(msg.text)
    if (!video) {
        bot.sendMessage(chatID, `Your requested music is not available.`)
        return
    }
    const vlen = video.duration.seconds
    
    if (vlen < 1200) {
        bot.sendMessage(chatID, `Downloading ${video.title}...`)
        .then(async _ => {
            const path = `storage/${video.title}-${chatID}.mp3`
            exec(`${youtube_dl_path} --extract-audio --audio-format mp3 "${video.url}" -o "${path}"`, (err, stdout, stderr) => {
                bot.sendAudio(chatID, path, { fileName: `${video.title}.mp3` })
                    .then(_ => {
                        exec(`rm "${path}"`, () => {
                            status[chatID] = false
                        })
                    })
            })
        })
    } 
    else {
        status[chatID] = false
        bot.sendMessage(chatID, `Your music is more than 20 Minutes.`)
    }
})

bot.start()