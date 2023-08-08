const TeleBot = require('telebot')
const searchYT = require('yt-search')
const admin = require('./utils/admin')
const uuid = require('uuid')
const cluster = require('cluster')
const { getTopTweny, getStatus, getUser, addPayment, getPayment, updateUserPlan, promoteUser, demoteUser, demote_if_expired } = require('./database')
const { send_log, query, count } = require('./utils/query.js')
const { get_url, get_lyric } = require('./utils/lyrics.js')
const { make_transaction, get_inquiry, validate_subscription } = require('./utils/payments')
require('dotenv').config()
const token = process.env.API_KEY
const bot = new TeleBot({
    token: token,
    usePlugins: [],
})
const plans = require('./data/plans.json')
const admins = process.env.ADMINS.split(",").map(Number)
const status = []
let lyrics_success = 0
let lyrics_all = 0

bot.on(/\/start(.*)/, async (msg, match) => {
    // console.log(msg.text);
    // console.log(match.match[1])
    
    if (msg.text === '/start'){
        getUser(msg.from.id).then(async (user) => {

            if (user.plan === 0) {
                await msg.reply.text("متاسفانه اشتراک فعالی نداری، از داشبورد میتونی اشتراک رو بخری و از بات لذت ببری😎")
            } 
            else {
                demote_if_expired(msg.from.id).then(async (res) => {
                    if (res) {
                        await msg.reply.text("متاسفانه اشتراک فعالی نداری، از داشبورد میتونی اشتراک رو بخری و از بات لذت ببری😎")
                        return
                    }
                    await msg.reply.text('[🍑] > به سریع ترین بات موزیک تلگرام خوش اومدی😉✅ \n اسم موزیک یا لینک یوتوبشو برام بفرست و خودت نتیجه رو ببین‼️🔞 \n اگه حال کردی مارو به دوستات معرفی کن♥️ \n\n [🍑] > Hi There, Welcome to the fastest telegram music bot ever! Wanna liten to a music? Send me the name or its Youtube URL 😉')

                })
            }
        })
        
    }

    else {
        try {
            const data = match.match[1]
            const order_id = data.split('planNo=')[0].trimStart() // validate payment
            const plan_no = data.split('planNo=')[1]
            console.log(order_id)
            console.log(plan_no)
            console.log(`Checking payment for ${order_id}`)
            getPayment(order_id).then((payment) => {
                console.log(payment.unique_id)
                validate_subscription(bot, msg.from.id, msg.chat.id, order_id, payment.unique_id, plan_no) 
    
            }).catch(err => {
                send_log(bot, `Error retrieving payment from database, err=> ${err.message}`)

            })
        } catch (error) {
            send_log(bot, `It seems that invalid parameter was passed to /start deep linking, err=> ${error}`)
        }

    }
})

function sendChannelJoinErr() {
    const message = `ناموسا برای حمایت از ما و استفاده از ربات لطفا اول تو کانالمون عضو شو 🙂🌹\n 😹 @nemesisdevteam 🍑`
    bot.sendMessage(msg.from.id, message).catch(err => console.log(err))
    return
}

bot.on('/scoreboard', async msg => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    if (!is_admin) return

    const tops = await getTopTweny()
    const top3 = tops.slice(0, 3)
    const under3 = tops.slice(3)
    let message = ``
    const medals = {0: '🥇', 1: '🥈', 2: '🥉'}
    tops.forEach(user => {
        const userIndex = tops.indexOf(user)
        message += `${medals[userIndex] ? medals[userIndex] : '🏅'}${user.username ? `@${user.username}` : `${user.firstname.length < 8 ? user.firstname : user.user_id}` } ⥴ ${user.success} / ${user.all}\n`
    })
    msg.reply.text(message).catch(err => console.log(err))
    
})

bot.on(/\/promote(.*)/, async (msg, match) => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    if (is_admin) {
        const data = match.match[1]
        const user_id_to_promote = data.split('@')[0].trimStart() 
        const plan_no = data.split('@')[1]
        if (plan_no === 0) {
            msg.reply.text("[❗] Can not promote to plan number 0, use demote command instead.").catch(err => console.log(err))
            return
        }
        const plan = plans[plan_no] 
        const today = new Date()
        const expiry_date = new Date(today.setMonth(today.getMonth() + plan.months_count)).toString()
        promoteUser(user_id_to_promote, plan_no, expiry_date).then((res) => {
            if (res) {
                if (plan_no === 4)
                    bot.sendMessage(user_id_to_promote, `[⚜️] وضعیت اشتراک شما توسط ادمین تغییر کرد، برای اطلاع در داشبورد روی وضعیت من کلیک کنید.`).catch(err => console.log(err))
                else
                    bot.sendMessage(user_id_to_promote, `[🍑] شما به اعضای طلایی نلودی اضافه شدید.\n\n\tبوس💋\n\tآرمین، توسعه دهنده نلودی ✅\n🥒`).catch(err => console.log(err))
            }
        })
        .catch(err => console.log(err))
    }

})

