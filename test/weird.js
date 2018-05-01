var v = require('..')
var createFeed = require('ssb-feed/validator')

var invalid = {
  "previous": "%opn96peLQb+rmwOencGZf+4JrlyQrqFPHPlKW8KvBsA=.sha256",
  "sequence": 3447,
  "author": "@6CAxOI3f+LUOVrbAl0IemqiS7ATpQvr9Mdw9LC4+Uv0=.ed25519",
  "timestamp": 1525114200284,
  "hash": "sha256",
  "content": "Lk2gANAtOUJEbjNwY9q4hmV5c5OeErAxpQ4y3Jdbopg8tVC4zJj4WiQSpHDtvqTtJ2gZgy7HWkdbS2XQ8Df8nyYGXdvX4Od5OAXUslIIpPpwGBBw6uCWCi3DIqrjf3MrEUFd86iFupMG1Hnk+F2i0H89dAPtsvgujx/s7maIysH5bU0XuhFyTrfkbUz8CW+29UDEJ1rljk0Yb+wEQ9xfEBuZDMCU5deqSq1R5c7X8ivLowpFP60WXasNEWmXv2P2I7HG8SOlMsV6Cr2odfXuRJU0ZicYjTFR8MPnCRdla3bm75FNJwkclsJTFMYwAYylgjewwRoMvBPTRhjE+7QTGALau+Yfzo5dGCrFUGIM6lKq2RG5+8qOdsXQTbX/MVXZOzoGsEfKLG0+GgbEU8358hHn+4kxS3WzqdB20O3MakXQVXMkjLkHsEB/ilrtLBWDsGmU1kW+9Ep8IFTrvclERUTZonw2ZalNVmU0sR+5tQic/YS0vSdif+fH7Yoos/IWshWehl+bKEwJGcWWfUCQdcVwQTyvnac9Q9lXHsTDf9WaFcCkm4aoKeBlCTkXzmnw2C6DfWDfg+tIqKw07bCXCBdhk3Of+k9YgC5ZHuWBkU0TsO660gV1GKGuNhXa4Tr7D4eNUEGUTXbx9nkSaAWQweGv6DwkiKvjzEFQNXRC2i9L//PsAerK0awUSoLDQR1hab74N6YX+fRxly/0GZ6dUMzHXfpdFDBmqcfJdWW+mpQ8NmkIz/7O2U7jWBhA77XeVyNteabcJwgm2DhQ0CMYOXBjgIVWitX1PzcUsdm38yMvQNcKpLYobVi5CGNfv5Q9jNDAKhzH5TB7rxLUua/n9WK/PzdcX42o8qjvaM64e2zfEAUgdm2wRYcFySUqltjOfZ7y+MNltenM9Y6qPCU1xDlk9lAQpfl95hVGmWmFyoB4Rwn+oq+rKzYDYKhXV5SVPnfdC/zPZUFK14yYyqmCx4S9EsB7Zkv0D0acsg2P8qxjlCms0oTfEZHjWJGaQpFt8W7ctcd+BJZYT4CO4pAMviHBq6q++xLcL8/nMGL9tXr4mhJ4iXL4ae2ncpoDn7q1qyzJSTCm9xoa50fA3iW3owjB31fd+DcYfF6FVn1n1PRhyi/CyZ6Iadt7XUSSgEHIZD9FVc2fhTUMoYb/9eF5lqLzqOA=.box",
  "signature": "xqbBF3kUenOXzrCROUle+4miwopyJwhk6RXFx+msyizEFhPgMnBQzh62162kLi8j938tt2pf9Zi6MgAcQQnEAg==.sig.ed25519"
}

var valid = {
  "key": "%opn96peLQb+rmwOencGZf+4JrlyQrqFPHPlKW8KvBsA=.sha256",
  "value": {
    "previous": "%K7Q3kOcv/Z3nLM3jsu+mAqtCMDjGWj1wie9O8EdgvZs=.sha256",
    "sequence": 3446,
    "author": "@6CAxOI3f+LUOVrbAl0IemqiS7ATpQvr9Mdw9LC4+Uv0=.ed25519",
    "timestamp": 1525103880932,
    "hash": "sha256",
    "content": {
      "type": "contact",
      "contact": "@MD3RNVfbta1lIVyNWVzHyIazPgFb+1ZAWQ7qzQeU0y4=.ed25519",
      "following": true
    },
    "signature": "o+aAuQ2lZdOqRwSh7RCjxOrSErwNKQNRmvBosZ5QanOfy6bfTbJhltEaHZX4RZxGeaIaTVf25mRFJIp5ezuyBg==.sig.ed25519"
  },
  "timestamp": 1525104904813
}

var state = {
  feeds: {}, queue: []
}

state.feeds[invalid.author] = {
  id: invalid.previous,
  timestamp: 1525103880932,
  sequence: 3446,
  queue: []
}

//this throws (as expected)
//v.append(state, null, invalid)

//this also throws.
var f = createFeed({
  getLatest: function (id, cb) {
    console.log('GETLATEST', id)
    cb(null, valid)
  },
  add: function (msg) {
    console.log(msg)
  },
  batch: function (ary, cb) {
    console.log(ary)
  }
}, invalid.author)

f(invalid, function (err) {
  if(err) throw err
})
