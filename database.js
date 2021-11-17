const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./data.sqlite3', sqlite3.OPEN_READWRITE , err => {
    if (err)
        return console.error(err.message)
    console.log("[Database] > Connected to SQLite Database")
})

function getUser(userID) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE userID = ?`, userID, (err, user) => {
            if (err) reject('Failed query the user')
            !user ? resolve(false) : resolve(true)  
        })
    })
}

function addUser(username, first_name, userID, chatID) {
    return new Promise((resolve, reject) => {
        getUser(userID)
            .then(res => {
                if (res) 
                    resolve(false)
                else 
                    db.run("INSERT INTO users (username, firstname, user_id, chat_id) VALUES (?, ?, ?, ?)", [username, first_name, userID, chatID], err => {
                        if (err) reject('Failed to insert new user to database')
                        
                        resolve(true)
                    }) 
            })
            .catch(console.log)
    })
}

module.exports = {
    addUser: addUser,
    getUser: getUser
}