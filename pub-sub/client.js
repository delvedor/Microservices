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

let id = 0

subscriber.on('message', (channel, message) => {
  if (channel === 'sum' || channel === 'mult') {
    concat(channel, JSON.parse(message))
  } else if (channel === 'concat') {
    console.log(JSON.parse(message))
  } else {
    console.log('Unhandled channel:', channel)
  }
})

subscriber.subscribe('sum')
subscriber.subscribe('mult')
subscriber.subscribe('concat')

setInterval(() => {
  publisher.publish('to-sum', JSON.stringify({
    x: getRandomInt(0, 100),
    y: getRandomInt(0, 100),
    id: id++
  }))
}, getRandomInt(0, 1000))

setInterval(() => {
  publisher.publish('to-mult', JSON.stringify({
    x: getRandomInt(0, 100),
    y: getRandomInt(0, 100),
    id: id++
  }))
}, getRandomInt(0, 1000))

function concat (channel, msg) {
  const compose = {
    x: `The ${channel} result is: `,
    y: msg.result,
    id: msg.id
  }
  publisher.publish('to-concat', JSON.stringify(compose))
}

function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

function handleConnect () {
  console.log('Connected to Redis')
}

function handleError (err) {
  console.log(err)
}
