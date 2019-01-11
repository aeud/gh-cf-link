const fs = require('fs')
const {Storage} = require('@google-cloud/storage')
const request = require('request')
const projectId = 'ae-lab'

const storage = new Storage({
    projectId: projectId,
})

const bucketName = 'gh-cf-link'

const slack = (text, payload) => (new Promise((res, rej) => {
    const endpoint = process.env['SLACK_ENDPOINT']
    payload = payload || {}
    payload.text = text
    request.post(endpoint, {
    json: payload
    }, err => {
        if (err) {
            rej(err)
        } else {
            res(payload.text)
        }
    })
}))

exports.helloWorld = (req, res) => {
    console.log(JSON.parse(req.body.payload))
    const file = fs.createWriteStream('/tmp/cloud-function.zip')
    slack('New Cloud Function udpate...').then(console.log).catch(console.error)
    request
    .get({
        url: 'https://api.github.com/repos/LVMH-DIGITAL-DATA/central-process-oos/zipball',
        headers: {
            'User-Agent': 'My app',
        },
        followAllRedirects: true,
        auth: {
            user: 'aeud',
            pass: '9b18e1cd9a1fff69d85da6d4e35ae0095c5416fe'
        }
    })
    .on('end', () => {
        slack('Push the Cloud Function to Google Cloud Storage').then(console.log).catch(console.error)
        storage.bucket(bucketName).upload('/tmp/cloud-function.zip', {}).then(() => {
            slack('Done').then(console.log).catch(console.error)
            res.json(true)
        }).catch(console.error)
    })
    .pipe(file)
}

