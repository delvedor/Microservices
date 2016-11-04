'use strict'

const zmq = require('zmq')
const address = require('network-address')
const bonjour = require('bonjour')()
const services = [ 'sum', 'mult', 'concat', 'client' ]
const baseswim = require('baseswim')
const id = `${require('network-address')()}:4060`
let built = false

const service = bonjour.publish({
  name: 'concat',
  type: 'http',
  port: 4060
})

bonjour.find({ type: 'http' }, service => {
  if (!built && services.indexOf(service.name) > -1) {
    console.log(`Found a peer: ${service.referer.address}:${service.port}`)
    buildSwim(`${service.referer.address}:${service.port}`)
  }
})

setTimeout(() => {
  if (!built) {
    console.log('No peer found')
    buildSwim()
  }
}, 500)

function buildSwim (address) {
  built = true
  const swim = baseswim(id, {
    local: {
      meta: 'concat'
    },
    base: address ? [ address ] : []
  })

  swim.on('peerUp', peer => {
    console.log(swim.members())
    console.log()
  })
  swim.on('peerDown', peer => {
    console.log(swim.members())
    console.log()
  })

  process.on('SIGINT', () => {
    swim.leave()
    service.stop()
    receiver.close()
    sender.close()
    process.exit()
  })
}

const receiver = zmq.socket('pull')
const sender = zmq.socket('push')

receiver.bindSync(`tcp://${address()}:4060`)
sender.bindSync(`tcp://${address()}:4061`)

receiver.on('message', msg => {
  msg = JSON.parse(msg.toString())
  console.log(msg)
  const response = {
    x: msg.x,
    y: msg.y,
    result: msg.x + msg.y,
    id: msg.id
  }
  sender.send(JSON.stringify(response))
})
