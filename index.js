const fs = require('fs')
const {Storage} = require('@google-cloud/storage')
const request = require('request')
const childProcess = require(`child_process`)
const unzip = require('unzip')
const archiver = require('archiver')

const projectId = process.env['GCP_PROJECT_ID']
const bucketName = process.env['GCP_BUCKET_NAME']
const ghPass = process.env['GITHUB_PASS']
const ghUser = process.env['GITHUB_USER']
const entrypoint = 'helloWorld'
const functionName = 'gh-cf-link'

const storage = new Storage({
    projectId: projectId,
})

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
        const dir = fs.readdirSync('/tmp/extraction')[0]
        const archive = archiver('zip')
        const archiveName = `${dir}.zip`
        const archivePath = `/tmp/${archiveName}`
        const archiveOutput = fs.createWriteStream(archivePath)
        archiveOutput.on('close', () => {
            slack('Push the Cloud Function archive to Google Cloud Storage').then(console.log).catch(console.error)
            storage.bucket(bucketName).upload(archivePath, {}).then(() => {
                slack('Updating the Cloud Function').then(console.log).catch(console.error)
                const sourceRef = `gs://${bucketName}/${archiveName}`
                // const execCommand = `gcloud beta functions deploy ${functionName} --entry-point ${entrypoint} --source=${sourceRef} --project=${projectId}`
                const execCommand = `locate gcloud`
                console.log(`executing: ${execCommand}`)
                const s = childProcess.execSync(execCommand).toString()
                console.log(s)
                slack('Done').then(console.log).catch(console.error)
                slack(s).then(console.log).catch(console.error)
                res.json(true)
            }).catch(console.error)
        })
        archive.on('error', console.error)
        archive.pipe(archiveOutput)

        fs.readdirSync(`/tmp/extraction/${dir}`).forEach(filename => {
            archive.append(fs.createReadStream(`/tmp/extraction/${dir}/${filename}`), { name: filename })
        })
        archive.finalize()
    })
    .pipe(unzip.Extract({ path: '/tmp/extraction' }))
}

