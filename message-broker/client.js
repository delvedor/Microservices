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

const amqp = require('amqplib/callback_api')
let id = 0

function publisher (conn) {
  const sumQueue = 'to-sum'
  const multQueue = 'to-mult'

  conn.createChannel((err, channel) => {
    if (err) {
      console.log(err)
      conn.close()
      process.exit(1)
    }
    channel.assertQueue(sumQueue)
    channel.assertQueue(multQueue)

    // send to sum queue
    setInterval(() => {
      channel.sendToQueue(sumQueue, new Buffer(JSON.stringify({
        x: getRandomInt(0, 100),
        y: getRandomInt(0, 100),
        id: id++
      })))
    }, getRandomInt(0, 1000))

    // send to mult queue
    setInterval(() => {
      channel.sendToQueue(multQueue, new Buffer(JSON.stringify({
        x: getRandomInt(0, 100),
        y: getRandomInt(0, 100),
        id: id++
      })))
    }, getRandomInt(0, 1000))
  })
}

function consumer (conn) {
  // sum queue
  conn.createChannel((err, channel) => {
    const consumeQueue = 'sum'
    const publishQueue = 'to-concat'

    if (err) {
      console.log(err)
      conn.close()
      process.exit(1)
    }
    channel.assertQueue(consumeQueue)
    channel.assertQueue(publishQueue)
    channel.consume(consumeQueue, msg => {
      if (!msg) return
      const message = JSON.parse(msg.content.toString())

      const compose = {
        x: 'The sum result is: ',
        y: message.result,
        id: id++
      }
      channel.sendToQueue(publishQueue, new Buffer(JSON.stringify(compose)))
      channel.ack(msg)
    })
  })

  // mult queue
  conn.createChannel((err, channel) => {
    const consumeQueue = 'mult'
    const publishQueue = 'to-concat'

    if (err) {
      console.log(err)
      conn.close()
      process.exit(1)
    }

    channel.assertQueue(consumeQueue)
    channel.assertQueue(publishQueue)
    channel.consume(consumeQueue, msg => {
      if (!msg) return
      const message = JSON.parse(msg.content.toString())

      const compose = {
        x: 'The mult result is: ',
        y: message.result,
        id: id++
      }
      channel.sendToQueue(publishQueue, new Buffer(JSON.stringify(compose)))
      channel.ack(msg)
    })
  })

  // concat queue
  conn.createChannel((err, channel) => {
    const consumeQueue = 'concat'

    if (err) {
      console.log(err)
      conn.close()
      process.exit(1)
    }

    channel.assertQueue(consumeQueue)
    channel.consume(consumeQueue, msg => {
      if (!msg) return
      const message = JSON.parse(msg.content.toString())
      console.log(message)
      channel.ack(msg)
    })
  })
}

amqp.connect('amqp://localhost', (err, conn) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  consumer(conn)
  publisher(conn)
})

function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}
