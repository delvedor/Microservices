'use strict'

const redis = require('redis')
const options = {
  host: '127.0.0.1',
  port: 6379
}
const publisher = redis.createClient(options)
const subscriber = redis.createClient(options)

publisher.on('connect', handleConnect)
publisher.on('error', handleError)
subscriber.on('connect', handleConnect)
subscriber.on('error', handleError)

subscriber.on('message', (channel, message) => {
  message = JSON.parse(message)
  const response = {
    x: message.x,
    y: message.y,
    result: message.x + message.y,
    id: message.id
  }
  publisher.publish('sum', JSON.stringify(response))
})

subscriber.subscribe('to-sum')

function handleConnect () {
  console.log('Connected to Redis')
}

function handleError (err) {
  console.log(err)
}
