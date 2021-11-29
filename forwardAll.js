const TeleBot = require('telebot')
const { appendFile } = require('fs')
const { getAllUsers } = require('./database')
require('dotenv').config()

const interval = 500
const token = process.env.API_KEY
const bot = new TeleBot(token)

getAllUsers()
    .then(users => {
        users.forEach((user, i) => {
            setTimeout(() => {
                bot.forwardMessage(user.chat_id, -1001404127129, 16)
                    .then(() => console.log(`Sending to ${user.firstname} `+"\033[32m"+"Success"+"\033[0m"))
                    .catch(e => {
                        appendFile('error.log', `\n${user.user_id} - ${JSON.stringify(e)}\n`, (err) => err && console.error(err))

                        console.log(`Sending to ${user.firstname} `+"\033[31m"+"Failed"+"\033[0m")
                    })
            }, i * interval)
        })
    })
    .catch(err => console.error(err))