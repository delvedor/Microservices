/* Workflow:
 * 1) the client want to do an operation, say 'sum'
 * 2) the client call the wanted operation via 'operation'
 * 3) operation queries the registry via getService
 * 4) getService gets the response from the registry
 * 5) if the service is online, operation consume its api
 *    if the service if offline operation returns an error
 * 6) the client gets in every case a result
 */

'use strict'
const request = require('request')
const { getService } = require('./services/common')

function operation (name, x, y, callback) {
  getService(name, (err, service) => {
    if (err) return callback(err, null)
    if (!service || !service.online) {
      return callback({ status: `${name} service is offline` }, null)
    }
    request({
      method: 'GET',
      uri: `${service.uri}/${name}`,
      qs: {
        x: x,
        y: y
      }
    }, (err, response, body) => {
      callback(err, body)
    })
  })
}

function doSum (x, y) {
  operation('sum', x, y, (err, result) => {
    if (err) return console.log(err)
    console.log(result)
  })
}

function doMult (x, y) {
  operation('mult', x, y, (err, result) => {
    if (err) return console.log(err)
    console.log(result)
  })
}

doSum(10, 15)
doMult(10, 15)
