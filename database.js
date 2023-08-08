const sqlite3 = require('sqlite3').verbose()
const plans = require('./data/plans.json')
const db = new sqlite3.Database('./nelody.sqlite3', sqlite3.OPEN_READWRITE , err => {
    if (err)
        return console.error(err.message)
    console.log("[Database] > Connected to SQLite Database")
})

function getAllUsers() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM users`, (err, users) => {
            if (err) reject(err)
            resolve(users)
        })
    })
}

function getAllPayments() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM payments`, (err, payments) => {
            if (err) reject(err)
            resolve(payments)
        })
    })
}

function getUser(userID) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE user_id = ?`, userID, (err, user) => {
            if (err) reject(err)
            resolve(user)
        })
    })
}

function getPayment(order_id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM payments WHERE order_id = ?`, order_id, (err, payment) => {
            if (err) reject(err)
            resolve(payment)
        })
    })
}

function addUser(username, first_name, last_name, userID, chatID) {
    return new Promise((resolve, reject) => {
        if (userID == -1001749065212 || chatID == -1001749065212)
            resolve(false)
        else
            getUser(userID)
                .then(res => {
                    if (res) {
                        if (res.username != username || res.firstname != first_name || res.lastname != last_name)
                            db.run("UPDATE users SET username = ?, firstname = ?, lastname = ? WHERE user_id = ?", [username, first_name, last_name, userID], err => {
                                if (err) reject(err)
                                
                                resolve(true)
                            })
                        else
                            resolve(false)
                    }
                    else 
                        db.run("INSERT INTO users (username, firstname, lastname, user_id, chat_id) VALUES (?, ?, ?, ?, ?)", [username, first_name, last_name, userID, chatID], err => {
                            if (err) reject(err)
                            
                            resolve(true)
                        }) 
                })
                .catch(reject)
    })
}

function addPayment(user_id, order_id, unique_id, link, plan_no) {
    return new Promise((resolve, reject) => {
        getPayment(unique_id)
            .then(res => {
                if (res) {
                    resolve(false)
                }
                else 
                    db.run("INSERT INTO payments (user_id, order_id, unique_id, link, plan_no) VALUES (?, ?, ?, ?, ?)", [user_id, order_id, unique_id, link, plan_no], err => {
                        if (err) reject(err)
                        
                        resolve(true)
                    }) 
            })
            .catch(reject)
    })
}

function promoteUser(user_id, plan_no, expiry_date) {
    return  new Promise((resolve, reject) => {
        db.run(`UPDATE users SET plan = ?, plan_expiry = ? WHERE user_id = ?`, [plan_no, expiry_date, user_id], (err) => {
            if (err) reject(err)
            resolve(true)
        })
    })
}

function demote_if_expired(user_id) {
    return new Promise((resolve, reject) => {
        getUser(user_id).then(user => {
            const today = new Date()
            const user_expiry = new Date(user.plan_expiry)
            const is_expired = user_expiry < today
            if (is_expired) {
                demoteUser(user_id).then(res => {
                    if (res)
                        resolve(true)
                })
                .catch(err => reject(err))
            } else {
                resolve(false)
            }
        }).catch(err => reject(err))
    })
}

function demoteUser(user_id) {
    return new Promise((resolve, reject) => {
        getUser(user_id).then(user => {
            db.run(`UPDATE users SET plan = ?, plan_expiry = ? WHERE user_id = ?`, [0, null, user_id], (err) => {
                if (err) reject(err)
                resolve(true)
            })
        })
    })
}

