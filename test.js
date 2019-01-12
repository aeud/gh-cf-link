require('dotenv').config()
const index = require('./index')
index.helloWorld({
    body: {
        payload: JSON.stringify({
            commits: [
                {
                    message: 'this is a test!'
                }
            ]
        })
    }
}, {
    json: console.log
});