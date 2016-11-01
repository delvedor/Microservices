'use strict'

const zmq = require('zmq')

const receiver = zmq.socket('pull')
const sender = zmq.socket('push')

receiver.bindSync('tcp://127.0.0.1:4050')
sender.bindSync('tcp://127.0.0.1:4051')

receiver.on('message', msg => {
  msg = JSON.parse(msg.toString())
  console.log(msg)
  const response = {
    x: msg.x,
    y: msg.y,
    result: msg.x * msg.y,
    id: msg.id
  }
  sender.send(JSON.stringify(response))
})

process.on('SIGINT', () => {
  receiver.close()
  sender.close()
  process.exit()
})
