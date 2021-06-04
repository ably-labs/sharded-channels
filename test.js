var channelShard = require('./index');
require('dotenv').config();

let namespace = 'test';
let shards = 20;

let messageID = 0;

let testChannelShard = channelShard(process.env.ABLY_OPTIONS, namespace, shards);

// Subscribe to any messages which come through on any of the shards
testChannelShard.subscribe(function(msg) {
  console.log(msg.data);
});

// Publish a message ever 2ms across the shards
let publishInterval = setInterval(() => {
  let tmpID = messageID;
  messageID++;
  testChannelShard.publish('name', `${tmpID}`, (err) => {
    if (err) {
      console.log(`${tmpID} publish err: ${err}`);
    }
  });
}, 2);

// Stop publishing messages, and use history to retrieve all the messages we've sent
setTimeout(() => {
  clearInterval(publishInterval);
  console.log("Stopped publishing after 5 seconds");
  testChannelShard.history({}, (err, history) => {
    if (err) {
      console.log(err);
    } else {
      console.log(history[0]);
    }
  });
}, 5000);

