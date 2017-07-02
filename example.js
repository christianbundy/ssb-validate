var pull = require('pull-stream')
var assert = require('assert')

var v = require('./')
var state = {
  queue: [],
  feeds: {},
  error: null
}

var c = 0, e = 0, start = Date.now(), l = 0
var ts, _ts
require('ssb-client')(function (err, sbot) {
  if(err) throw err
  _ts = Date.now()
  console.log('seconds, errors, messages, messages/second')
  pull(
    sbot.createLogStream({limit: 10000}),
    pull.drain(function (msg) {
      state = v.queue(state, msg.value)
      assert.ok(state.feeds[msg.value.author].queue.length)
      if(state.error) {
        e++
        var err = state.error
        state.error = null
        console.log(err.message)
        return false
      }
      if(Math.random() < 0.01) {
//        state = v.verify(state, msg.value.author)
      }

      state.queue.shift()
      var s = (((ts = Date.now()) - start)/1000)
      c++
//      if(!(c++%100)) {
      if(ts > _ts + 1000) {
        console.log(s, e, c, c / s)
        _ts = ts
      }
      return true
    }, function () {
      var start = Date.now()
      var n = 0
      for(var k in state.feeds) {
        if(state.feeds[k].queue.length) {
          n++
          state = v.verify(state, k)
          assert.equal(state.feeds[k].queue.length, 0)
        }
      }
        console.log('finishing up:', Date.now() - start, n)
        sbot.close()
    })
  )
})








