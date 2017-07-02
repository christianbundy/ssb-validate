var assert = require('assert')
var ssbKeys = require('ssb-keys')
var timestamp = require('monotonic-timestamp')
var v = require('./')

var keys = []

var F = 100, M = 1000

for(var i = 0; i < F; i++)
  keys.push(ssbKeys.generate())

var state = {
  queue: [],
  feeds: {}
}

var start = Date.now()
var writing = []

for(var i = 0; i < M; i++) {
  var r = Math.random()
  var key = keys[~~(r*keys.length)] //random key
  state = v.append(
    state,
    v.create(
      key, null,
      state.feeds[key.id],
      {type: 'test', i: i, random: r},
      timestamp()
    )
  )
  if(state.error)
    throw state.error
}

console.log('created '+M+' messages on '+F+' feeds, in:', Date.now() - start)

assert.equal(state.queue.length, M)

var input = state.queue.slice()

var state2 = {
  queue: [],
  feeds: {}
}

var start2 = Date.now()

for(var i = 0; i < input.length; i++)
  state2 = v.queue(state2, input[i])
for(var k in state2.feeds)
  state2 = v.verify(state2, k)

console.log('verified '+M+' messages on '+F+' feeds, in:', Date.now() - start2)


var state3 = {
  queue: [],
  feeds: {}
}

var start3 = Date.now()
for(var i = 0; i < input.length; i++) {
  var msg = input[i]
  state3 = v.queue(state3, msg)
  if(Math.random() < 1/30)
  state3 = v.verify(state3, msg.author)
}
for(var k in state3.feeds)
  if(state3.feeds[k].queue.length)
    state3 = v.verify(state3, k)
console.log('verified '+M+' messages on '+F+' feeds, in:', Date.now() - start2)



