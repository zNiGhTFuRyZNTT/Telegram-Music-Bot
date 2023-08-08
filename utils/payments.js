const request = require('request')
const plans = require('../data/plans.json')
const statuses = require('../data/pay_status_list.json')
const { getAllPayments, addPayment, getPayment, getUser, updateUserPlan } = require('../database')
require('dotenv').config()

function make_transaction(order_id, user_id, plan_no) {
    return new Promise((resolve, reject) => {
        getUser(user_id)
            .then(user => {
                const plan = plans[plan_no]
                const options = {
                    method: 'POST',
                    url: 'https://api.idpay.ir/v1.1/payment',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': `${process.env.PAYMENTS_API_KEY}`,
                        'X-SANDBOX': process.env.IS_SANDBOX,
                    },
                    body: {
                        'order_id': `${order_id}`,
                        'amount': plan.price,
                        'name': `${user.username || user.firstname || user.lastname}`,
                        'callback': `https://t.me/test_nigga_bot?start=${order_id}planNo=${plan_no}`,
                    },
                    json: true,
                }
                
                request(options, function (err, response, body) {
                    if (err) reject(err)
                    resolve(body)
                })
            })
            .catch(err => reject(err))

    })
    
}
// make_transaction().then(res=> console.log(res)).catch(err => console.log(err))
function get_inquiry(order_id, unique_id) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            url: 'https://api.idpay.ir/v1.1/payment/inquiry',
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': `${process.env.PAYMENTS_API_KEY}`,
              'X-SANDBOX': process.env.IS_SANDBOX,
            },
            body: {
              'id': unique_id,
              'order_id': order_id,
            },
            json: true,
        }
          
        request(options, function (err, response, body) {
            if (err) reject(err)
    
            resolve(body)
        })
    })
}

function verify_payment(order_id, unique_id) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            url: 'https://api.idpay.ir/v1.1/payment/verify',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': `${process.env.PAYMENTS_API_KEY}`,
                'X-SANDBOX': process.env.IS_SANDBOX,
            },
            body: {
                'id': unique_id,
                'order_id': order_id,
            },
            json: true,
          }
          
          request(options, function (err, response, body) {
            if (err) reject(err)
          
            resolve(body)
          })
    })
}

function validate_subscription(bot, user_id, chatId, order_id, unique_id, plan_no, msgId=null) {
    get_inquiry(order_id, unique_id)
        .then(res=> {
            // console.log(res)
            if (res.status === "10") { // if is waiting to be verified, then verify
                bot.sendMessage(chatId, "[❗️] در حال تایید پرداخت …")
                    .then(message=> {
                        const message_id = message.message_id
                        const deleteMsg = (chatId, msgId) => bot.deleteMessage(chatId, msgId).catch(err => console.log(err))

                        verify_payment(order_id, unique_id).then(res=> {
                            // console.log(res)
                            if (res.status === 100) {
                                updateUserPlan(user_id, plan_no, unique_id).then(res=> {
                                    if (res) {
                                        if (msgId) { // change markdown button if the request was send on button click
                                            bot.editMessageReplyMarkup({
                                                chatId: chatId,
                                                messageId: msgId,
                                
                                            }, {
                                                "replyMarkup" : {
                                                    "inline_keyboard": [
                                                        [{ text: '✅', callback_data: '✅' }],
                                                    ]
                                                }
                                            }).catch(err => console.log(err))
                                        }

                                        deleteMsg(chatId, message_id)
                                        bot.sendMessage(chatId, `اشتراک با موفقیت فعال شد ✅
                                        مرسی که همراه نلودی هستی💋🍑`).catch(err => console.log(err))
                                    }
        
        
                                })
                            }
                        })
                    })
                    .catch(err => console.log(err))
            }
            else if (["100"].includes(res.status)) {
                updateUserPlan(user_id, plan_no, unique_id).then(res=> {
                    if (msgId)
                        bot.editMessageReplyMarkup({
                            chatId: chatId,
                            messageId: msgId,
            
                        }, {
                            "replyMarkup" : {
                                "inline_keyboard": [
                                    [{ text: '✅', callback_data: '✅' }],
                                ]
                            }
                        }).catch(err => console.log(err))

                    bot.sendMessage(chatId, `اشتراک با موفقیت فعال شد ✅
                    مرسی که همراه نلودی هستی💋🍑`).catch(err => console.log(err))

                })
            }
            else if (Object.keys(statuses).slice(0, 7).includes(res.status)) {
                const status = statuses[`${res.status}`]
                if (msgId)
                    bot.editMessageReplyMarkup({
                        chatId: chatId,
                        messageId: msgId,
        
                    }, {
                        "replyMarkup" : {
                            "inline_keyboard": [
                                [{ text: '✅', callback_data: '✅' }],
                            ]
                        }
                    }).catch(err => console.log(err))

                bot.sendMessage(chatId, 
                    `[❗️] مشکلی در هنگام پرداخت رخ داد، اگر پولی از حسابت برداشته شده لطفا به ادمین پیام بده. \n\n ارور به شرح زیر است:\n\t\`❌ ${status}\`\n⚠️`
                    ).catch(err => console.log(err))
            }
            else {
                bot.sendMessage(chatId, 
                    `[❌] خطایی غیر منتظره رخ داد، لطفا با ادمین ارتباط بگیرید و این متن رو ارسال کنید.

                    Unique=> ${unique_id}
                    userid=> ${user_id}
                    Status=> ${res.status}
                    
                    با تشکر🌹`
                    ).catch(err => console.log(err))
            }
        })
}

module.exports = {
    make_transaction: make_transaction,
    get_inquiry: get_inquiry,
    validate_subscription: validate_subscription,
    verify_payment: verify_payment,
}