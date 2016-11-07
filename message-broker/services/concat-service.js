'use strict'

const amqp = require('amqplib/callback_api')
const consumeQueue = 'to-concat'
const publishQueue = 'concat'

function handler (conn) {
  conn.createChannel((err, channel) => {
    if (err) {
      console.log(err)
      conn.close()
      process.exit(1)
    }
    console.log('Concat service up and running!')

    channel.assertQueue(consumeQueue)
    channel.assertQueue(publishQueue)
    channel.consume(consumeQueue, msg => {
      if (!msg) return
      const message = JSON.parse(msg.content.toString())
      console.log(message)

      const result = {
        x: message.x,
        y: message.y,
        text: message.x + message.y,
        id: message.id
      }
      channel.sendToQueue(publishQueue, new Buffer(JSON.stringify(result)))
      channel.ack(msg)
    })
  })
}

amqp.connect('amqp://localhost', (err, conn) => {
  if (err) {
    console.log(err)
    if (conn) conn.close()
    process.exit(1)
  }
  handler(conn)
})