function updateUserPlan(user_id, plan_no, unique_id) {
    return new Promise((resolve, reject) => {
        const months = plans[plan_no].months_count

        getUser(user_id).then(user => {
            if (user.plan !== 0) {
                const user_plan_expiry = new Date(user.plan_expiry)
                const new_plan_expiry = new Date(user_plan_expiry.setMonth(user_plan_expiry.getMonth() + months)).toString()
                db.run(`UPDATE users SET plan = ?, plan_expiry = ? WHERE user_id = ?`, [plan_no, new_plan_expiry, user_id], (err) => {
                    if (err) reject(err)
                    db.run(`UPDATE payments SET status = ? WHERE unique_id = ?`, ["finished", unique_id], (err) => {
                        if (err) reject(err)
                        resolve(true)
                    })
                })
            } else {
                const today = new Date()
                const expiry_date = new Date(today.setMonth(today.getMonth() + months)).toString()
                db.run(`UPDATE users SET plan = ?, plan_expiry = ? WHERE user_id = ?`, [plan_no, expiry_date, user_id], (err) => {
                    if (err) reject(err)
                    db.run(`UPDATE payments SET status = ? WHERE unique_id = ?`, ["finished", unique_id], (err) => {
                        if (err) reject(err)
                        resolve(true)
                    })
                })
            }
        })


    })
}

function updateAll(user_id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT \"all\" FROM users WHERE user_id = ?`, user_id, (err, user) => {
            if (err) reject(err)
            
            if (user) 
                db.run("UPDATE users SET \"all\" = ? WHERE user_id = ?", [++user.all, user_id], err => {
                    if (err) reject(err)
                    resolve()
                }) 
        })
    })
}

function updateSuccess(user_id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT success FROM users WHERE user_id = ?`, user_id, (err, user) => {
            if (err) reject(err)
            
            if (user)
                db.run("UPDATE users SET success = ? WHERE user_id = ?", [++user.success, user_id], err => {
                    if (err) reject(err)
                    resolve()
                }) 
        })
    })
}

function update_lyrics_success_count(user_id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT lyrics_success FROM users WHERE user_id = ?`, user_id, (err, user) => {
            if (err) reject(err)

            if (user)
                db.run("UPDATE users SET lyrics_success = ? WHERE user_id = ?", [++user.lyrics_success, user_id], err => {
                    if (err) reject(err)
                    resolve()
                })
        })
    })
}
function update_lyrics_all_count(user_id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT lyrics_all FROM users WHERE user_id = ?`, user_id, (err, user) => {
            if (err) reject(err)

            if (user)
                db.run("UPDATE users SET lyrics_all = ? WHERE user_id = ?", [++user.lyrics_all, user_id], err => {
                    if (err) reject(err)
                    resolve()
                })
        })
        
    })
}
function getStatus() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(id) FROM users', (err, users) => {
            if (err) reject(err)

            db.get('SELECT SUM("all") FROM users', (err, all) => {
                if (err) reject(err)

                db.get('SELECT SUM(success) FROM users', (err, success) => {
                    if (err) reject(err)

                    db.get('SELECT SUM(lyrics_success) FROM users', (err, lyrics_success) => {
                        if (err) reject(err)
                        
                        db.get('SELECT SUM(lyrics_all) FROM users', (err, lyrics_all) => {
                            if (err) reject(err)
                            
                            resolve({
                                all: all['SUM("all")'],
                                success: success['SUM(success)'],
                                lyrics_success: lyrics_success['SUM(lyrics_success)'],
                                lyrics_all: lyrics_all['SUM(lyrics_all)'],
                                users: users['COUNT(id)'],
                            })
                        })
                    })
                })
            })
        })
    })
}


function getTopTweny() {
    return new Promise(function(resolve, reject) {

        db.all('SELECT * FROM users ORDER BY success DESC LIMIT 20', (err, users) => {
            if (err) reject(err)
            if (users) resolve(users)
        })

    })
}


module.exports = {
    update_lyrics_all_count: update_lyrics_all_count,
    update_lyrics_success_count:update_lyrics_success_count,
    addUser: addUser,
    getUser: getUser,
    getAllUsers: getAllUsers,
    addPayment: addPayment,
    getPayment: getPayment,
    getAllPayments: getAllPayments,
    getStatus: getStatus,
    updateAll: updateAll,
    updateSuccess: updateSuccess,
    updateUserPlan: updateUserPlan,
    promoteUser: promoteUser,
    demoteUser: demoteUser,
    demote_if_expired: demote_if_expired,
    getTopTweny: getTopTweny,
}
