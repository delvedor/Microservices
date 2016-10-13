'use strict'

const Hapi = require('hapi')
const Joi = require('joi')
const callService = require('request')
const { getService } = require('./common')
const ok = JSON.stringify({ status: 'ok' })

const server = new Hapi.Server()
server.connection({ port: 4050 })

server.route([{
  method: 'GET',
  path: '/status',
  handler: function (request, reply) {
    reply(ok).code(200)
  }
}, {
  method: 'GET',
  path: '/mult',
  config: {
    validate: {
      query: {
        x: Joi.number().required(),
        y: Joi.number().required()
      }
    }
  },
  handler: function (request, reply) {
    const { x, y } = request.query
    const result = {
      result: x * y,
      string: null
    }
    getService('concat', (err, service) => {
      if (err || !service.online) {
        return reply(JSON.stringify(result)).code(200)
      }
      callService({
        method: 'GET',
        uri: service.uri + '/concat',
        qs: {
          x: 'The result is: ',
          y: x * y
        }
      }, (err, response, body) => {
        if (err) {
          return reply(JSON.stringify(result)).code(200)
        }
        result.string = body
        reply(JSON.stringify(result)).code(200)
      })
    })
  }
}])

server.start(err => {
  if (err) return console.log(err)
  console.log(`Mult service running at ${server.info.uri}`)
  callService({
    method: 'POST',
    uri: 'http://localhost:8000/service',
    json: {
      service: {
        name: 'mult',
        uri: server.info.uri
      }
    }
  }, (err, response, body) => {
    if (err) console.log(err)
  })
})
