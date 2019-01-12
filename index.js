const fs = require('fs')
const {Storage} = require('@google-cloud/storage')
const request = require('request')
const projectId = 'ae-lab'

const ghPass = process.env['GITHUB_PASS']
const ghUser = process.env['GITHUB_USER']

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
    const payload = JSON.parse(req.body.payload)
    const messages = payload.commits.map(c => c.message).join('; ')
    const file = fs.createWriteStream('/tmp/cloud-function.zip')
    slack(`New Cloud Function udpate... ${messages}`).then(console.log).catch(console.error)
    request
    .get({
        url: 'https://api.github.com/repos/aeud/gh-cf-link/zipball',
        headers: {
            'User-Agent': 'Awesome user agent',
        },
        followAllRedirects: true,
        auth: {
            user: ghUser,
            pass: ghPass
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

