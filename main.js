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

async function findVideo(query) {
    const result = await searchYT(query)
    return (result.videos.length > 1) ? result.videos[0] : null
}

bot.on(['/start', '/hello'], (msg) => msg.reply.text('Welcome!'))

bot.on('/donate', (msg) => msg.reply.text('https://www.paypal.me/znightfuryz'))

bot.on('text', async (msg) => {
    const isUrl = msg.text.match(url_regex)
    if (isUrl) {
        msg.text = getYoutubeUrlId(msg.text)
    }

    const chatID = msg.chat.id
    if (status[chatID]) {
        bot.sendMessage(chatID, `Please wait until your last query is completed.`)
        return
    }

    status[chatID] = true
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
    
    if (!video) {
        status[chatID] = false
        bot.sendMessage(chatID, `Your requested music is not available.`)
        return
    }
    const vlen = video.seconds 

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