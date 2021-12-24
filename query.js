const ytdl = require('ytdl-core')
const searchYT = require('yt-search')
const { exec } = require('child_process')
const database = require('./database')
const captions = require('./captions.json')

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

async function send_donate_msg(send) {
    send(`
        با توجه به هزینه های سنگین نگهداری ربات جهت حمایت از تیم نلودی میتونید از طریق لینک های زیر مارو دونیت کنید♥️

        [IRAN]> https://idpay.ir/nelody
        
        [PAYPAL]> https://www.paypal.me/znightfuryz
        
        میتونید آیدی تلگرام خودتون یا چنلتون رو رو در توضیحات پرداخت وارد کنید تا در آپدیت بعد جز کاربران ویژه قرار بگیرید و از جایزه های ماهانه بهره مند شید🔥
        با تشکر از حمایت شما🙏
    `)
}

function send_log(bot, msg) {
    bot.sendMessage(-1001765223291, msg).catch(console.log)
}

async function findVideo(query) {
    const result = await searchYT(`${query} audio`)
    return (result.videos.length > 1) ? result.videos[0] : null
}

function cleanUp(chatID) {
    exec(`rm storage/${chatID}*`, () => {
        status[chatID] = false
    })
}

async function query(bot, msg, test=false) {
    if (msg.chat.id <= 0) return
    
    count.all++

    // < --- User Details --- >
    const chatID = msg.chat.id
    const userID = msg.from.id
    const username = msg.from.username
    const firstname = msg.from.first_name
    const lastname = !msg.from.last_name ? null : msg.from.last_name
    // < --- End --- >

    database.addUser(username, firstname, lastname, userID, chatID)
        .then(() => {
            database.updateAll(userID)
                .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
        })
        .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))

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

    msg.reply.text("[🔞] Please wait...")
        .then(async mainMsg => {
            const messageID = mainMsg.message_id
            
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
                    bot.editMessageText({ chatId: chatID, messageId: messageID }, `[❗] Your requested music is not available.`)
                        .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
                    return
                }
            }
        
            const vlen = video.seconds 
        
            if (vlen < 2400) {
                bot.editMessageText({ chatId: chatID, messageId: messageID }, `[🍑] Downloading ${video.title}...`) 
                .then(async _ => {
                    const dl_timeout = setTimeout(() => {
                        yt_process.kill('SIGKILL')
                        cleanUp(chatID)
                        bot.editMessageText({ chatId: chatID, messageId: messageID }, `[❗] Download took more than 20 seconds, Please try again...`)
                            .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
                    }, 20000)
                    
                    const path = `storage/${chatID}-${msg.message_id}.m4a`
                    const caption = captions[Math.floor(Math.random() * captions.length)]
                    const yt_process = exec(`./yt-dlp -x -f 140 "${video.url}" -o ${path}`, (err, stdout, stderr) => {
                        clearTimeout(dl_timeout)

                        Math.random() < 0.55 &&
                            await send_donate_msg(text => bot.sendMessage(chatID, text))

                        bot.sendAudio(chatID, path, { fileName: test ? new Date().toUTCString() : `${cleanTitle(video.title)}.m4a`, caption: caption, serverDownload: true, title: `${cleanTitle(video.title)}`, performer: `Nelody`})
                            .then(_ => {
                                count.success++
                                cleanUp(chatID)

                                database.updateSuccess(userID)
                                    .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))

                                bot.deleteMessage(chatID, messageID)
                                    .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
                            })
                            .catch(err => {
                                exec(`./yt-dlp -x -f 18 "${video.url}" -o ${path}`, (err, stdout, stderr) => {
                                    bot.sendAudio(chatID, path, { fileName: test ? new Date().toUTCString() : `${cleanTitle(video.title)}.m4a`, caption: caption, serverDownload: true, title: `${cleanTitle(video.title)}`, performer: `Nelody`})
                                        .then(_ => {
                                            count.success++
                                            cleanUp(chatID)
            
                                            database.updateSuccess(userID)
                                                .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
            
                                            bot.deleteMessage(chatID, messageID)
                                                .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
                                        })
                                        .catch(err => {
                                            cleanUp(chatID)
                                            bot.editMessageText({ chatId: chatID, messageId: messageID }, `[❗] Something went wrong, Please try again...`)
                                                .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
                                            send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(err)}`)
                                        })
                                })
                            })
                    })
                })
            } 
            else {
                cleanUp(chatID)
                bot.editMessageText({ chatId: chatID, messageId: messageID }, `[❗] Your music is more than 40 Minutes.`)
                    .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
            }
        })
        .catch((e) => send_log(bot, `UserID: ${userID}\nQuery: ${msg.text}\n${JSON.stringify(e)}`))
}

module.exports = {
    send_log: send_log,
    query: query,
    count: count
}