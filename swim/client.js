'use strict'

const zmq = require('zmq')
const bonjour = require('bonjour')()
const services = [ 'sum', 'mult', 'concat', 'client' ]
const baseswim = require('baseswim')
const id = `${require('network-address')()}:4000`
let built = false

const availableServices = {
  sum: false,
  mult: false,
  concat: false
}

const service = bonjour.publish({
  name: 'client',
  type: 'http',
  port: 4000
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
      meta: 'client'
    },
    base: address ? [ address ] : []
  })

  const sumPush = zmq.socket('push')
  const sumPull = zmq.socket('pull')
  const multPush = zmq.socket('push')
  const multPull = zmq.socket('pull')
  const concatPush = zmq.socket('push')
  const concatPull = zmq.socket('pull')

  swim.on('peerUp', peer => {
    const url = peer.host.split(':')
    switch (peer.meta) {
      case 'sum':
        sumPush.connect(`tcp://${url[0]}:4040`)
        sumPull.connect(`tcp://${url[0]}:4041`)
        availableServices.sum = true
        break
      case 'mult':
        multPush.connect(`tcp://${url[0]}:4050`)
        multPull.connect(`tcp://${url[0]}:4051`)
        availableServices.mult = true
        break
      case 'concat':
        concatPush.connect(`tcp://${url[0]}:4060`)
        concatPull.connect(`tcp://${url[0]}:4061`)
        availableServices.concat = true
        break
    }
  })
  swim.on('peerDown', peer => {
    switch (peer.meta) {
      case 'sum':
        availableServices.sum = false
        break
      case 'mult':
        availableServices.mult = false
        break
      case 'concat':
        availableServices.concat = false
        break
    }
  })

  process.on('SIGINT', () => {
    swim.leave()
    service.stop()
    sumPush.close()
    sumPull.close()
    multPush.close()
    multPull.close()
    concatPush.close()
    concatPull.close()
    process.exit()
  })

  let msgId = 0

  // Send request to services
  setInterval(() => {
    if (!built) return
    if (availableServices.sum) {
      sumPush.send(JSON.stringify({
        x: getRandomInt(0, 100),
        y: getRandomInt(0, 100),
        id: msgId++
      }))
    } else if (availableServices.concat) {
      concatPush.send(JSON.stringify({
        x: 'Sum service is not available',
        y: '',
        id: msgId++
      }))
    } else {
      console.log('Sum and concat services are not available')
    }
  }, getRandomInt(0, 1000))

  setInterval(() => {
    if (!built) return
    if (availableServices.mult) {
      multPush.send(JSON.stringify({
        x: getRandomInt(0, 100),
        y: getRandomInt(0, 100),
        id: msgId++
      }))
    } else if (availableServices.concat) {
      concatPush.send(JSON.stringify({
        x: 'Mult service is not available',
        y: '',
        id: msgId++
      }))
    } else {
      console.log('Mult and concat services are not available')
    }
  }, getRandomInt(0, 1000))

  // wait for the answer
  sumPull.on('message', msg => {
    msg = JSON.parse(msg.toString())
    const compose = {
      x: 'The sum result is: ',
      y: msg.result,
      id: msgId++
    }
    if (availableServices.concat) {
      concatPush.send(JSON.stringify(compose))
    } else {
      console.log('Concat service not available')
    }
  })

  multPull.on('message', msg => {
    msg = JSON.parse(msg.toString())
    const compose = {
      x: 'The mult result is: ',
      y: msg.result,
      id: msgId++
    }
    if (availableServices.concat) {
      concatPush.send(JSON.stringify(compose))
    } else {
      console.log('Concat service not available')
    }
  })

  concatPull.on('message', msg => {
    console.log(msg.toString())
  })
}

function getRandomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}
