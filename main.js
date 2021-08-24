const TeleBot = require('telebot')
const searchYT = require('yt-search')
const { exec } = require('child_process')
const ytdl = require('ytdl-core')
require('dotenv').config()

const youtube_dl_path = './youtube-dl'
const token = process.env.API_KEY
const bot = new TeleBot(token)
const status = []
var url_expression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi
var url_regex = new RegExp(url_expression)

function getYoutubeUrlId(url) {
    const urlObject = new URL(url)
    let urlOrigin = urlObject.origin
    let urlPath = urlObject.pathname

    if (urlOrigin.search('youtu.be') > -1) {
        return urlPath.substr(1)
    }

    if (urlPath.search('embed') > -1) {
        return urlPath.substr(7)
    }

    return urlObject.searchParams.get('v')
}

function cleanTitle(title) {
    title = title.replace(/`/g, " ")
    title = title.replace(/'/g, " ")
    title = title.replace(/"/g, " ")
    title = title.replace(/\//g, " ")
    title = title.replace(/\\/g, " ")
    return title
}

function cleanUp(chatID) {
    exec(`rm storage/${chatID}*`, () => {
        status[chatID] = false
    })
}

async function findVideo(query) {
    const result = await searchYT(query)
    return (result.videos.length > 1) ? result.videos[0] : null
}

bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'))

bot.on('/donate', (msg) => msg.reply.text('https://www.paypal.me/znightfuryz'))

bot.on('text', async (msg) => {
    const chatID = msg.chat.id
    const isUrl = msg.text.match(url_regex)
    if (isUrl) {
        msg.text = getYoutubeUrlId(msg.text)
        if (!msg.text) {
            bot.sendMessage(chatID, '[❗] Invalid URL')
            return
        }
    }

    if (status[chatID]) {
        bot.sendMessage(chatID, `[❗] Please wait until your last query is completed.`)
        return
    }

    status[chatID] = true
    try {
        if (isUrl) {
            var video = await ytdl.getInfo(msg.text)
            video.title = video.videoDetails.title
            video.url = video.videoDetails.video_url
            video.seconds = video.videoDetails.lengthSeconds
        }
        else {
            var video = await findVideo(msg.text)
            video.seconds = video.duration.seconds
        }
    }
    catch(e) {
        if (!video) {
            cleanUp(chatID)
            bot.sendMessage(chatID, `[❗] Your requested music is not available.`)
            return
        }
    }

    const vlen = video.seconds 

    if (vlen < 2400) {
        bot.sendMessage(chatID, `[🍑] Downloading ${video.title}...`) 
        .then(async _ => {
            const dl_timeout = setTimeout(() => {
                yt_process.kill('SIGKILL')
                cleanUp(chatID)
                bot.sendMessage(chatID, `[❗] Download took more than 20 seconds, Please try again...`)
            }, 20000)

            const path = `storage/${chatID}-${Date.now()}.mp3`
            const yt_process = exec(`${youtube_dl_path} --extract-audio --audio-format mp3 "${video.url}" -o "${path}"`, (err, stdout, stderr) => {
                clearTimeout(dl_timeout)
                bot.sendAudio(chatID, path, { fileName: `${cleanTitle(video.title)}.mp3` })
                    .then(_ => {
                        cleanUp(chatID)
                    })
                    .catch(err => {
                        cleanUp(chatID)
                        bot.sendMessage(chatID, `[❗] Something went wrong, Please try again...`)
                    })
            })
        })
    } 
    else {
        cleanUp(chatID)
        bot.sendMessage(chatID, `[❗] Your music is more than 40 Minutes.`)
    }
})

bot.start()