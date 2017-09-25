var ref = require('ssb-ref')
var ssbKeys = require('ssb-keys')
var isHash = ref.isHash
var isFeedId = ref.isFeedId

var encode = exports.encode = function (obj) {
  return JSON.stringify(obj, null, 2)
}

exports.initial = function () {
  return {
    validated: 0,
    queued: 0,
    queue: [],
    feeds: {},
    error: null,
    waiting: []
  }
}


function isString (s) {
  return 'string' === typeof s
}

function isInteger (n) {
  return ~~n === n
}

function isObject (o) {
  return o && 'object' === typeof o
}

function isEncrypted (str) {
  return isString(str) && /^[0-9A-Za-z\/+]+={0,2}\.box/.test(str)
}

var isInvalidContent = exports.isInvalidContent = function (content) {
  if(!isEncrypted(content)) {
    var type = content.type
    if (!(isString(type) && type.length <= 52 && type.length >= 3)) {
      return new Error('type must be a string' +
        '3 <= type.length < 52, was:' + type
      )
    }
  }
  return false
}

var isInvalidShape = exports.isInvalidShape = function (msg) {
  if(
    !isObject(msg) ||
    !isInteger(msg.sequence) ||
    !isFeedId(msg.author) ||
    !(isObject(msg.content) || isEncrypted(msg.content))
  )
    return new Error('message has invalid properties:'+JSON.stringify(msg, null, 2))

  //allow encrypted messages, where content is a base64 string.

  //NOTE: since this checks the length of javascript string,
  //it's not actually the byte length! it's the number of utf8 chars
  //for latin1 it's gonna be 8k, but if you use all utf8 you can
  //approach 32k. This is a weird legacy thing, obviously, that
  //we will fix at some point...
  var asJson = encode(msg)
  if (asJson.length > 8192) // 8kb
    return new Error( 'encoded message must not be larger than 8192 bytes')

  return isInvalidContent(msg.content)
}

exports.checkInvalidCheap = function (state, msg) {
  //the message is just invalid
  if(!ref.isFeedId(msg.author))
    return new Error('invalid message: must have author')

  //state is id, sequence, timestamp
  if(state) {
    //the message is possibly a fork, but only if the signature is valid.
    if(msg.sequence != state.sequence + 1)
      return new Error('invalid message: expected sequence ' + (state.sequence + 1) + ' but got:'+ msg.sequence + 'in state:'+JSON.stringify(state))
    if(msg.timestamp <= state.ts)
      return new Error('invalid message: timestamp not increasing')
    if(msg.previous != state.id)
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
  return isInvalidShape(msg)
}

exports.checkInvalid = function (state, msg) {
  var err = exports.checkInvalidCheap(state, msg)
  if(err) return err
  if(!ssbKeys.verifyObj({public: msg.author.substring(1)}, msg))
    return new Error('invalid signature')
  return false //not invalid
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

exports.queue = function (state, msg) {
  var err
  if(state.error = exports.checkInvalidCheap(flatState(state.feeds[msg.author]), msg))
    return state
  state.feeds[msg.author] = state.feeds[msg.author] || {
    id: null, sequence: null, timestamp: null, queue: []
  }
  state.queued += 1
  state.feeds[msg.author].queue.push(msg)
  return state
}

function flatState (fstate) {
  if(!fstate) return null
  if(fstate.queue.length) {
    var last = fstate.queue[fstate.queue.length - 1]
    return {
      id: exports.id(last),
      timestamp: last.timestamp,
      sequence: last.sequence
    }
  }
  else
    return fstate
}

exports.append = function (state, msg) {
  var err
  var _state = flatState(state.feeds[msg.author])
  if(err = exports.checkInvalid(_state, msg))
    throw err

  else if(state.feeds[msg.author]) {
    var a = state.feeds[msg.author]
    a.id = exports.id(msg)
    a.sequence = msg.sequence
    a.timestamp = msg.timestamp
    var q = state.feeds[msg.author].queue
    state.validated += q.length
    state.queued -= q.length
    while(q.length)
      state.queue.push(q.shift())
  }
  else if(msg.sequence === 1) {
    state.feeds[msg.author] = {id: exports.id(msg), sequence: msg.sequence, timestamp: msg.timestamp, queue: []}
  }
  else {
    //waiting for initial state to be loaded
    state.waiting.push(msg)
  }
  state.queue.push(msg)
  state.validated += 1
  return state
}

exports.validate = function (state, feed) {
  if(!state.feeds[feed] || !state.feeds[feed].queue.length) {
    return state
  }
  var msg = state.feeds[feed].queue.pop()
  state.queued -= 1
  return exports.append(state, msg)
}

//pass in your own timestamp, so it's completely deterministic
exports.create = function (state, keys, hmac_key, content, timestamp) {
  state = flatState(state)
  return ssbKeys.signObj(keys, hmac_key, {
    previous: state ? state.id : null,
    sequence: state ? state.sequence + 1 : 1,
    author: keys.id,
    timestamp: timestamp,
    hash: 'sha256',
    content: content,
  })
}

exports.id = function (msg) {
  return '%'+ssbKeys.hash(JSON.stringify(msg, null, 2))
}

exports.appendNew = function (state, hmac_key, keys, content, timestamp) {
  var msg = exports.create(state.feeds[keys.id], keys, hmac_key, content, timestamp)
  state = exports.append(state, msg)
  return state
}

/*
//thought maybe this is needed for tests?
exports.setup = function (state, feeds) {
  for(var k in feeds)
    state.feeds[k] = feeds[k]
  var w = {}
  while(state.waiting) {
    var msg = state.waiting.shift()
    w[msg.author] = true
    state = exports.queue(state, msg)
  }
  for(var k in w)
    state = exports.validate(state, k)
  return state
}
*/












