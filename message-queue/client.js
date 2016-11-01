/* Workflow:
 * 1) the client connects to the message broker specifying what queue interests him.
 * 2) the client sends the request through the socket to the services and wait for the answers.
 * 3) the message broker will handle all the communication and all the network latency problems.
 *
 * The client/services does not know where are the other services,
 * they only need to know where is the Message broker, who will handle the communication.
 *
 *     ------------      ------------      -------------
 *     |          | ---> |          | ---> |           |
 *     |  Client  |      |  Broker  |      |  Service  |
 *     |          | <--- |          | <--- |           |
 *     ------------      ------------      -------------
 */

'use strict'

const zmq = require('zmq')

const sumPush = zmq.socket('push')
const sumPull = zmq.socket('pull')
const multPush = zmq.socket('push')
const multPull = zmq.socket('pull')
const concatPush = zmq.socket('push')
const concatPull = zmq.socket('pull')

sumPull.connect('tcp://127.0.0.1:4041')
sumPush.connect('tcp://127.0.0.1:4040')
multPull.connect('tcp://127.0.0.1:4041')
multPush.connect('tcp://127.0.0.1:4040')
concatPull.connect('tcp://127.0.0.1:4061')
concatPush.connect('tcp://127.0.0.1:4060')

let id = 0

// Send request to services
setInterval(() => {
  sumPush.send(JSON.stringify({
    x: getRandomInt(0, 100),
    y: getRandomInt(0, 100),
    id: id++
  }))
}, getRandomInt(0, 1000))

setInterval(() => {
  multPush.send(JSON.stringify({
    x: getRandomInt(0, 100),
    y: getRandomInt(0, 100),
    id: id++
  }))
}, getRandomInt(0, 1000))

// wait for the answer
sumPull.on('message', msg => {
  msg = JSON.parse(msg.toString())
  const compose = {
    x: 'The sum result is: ',
    y: msg.result,
    id: id
  }
  concatPush.send(JSON.stringify(compose))
})

multPull.on('message', msg => {
  msg = JSON.parse(msg.toString())
  const compose = {
    x: 'The mult result is: ',
    y: msg.result,
    id: id
  }
  concatPush.send(JSON.stringify(compose))
})

concatPull.on('message', msg => {
  console.log(msg.toString())
})

function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

process.on('SIGINT', () => {
  sumPush.close()
  sumPull.close()
  multPush.close()
  multPull.close()
  concatPush.close()
  concatPull.close()
  process.exit()
})
