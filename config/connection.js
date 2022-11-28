const MongoClient = require('mongodb').MongoClient
const state = {
    db: null
}
module.exports.connect = function (done) {
    console.log(process.env.URL)
    const url = 'mongodb+srv://samrood:samru7181@cluster0.vngovfx.mongodb.net/test'
    const dbname = 'shopping'

    MongoClient.connect(url, (err, data) => {
        if (err) return done(err)
        state.db = data.db(dbname)
        done()
    })
}  
module.exports.get = function () {
    return state.db
}
