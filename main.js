const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv').config();
const ytdl = require('ytdl-core');
const { exec } = require("child_process");
const fs = require('fs');
// replace the value in .env file with the Telegram token you receive from @BotFather
const token = process.env.API_KEY;
const bot = new TelegramBot(token, {polling: true});




bot.on('message', async (msg) => {
    const chatID = msg.chat.id;
    let umsg = msg.text;

    exec(`py getInfo.py ${umsg}`, async (error, data, getter) => {
        if(error){
            console.log("error",error.message);
            return;
        }
        if(getter){
            console.log(data);
            return;
        }
        console.log(data);
        let title = data.split('~')[0];
        let id = data.split('~')[1];
        await ytdl(`http://www.youtube.com/watch?v=${id}`).pipe(fs.createWriteStream(`storage/${title}.mp3`));

        // let music = fs.createReadStream(`1.mp3`);
        // bot.sendAudio(chatID, `storage/${title}.mp3`);
        exec(`py uploader.py ${chatID} ${title}`, async (error,data, getter) => {
            if(error){
                console.log("error",error.message);
                return;
            }
            if(getter){
                console.log(data);
                return;
            }
            console.log(`Sent to python for Upload ...`);
            console.log(data);
        })


    });
    


})


        // getTitle(data, function (err, title) {
        //     console.log(title) // 'SLCHLD - EMOTIONS (feat. RIPELY) (prod. by GILLA)'

        //     // var YD = new YoutubeMp3Downloader({
        //     //     "ffmpegPath": "ffmpeg/ffmpeg-4.4-full_build/bin/ffmpeg.exe",        // FFmpeg binary location
        //     //     "outputPath": `/storage`,    // Output file location (default: the home directory)
        //     //     "youtubeVideoQuality": "highestaudio",  // Desired video quality (default: highestaudio)
        //     //     "queueParallelism": 2,                  // Download parallelism (default: 1)
        //     //     "progressTimeout": 2000,                // Interval in ms for the progress reports (default: 1000)
        //     //     "allowWebm": false                      // Enable download from WebM sources (default: false)
        //     // });
        //     // YD.download(data);
        //   })



    // const songInfo = await ytdl.getInfo('yC2zutHWdJc');
    // const song = {
    //     title: songInfo.videoDetails.title,
    //     url: songInfo.videoDetails.video_url
    // }
    // bot.sendMessage(chatID, song.title)