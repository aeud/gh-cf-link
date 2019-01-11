const async = require('async')

exports.helloWorld = (req, res) => {
    console.log(JSON.parse(req.body.payload))
    async.parallel([callback => {
        callback(null, 1)
    }], (_, resp) => {
        res.json(resp)
    })
}

