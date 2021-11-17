const TeleBot = require('telebot')
const searchYT = require('yt-search')
const { exec } = require('child_process')
const ytdl = require('ytdl-core')
const captions = require('./captions.json')
require('dotenv').config()

const token = process.env.API_KEY
const bot = new TeleBot(token)
const status = []
const count = { all: 0, success: 0 }
const url_expression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi
const url_regex = new RegExp(url_expression)

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

function send_log(msg) {
    bot.sendMessage(-1001765223291, msg).catch(console.log)
}

async function findVideo(query) {
    const result = await searchYT(`${query} audio`)
    return (result.videos.length > 1) ? result.videos[0] : null
}

bot.on(['/start', '/hello'], (msg) => msg.reply.text('به سریع ترین بات موزیک تلگرام خوش اومدی😉✅ \n اسم موزیک یا لینک یوتوبشو برام بفرست و خودت نتیجه رو ببین‼️🔞 \n اگه حال کردی مارو به دوستات معرفی کن♥️'))

bot.on('/donate', (msg) => msg.reply.text(' [>] https://www.paypal.me/znightfuryz \n [IRAN]> https://idpay.ir/nelody'))

bot.on('/joom', msg => {
    if (msg.from.id === 111733645 || msg.from.id === 214619416)
        msg.reply.text(`All ${count.all} | Success ${count.success}`)
})

bot.on('text', async (msg) => {
    if (['/joom', '/donate', '/start', '/hello'].includes(msg.text)) return

   
})

bot.start()

// Interval Test Log
setInterval(() => {
    
}, 2000)