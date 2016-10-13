/* DOCS:
 * This is the registry server,
 * it has two routes, GET:/services and POST:/services.
 *
 * GET:/services returns a service or the list of services
 * POST:/services registers a new service to the registry
 *
 * Every 5 seconds it queries every service in the registry,
 * to verify if is still online.
 *
 * The db is a simpel javascript object, structured in this way:
 * 'service-name': {
 *    name: 'service-name',
 *    uri: 'http://url:port',
 *    online: true || false
 * }
 */
'use strict'

const Hapi = require('hapi')
const Joi = require('joi')
const request = require('request')
// Registry database
const registry = {}

const server = new Hapi.Server()
server.connection({ port: 8000 })

server.route([{
  // endpoint to find data about a service
  method: 'GET',
  path: '/service',
  config: {
    validate: {
      query: {
        service: Joi.string().trim()
      }
    }
  },
  handler: function (request, reply) {
    const { service } = request.query
    const response = service ? registry[service] ? registry[service] : null : registry
    reply(response).code(service ? 200 : 404)
  }
}, {
  // endpoint where a service presents himself
  method: 'POST',
  path: '/service',
  config: {
    validate: {
      payload: {
        service: Joi.object().keys({
          name: Joi.string().trim().required(),
          uri: Joi.string().trim().uri().required(),
          online: Joi.boolean().default(true) // field added by the registry
        }).required()
      }
    }
  },
  handler: function (request, reply) {
    const { service } = request.payload
    console.log('POST /service', service)
    registry[service.name] = service
    reply('ok').code(201)
  }
}])

// heartbeat
setInterval(() => {
  Object.keys(registry).forEach(name => {
    const service = registry[name]
    request({
      method: 'GET',
      uri: `${service.uri}/status`
    }, (err, response, body) => {
      if (err) {
        registry[name].online = false
      } else {
        body = JSON.parse(body)
        if (body.status === 'ok') {
          registry[name].online = true
        }
      }
      console.log(registry)
      console.log()
    })
  })
}, 5000)

server.start(err => {
  if (err) return console.log(err)
  console.log(`Registry running at ${server.info.uri}`)
})
