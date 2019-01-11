const async = require('async')
const fs = require('fs')
const {Storage} = require('@google-cloud/storage')
const projectId = 'ae-lab'

const storage = new Storage({
    projectId: projectId,
})

const bucketName = 'gh-cf-link'

exports.helloWorld = (req, res) => {
    console.log(JSON.parse(req.body.payload))
    fs.writeFileSync('/tmp/test.txt', req.body.payload)
    storage.bucket(bucketName).upload('/tmp/test.txt', {}).then(() => {
        async.parallel([callback => {
            callback(null, 1)
        }], (_, resp) => {
            res.json(resp)
        })
    })

    
}

