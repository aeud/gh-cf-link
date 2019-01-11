const async = require('async')

exports.helloWorld = (req, res) => {
    console.log(req.body)
    async.parallel([callback => {
        callback(null, 1)
    }], (_, resp) => {
        res.json(resp)
    })
}

