const index = require('./index')
index.helloWorld({
    body: {
        payload: '{}'
    }
}, {
    json: console.log
});