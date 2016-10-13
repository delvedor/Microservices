const request = require('request')

function getService (name, callback) {
  request({
    method: 'GET',
    uri: `http://localhost:8000/service`,
    qs: {
      service: name
    }
  }, (err, response, body) => {
    if (err && err.code === 'ECONNREFUSED') {
      err = {
        message: 'I cannot reach the registry',
        service: name
      }
    }
    callback(err, body ? JSON.parse(body) : null)
  })
}

module.exports = { getService }