bot.on(/\/demote(.*)/, async (msg, match) => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    if (is_admin) {
        const user_id_to_demote = match.match[1]
        demoteUser(user_id_to_demote).then((res) => {
            msg.reply.text("[💋] دیموت شد قربان.")
        })
    }

})

bot.on('/dashboard', async msg => {
    const keyboard = {
        "replyMarkup" : {
            // "resize_keyboard": true,
            "inline_keyboard": [
                [{ text: 'حمایت از ما 💋', callback_data: 'donate' }, { text: 'خرید اشتراک ✅', callback_data: 'subscribe' }],
                [{ text: 'وضعیت من 👨🏻‍💻', callback_data: 'status' }],
                // [{ text: 'امتیاز به ربات ⭐️', callback_data: 'rate' }]
            ]
        }
    }
    bot.sendMessage(msg.from.id, 'لطفا انتخاب نمایید:', keyboard).catch(e => console.log(e))
})
bot.on('callbackQuery', async query => {
    const [msgId, chatId] = [query.message.message_id, query.message.chat.id]
    const deleteMsg = (chatId, msgId) => bot.deleteMessage(chatId, msgId).catch(err => console.log(err))
    const action = query.data
    // console.log(query)
    switch (true) {
        case action === 'donate': {
            bot.sendMessage(chatId,
            `از طریق لینک های زیر میتونید از ما حمایت کنید:


            ✅ پرداخت به ریال از طریق Idpay:
            https://idpay.ir/nelodybot
            
             ✅ پرداخت دیگر ارز ها از طریق PayPal:
            https://paypal.me/znightfuryz
            
            با تشکر از همراهی شما🌹🍑`

            ).catch(err => console.log(err))
            break
        }
        case action === 'status': {
            admin.searchUser(bot, chatId)
            break
        }
        case action === 'subscribe': {
            bot.editMessageReplyMarkup({
                chatId: chatId,
                messageId: msgId,

            }, {
                "replyMarkup" : {
                    "inline_keyboard": [
                        [{ text: 'یک ماهه - ۴۹۰۰ تومان', callback_data: 'verify_sub_1' }],
                        [{ text: 'شیش ماهه - ۱۹۹۰۰ تومان', callback_data: 'verify_sub_2' }],
                        [{ text: 'یکساله - ۳۹۹۰۰ تومان', callback_data: 'verify_sub_3' }],
                    ]
                }
            }).catch(err => console.log(err))
            break
        }
        case (action.includes("verify_sub") && action.split('_').length > 2): {
            const plan_no = action.split('_')[2]
            const plan = plans[plan_no]
            const user_id = query.from.id
            const order_id = uuid.v4()

            make_transaction(order_id, user_id, plan_no).then((payment) => {
                addPayment(user_id, order_id, payment.id, payment.link, plan_no).then((res) => {
                    if (res) {
                        getPayment(order_id).then((final_payment_details) => {
                            
                            if (final_payment_details.unique_id === payment.id) {
                                bot.sendMessage(chatId, 
                                `لطفا از طریق لینک زیر از طریق Idpay اقدام به پرداخت کنید:
                            ${final_payment_details.link}
                                ⚠️ توجه، ربات به صورت اتوماتیک روند پرداخت رو چک میکنه ولی محض احتیاط پیشنهاد میشه که از رسید پرداختی اسکرین شات بگیرید.
                                پس از پرداخت توسط آیدی پی به لینک ربات ارجاع داده خواهید شد، اگر پس از کلیک به روی Start اشتراک شما فعال نشد روی دکمه زیر کلیک کنید.`, 
                                {
                                    "replyMarkup" : {
                                        "inline_keyboard": [
                                            [{ text: 'تایید پرداخت ✅', callback_data: `verify_payment@${order_id}@${plan_no}@${user_id}` },],
                                        ]
                                    }
                                })
                                .catch(err => console.log(err))
                             } else {
                                bot.sendMessage(chatId, `❗️ مشکلی در اطلاعات پرداخت وجود داشت لطفا دوباره تلاش کنید یا با ادمین تماس بگیر`)
                                .catch(err => console.log(err))
                            }
                        })

                    } else {
                        bot.sendMessage(chatId, `❗️ تراکنش با این اطلاعات از قبل ساخته شده، لطفا دوباره تلاش کنید، اگر این ارور ادامه داشت با ادمین تماس بگیرید.`)
                            .catch(err => console.log(err))
                    }
                })

            })
            break

        }
        case action.includes('verify_payment'): {
            const order_id = action.split('@')[1]
            const plan_no = action.split('@')[2]
            const user_id = action.split('@')[3]

            getPayment(order_id).then((payment) => {
                validate_subscription(bot, user_id, chatId, order_id, payment.unique_id, plan_no, msgId) 
    
            })
            break
        }
    }
    
    
})


