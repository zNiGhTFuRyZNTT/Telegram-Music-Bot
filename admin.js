const { getUser } = require('./database')

function sendToUser(bot, msg, chat_id, message) {
    bot.sendMessage(chat_id, `[❗️] Sent by Admin:\n\n${message}`)
        .catch(err => msg.reply.text(`[❗️] Error Sending message: ${err.message}`)) 
}

function searchUser(msg) {
    getUser(msg.text)
        .then(res => msg.reply.text(`[User]:\n   username: ${res.username}\n   firstname= ${res.firstname}\n   lastname= ${!res.lastname ? null : res.lastname}\n   user_id= ${res.user_id}\n   chat_id= ${res.chat_id}`))
        .catch(err => msg.reply.text(`[!] Failed : ${err}`))
}

module.exports = {
    searchUser: searchUser,
    sendToUser: sendToUser
}