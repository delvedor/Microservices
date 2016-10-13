'use strict'

const Hapi = require('hapi')
const Joi = require('joi')
const callService = require('request')
const ok = JSON.stringify({ status: 'ok' })

const server = new Hapi.Server()
server.connection({ port: 4060 })

server.route([{
  method: 'GET',
  path: '/status',
  handler: function (request, reply) {
    reply(ok).code(200)
  }
}, {
  method: 'GET',
  path: '/concat',
  config: {
    validate: {
      query: {
        x: Joi.string().required(),
        y: Joi.string().required()
      }
    }
  },
  handler: function (request, reply) {
    const { x, y } = request.query
    reply(x.concat(y)).code(200)
  }
}])

server.start(err => {
  if (err) return console.log(err)
  console.log(`Concat service running at ${server.info.uri}`)
  callService({
    method: 'POST',
    uri: 'http://localhost:8000/service',
    json: {
      service: {
        name: 'concat',
        uri: server.info.uri
      }
    }
  }, (err, response, body) => {
    if (err) console.log(err)
  })
})
