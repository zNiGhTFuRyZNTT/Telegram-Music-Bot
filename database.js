const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./nelody.sqlite3', sqlite3.OPEN_READWRITE , err => {
    if (err)
        return console.error(err.message)
    console.log("[Database] > Connected to SQLite Database")
})

function getUser(userID) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE user_id = ?`, userID, (err, user) => {
            if (err) reject(err)
            !user ? resolve(false) : resolve(true)  
        })
    })
}

function addUser(username, first_name, last_name, userID, chatID) {
    return new Promise((resolve, reject) => {
        getUser(userID)
            .then(res => {
                if (res) 
                    resolve(false)
                else 
                    db.run("INSERT INTO users (username, firstname, lastname, user_id, chat_id) VALUES (?, ?, ?, ?, ?)", [username, first_name, last_name, userID, chatID], err => {
                        if (err) reject(err)
                        
                        resolve(true)
                    }) 
            })
            .catch(reject)
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

function getStatus() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(id) FROM users', (err, users) => {
            if (err) reject(err)

            db.get('SELECT SUM("all") FROM users', (err, all) => {
                if (err) reject(err)

                db.get('SELECT SUM(success) FROM users', (err, success) => {
                    if (err) reject(err)
                    
                    resolve({
                        all: all['SUM("all")'],
                        success: success['SUM(success)'],
                        users: users['COUNT(id)'],
                    })
                })
            })
        })
    })
}

module.exports = {
    addUser: addUser,
    getUser: getUser,
    getStatus: getStatus,
    updateAll: updateAll,
    updateSuccess: updateSuccess
}