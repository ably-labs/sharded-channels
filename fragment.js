const channelShard = require('./index');

class AblyFragmenter {
  constructor(apiKey, maxRate=50, maxSize=16000) {
    this.channel = channelShard(apiKey, 'images', 100);
    this.maxRate = maxRate;
    this.msgInterval = 1000 / maxRate;
    this.maxSize = maxSize - 42;
    this.messageChunksReceived = {};
    this.messageChunksSent = {};
    this.hash = {};
  }

  subscribe(callback) {
    this.channel.subscribe((message) => {
      if (!this.messageChunksReceived[message.name]) {
        this.messageChunksReceived[message.name] = [];
      }

      this.messageChunksReceived[message.name][message.data.pos] = message.data.data;

      console.log("--")
      console.log(Object.keys(this.messageChunksReceived[message.name]).length);
      console.log(message.data.pos);
      if (message.data.total == Object.keys(this.messageChunksReceived[message.name]).length) {
        let msg = this.messageChunksReceived[message.name].join('');
        if (this.hashCode(msg) != message.data.hash) {
          console.log("Error: Hash did not match");
          if (callback) callback(null);
          return;
        }

        if (callback) callback(msg);
        return;
      }
    });
  }

  publish(message, callback) {
    let rnd = Math.random();
    let reg = new RegExp(".{1," + this.maxSize + "}", 'g');

    let chunks = message.match(reg);

    console.log(`Chunks to send: ${chunks.length}`)

    this.messageChunksSent[rnd] = 0;
    this.hash[rnd] = this.hashCode(message);

    for (let i = 0; i < chunks.length; i++) {
      this.sendMessages(rnd, chunks, i);
    }
    if (callback) callback(null);
  }

  sendMessages(id, data, pos) {
    this.channel.publish("id:" + id, 
      { 'pos': pos, 'data': data[pos], 'total': data.length, 'hash': this.hash[id] },
      (err) => {
      if (err) {
        console.log(err);
        this.sendMessages(id, data, pos);
      } else {
        // console.log(this.messageChunksSent[id]);
        this.messageChunksSent[id]++;
        if (this.messageChunksSent[id] == data.length) {
          this.messageChunksSent[id] = 0;
        }
      }
    })
  }

  hashCode (object) {
    var hash = 0;
    for (var i = 0; i < object.length; i++) {
        var character = object.charCodeAt(i);
        hash = ((hash<<5)-hash)+character;
        hash = hash & hash;
    }
    return hash;
  }
}
module.exports = AblyFragmenter;