var ref = require('ssb-ref')
var ssbKeys = require('ssb-keys')


exports.id = function (msg) {
  return '%'+ssbKeys.hash(JSON.stringify(msg, null, 2))
}

exports.checkInvalidCheap = function (state, msg) {
  //the message is just invalid
  if(!ref.isFeedId(msg.author))
    return new Error('invalid message: must have author')

  //state is id, sequence, timestamp
  if(state) {
    var isQueued = !!state.queue.length
    var last = isQueued ? state.queue[state.queue.length - 1] : state
    //the message is possibly a fork, but only if the signature is valid.
    if(msg.sequence != last.sequence + 1)
      return new Error('invalid message: expected sequence ' + (state.sequence + 1) + ' but got:'+ msg.sequence + 'in state:'+JSON.stringify(state))
    if(msg.timestamp <= last.timestamp)
      return new Error('invalid message: timestamp not increasing')
    if(msg.previous != (isQueued ? exports.id(last) : state.id))
      return new Error('invalid message: expected different previous message')
    //and check type, and length, and some other stuff. finaly check the signature.
  }
  else {
    if(msg.previous !== null)
      return new Error('initial message must have previous: null')
    if(msg.sequence !== 1)
      return new Error('initial message must have sequence: 1')
    if('number' !== typeof msg.timestamp)
      return new Error('initial message must have timestamp')
  }

  return false //not invalid
}

exports.checkInvalidSignature = function (state, msg) {
  if(!ssbKeys.verifyObj({public: msg.author.substring(1)}, msg))
    return new Error('invalid signature')

  return false
}

exports.checkInvalid = function (state, msg) {
  return exports.checkInvalidCheap(state, msg) || exports.checkInvalidSignature(state, msg)
}

/*
{
  //an array of messages which have been validated, but not written to the database yet.
  valid: [],
  //a map of information needed to know if something should be appeneded to the valid queue.
  feeds: {
    <feed>: {id, sequence, ts}
  },
  error: null
}
*/

exports.verify = function (state, feed) {
  var _state = state.feeds[feed]
  var msg = _state.queue[_state.queue.length - 1]
  if(state.error = exports.checkInvalidSignature(_state, msg))
    return state

  while(_state.queue.length) {
    state.queue.push(_state.queue.shift())
  }
  _state.id = exports.id(msg)
  _state.timestamp = msg.timestamp
  _state.sequence = msg.sequence

  return state
}

exports.append = function (state, msg) {
  if(state.error = exports.checkInvalid(state.feeds[msg.author], msg)) {
    return state
  }

  if(state.feeds[msg.author]) {
    var a = state.feeds[msg.author]
    a.id = exports.id(msg)
    a.sequence = msg.sequence
    a.timestamp = msg.timestamp
  }
  else
    state.feeds[msg.author] = {id: exports.id(msg), sequence: msg.sequence, timestamp: msg.timestamp, queue: []}
  state.queue.push(msg)
  return state
}

exports.queue = function (state, msg) {
  if(state.error = exports.checkInvalidCheap(state.feeds[msg.author], msg))
    return state
  if(state.feeds[msg.author]) {
    state.feeds[msg.author].queue.push(msg)
  }
  else
    state.feeds[msg.author] = {id: null, sequence: null, timestamp: null, queue: [msg]}
  return state
}

//pass in your own timestamp, so it's completely deterministic
exports.create = function (keys, hmac_key, state, content, timestamp) {
  var last = state && state.queue.length && state.queue[state.queue.length-1]
  //: state
  return ssbKeys.signObj(keys, hmac_key, {
    previous: state ? last ? exports.id(last) : state.id : null,
    sequence: state ? last ? last.sequence + 1 : state.sequence + 1 : 1,
    author: keys.id,
    timestamp: timestamp,
    hash: 'sha256',
    content: content,
  })
}

