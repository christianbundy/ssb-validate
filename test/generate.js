var tape = require('tape')
var ssbKeys = require('ssb-keys')

var seed = require('crypto').createHash('sha256').update('validation-test-seed').digest()
var keys = ssbKeys.generate('ed25519', seed)

var v = require('../')

tape('simple', function (t) {

  var state = {
    queue: [],
    feeds: {}
  }

  var msg1, msg2
  var state = v.append(state, msg1 = v.create(keys, null, null, {type: 'test'}, +new Date('2017-04-11 8:08 UTC')))

  t.equal(state.feeds[keys.id].id, v.id(msg1))
  t.equal(state.queue.length, 1)
  t.deepEqual(state.queue, [msg1])
  t.deepEqual(state.feeds[keys.id].queue, [])
  msg2 = v.create(keys, null, state.feeds[keys.id], {type: 'test2'}, +new Date('2017-04-11 8:09 UTC'))
  state = v.append(state, msg2)

  t.equal(state.feeds[keys.id].id, v.id(msg2), 'id updated to msg2')
  t.equal(state.queue.length, 2)
  t.deepEqual(state.queue, [msg1, msg2])

  t.end()
})

tape('queue', function (t) {
  var state = {
    queue: [],
    feeds: {}
  }
  var msg1 = v.create(keys, null, null, {type: 'test'}, +new Date('2017-04-11 8:08 UTC'))
  state = v.queue(state, msg1)
  t.notOk(state.error)
  t.deepEqual(state.feeds[keys.id].queue, [msg1])
  t.deepEqual(state.feeds[keys.id].id, null)
  t.deepEqual(state.feeds[keys.id].timestamp, null)
  t.deepEqual(state.feeds[keys.id].sequence, null)

  var msg2 = v.create(keys, null, state.feeds[keys.id], {type: 'test2'}, +new Date('2017-04-11 8:10 UTC'))

  state = v.queue(state, msg2)
  t.notOk(state.error)

  t.deepEqual(state.feeds[keys.id].queue, [msg1, msg2])
  t.deepEqual(state.feeds[keys.id].id, null)
  t.deepEqual(state.feeds[keys.id].timestamp, null)
  t.deepEqual(state.feeds[keys.id].sequence, null)

  state = v.verify(state, keys.id)
  t.deepEqual(state.feeds[keys.id].queue, [])

  t.deepEqual(state.queue, [msg1,  msg2])

  t.deepEqual(state.feeds[keys.id].id, v.id(msg2))
  t.deepEqual(state.feeds[keys.id].timestamp, msg2.timestamp)
  t.deepEqual(state.feeds[keys.id].sequence, msg2.sequence)

  t.end()

})