bot.on('/warn_admin', async (msg) => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    if (is_admin) {
    admins.map(id => {
        getUser(id).then(user => {
            bot.sendMessage(id,
            `آقا یا خانوم Ż.NīGhTFüRÿ.Z ، شما به عنوان ادمین در ربات نلودی شناخته شده اید.
هرگونه استفاده نادرست از این جایگاه منجر به خطشه دار شدن اعتبار و خط خطی و کبود شدن کون شما می‌شود🗿🔪🍑

با تشکر🌹
آرمین، توسعه دهنده نلودی✅
            🥒🍑
        `)
        })
        .catch(err => msg.reply.text(`Error: ${err}`))

    })}
})

bot.on('/joom', msg => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    if (is_admin)
        getStatus()
            .then(res => {
                msg.reply.text(`Users: ${res.users}\n\nMemory:\n${"\t".repeat(4)} All ${count.all} \n${"\t".repeat(4)} Success ${count.success} \n${"\t".repeat(4)} Lyrics_success ${lyrics_success} \n${"\t".repeat(4)} Lyrics_all ${lyrics_all}\n\nDatabase:\n ${"\t".repeat(4)}All ${res.all} \n${"\t".repeat(4)} Success ${res.success} \n${"\t".repeat(4)} Lyrics_success ${res.lyrics_success} \n${"\t".repeat(4)} Lyrics_all ${res.lyrics_all}`)
            })
            .catch((e) => send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${JSON.stringify(e)}`))
})

bot.on('/lyric', async msg => {
    bot.sendMessage(msg.from.id, `❗جستجوی متن موزیک تا اطلاع ثانوی در دسترس نمیباشد`).catch((e) => console.log)

})

bot.on('/send', async msg => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    try {
        if (is_admin) {
            const query = msg.text.split('\n')
            const user_id = query[0].split(' ')[1]
            const sender = await getUser(msg.from.id)
            query.shift()
            admin.sendToUser(bot, msg, sender.firstname, user_id, query.join('\n'))
        }
    }
    catch (e) {
        send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${JSON.stringify(e)}`)
    }
})

bot.on('/user', msg => {
    const is_admin = (admins.indexOf(msg.from.id) >= 0)
    if (is_admin) {
        admin.searchUser(bot, msg.chat.id)
    }
})


bot.on('text', async (msg) => {
    const log_channel_id = Number(process.env.LOG_CHANNEL_ID) ? Number(process.env.LOG_CHANNEL_ID) : null
    const bannedCmds = ['/promote', '/demote', '/dashboard', '/warn_admin', '/joom', '/donate', '/start', '/hello', '/user', '/send', '/search', '/lyric']
    if (bannedCmds.some((cmd => msg.text.startsWith(cmd)))) return
    if (msg.chat.id === -1001749065212 || msg.chat.id === log_channel_id) return
    if (msg.chat.id === 1010585854) return

    try {
        getUser(msg.from.id).then(async (user) => {

            if (user.plan === 0) {
                await msg.reply.text("متاسفانه اشتراک فعالی نداری، از داشبورد میتونی اشتراک رو بخری و از بات لذت ببری😎")
                return
            } 
            else {
                demote_if_expired(msg.from.id).then(async (res) => {
                    if (res) {
                        await msg.reply.text("متاسفانه اشتراک فعالی نداری، از داشبورد میتونی اشتراک رو بخری و از بات لذت ببری😎")
                        return
                    }
                    query(bot, msg)

                })
            }
        })
    } catch (error) {
        console.log(error)
    }
})

bot.on('inlineQuery', async msg => {
    if (!msg.query) return

    const answers = bot.answerList(msg.id, { cacheTime: 0 })
    const result = await searchYT(`${msg.query} audio`)
    
    if (result.videos.length > 1) {
        result.videos.forEach(async (v, i) => {
            v.seconds < 2400 &&
                await answers.addArticle({
                    id: i,
                    title: v.title,
                    description: v.description,
                    thumb_url: v.thumbnail,
                    message_text: v.url
                })
            
            if (result.videos.length-1 == i) 
                bot.answerQuery(answers, { cacheTime: 0 })
                    .catch((e) => send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${e.description}`))
        })
    }
    else {
        await answers.addArticle({
            id: 1,
            title: "Error 404",
            description: "Your requested music does not found",
            message_text: "-"
        })
            
        bot.answerQuery(answers, { cacheTime: 0 })
            .catch((e) => send_log(bot, `User: ${msg.from.id}\nQuery: ${msg.query}\nError: ${e.description}`))
    }
})

if (cluster.isMaster) {
    cluster.fork();
  
    cluster.on('exit', function(worker, code, signal) {
      cluster.fork();
    });
  }
  
  if (cluster.isWorker) {
    // put your code here
    bot.start()

  }


// Interval Test Log
setInterval(() => {
    const msg = {
        text: "Tataloo Amanat",
        chat: {
            id: -1001749065212
        },
        message_id: 1,
        from: {
            id: 1,
            username: "mmd",
            first_name: "gholi"
        }
    }
    query(bot, msg, true)
}, 60 * 60 * 1000)
