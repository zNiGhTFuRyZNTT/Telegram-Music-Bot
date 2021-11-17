function query(bot, msg) {
    count.all++
    // < --- User Details --- >
    const chatID = msg.chat.id
    const userID = msg.from.id
    const username = msg.from.username
    const firstname = msg.from.first_name
    // < --- End --- >
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
            
            const path = `storage/${chatID}-${msg.message_id}.mp3`
            const caption = captions[Math.floor(Math.random() * captions.length)]
            const yt_process = exec(`python3 downloader.py "${video.url}" "${chatID}" "${msg.message_id}"`, (err, stdout, stderr) => {
                clearTimeout(dl_timeout)
                bot.sendAudio(chatID, path, { fileName: `${cleanTitle(video.title)}.mp3`, caption: caption, serverDownload: true, title: `${cleanTitle(video.title)}`, performer: `Nelody`})
                    .then(_ => {
                        count.success++
                        cleanUp(chatID)
                    })
                    .catch(err => {
                        cleanUp(chatID)
                        bot.sendMessage(chatID, `[❗] Something went wrong, Please try again...`)
                        send_log(`${err}`)
                    })
            })
        })
    } 
    else {
        cleanUp(chatID)
        bot.sendMessage(chatID, `[❗] Your music is more than 40 Minutes.`)
    }
}

module.exports = {
    query: query
}