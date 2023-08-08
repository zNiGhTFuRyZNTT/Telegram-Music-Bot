const { getUser } = require('../database')
const plans = require('../data/plans.json')
function sendToUser(bot, msg, sender_firstname, chat_id, message) {
    bot.sendMessage(chat_id, `[❗️] Sent b admin => ${sender_firstname}:\n\n${message}`)
        .then(() => {
            msg.reply.text(`Message sent\n\nchatID: ${chat_id}\n\nContent:\n${message}`)
        })
        .catch(err => msg.reply.text(`[❗️] Error Sending message: ${err.message}`)) 
}

function searchUser(bot, chat_id) {
    getUser(chat_id)
        // .then(res => msg.reply.text(`[User]:\n   username: ${res.username}\n   firstname= ${res.firstname}\n   lastname= ${!res.lastname ? null : res.lastname}\n   user_id= ${res.user_id}\n   chat_id= ${res.chat_id}\n success= ${res.success}\n all=${res.all} `))
        .then(res => bot.sendMessage(chat_id, `وضعیت کاربر به شرح زیر است:

        👨🏻‍💻 نام‌کاربری: ${!res.username ? 'Not provided' : res.username}
        👤 نام: ${!res.firstname ? 'Not provided' : res.firstname}
       👤 نام‌خوانوادگی: ${!res.lastname ? 'Not provided' : res.lastname}
       🌐 آیدی عددی: ${res.user_id}
       
       🎵 کل درخواست‌ها: ${res.all}
       🎵 موزیک های دریافت شده: ${res.success}
       
       ✅ وضعیت اشتراک: ${plans[res.plan].title}
       ❌ تاریخ اتمام اشتراک: ${res.plan_expiry}
       
       🌹`))
        .catch(err => bot.sendMessage(chat_id, `[!] Failed : ${err}`))
}

module.exports = {
    searchUser: searchUser,
    sendToUser: sendToUser
}
