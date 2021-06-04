const Ably = require('ably');

function channelShard(options, namespace, num) {
  let shardedChannel = {};
  shardedChannel.namespace = namespace;
  shardedChannel.num = num;
  shardedChannel.conns = [];
  shardedChannel.channels = [];
  shardedChannel.currentPub = 0;
  for (let i = 0; i < num; i++) {
    // We instantiate a new connection for each channel to avoid per connection rate limits
    let ably = new Ably.Realtime(options);
    shardedChannel.conns.push(ably);
    shardedChannel.channels.push(ably.channels.get(namespace + ':' + i));
  }

  // Publish to a random shard channel. Currently uses round robin for simplicity
  shardedChannel.publish = function(name, data, callback) {
    let tmpNum = this.currentPub;
    this.currentPub = (this.currentPub + 1) % this.num;
    this.channels[tmpNum].publish(name, data, (err) => { callback(err, tmpNum) });
  };

  // Subscribe to all shard channels
  shardedChannel.subscribe = function(callback) {
    for (let i = 0; i < this.num; i++) {
      let channelName = namespace + ':' + i;
      this.channels[i].subscribe(callback); 
    }
  };

  // TODO: Add unsubscribe

  // Get the history from all shards, ordered by timestamp
  // Callback should be of form callback(err, arrayOfHistory)
  shardedChannel.history = function(options, callback) {
    getCombinedHistory(this.channels, this.num, options).then(function(results) {
      var combinedResults = [];
      for (let i = 0; i < results.length; i++) {
        combinedResults = combinedResults.concat(results[i]);
      }
      combinedResults.sort( (a, b) => {
        if (a.timestamp < b.timestamp) {
          return -1;
        }
        if (a.timestamp > b.timestamp) {
          return 1;
        }
        return 0;
      });

      callback(null, combinedResults);
    }, function(reason) {
      callback(reason, null);
    }); 
  }

  return shardedChannel;
}

// History functions
function getCombinedHistory(channels, num, options) {
  let promises = [];
  for (let i = 0; i < num; i++) {
    promises.push(new Promise(function(resolve, reject) {
      channels[i].history(options, function(err, resultPage) {
        getResultPage(err, resultPage, [], resolve, reject);
      });
    }));
  }

  return Promise.all(promises);
}

function getResultPage(err, resultPage, currentMessages, resolve, reject) {
  if (err) {
    reject(err);
    return;
  }
  if (resultPage == null) {
    resolve(currentMessages);
    return;
  }

  let allHistory = currentMessages.concat(resultPage.items);

  if (resultPage.hasNext) {
    resultPage.next((nextErr, nextResultPage) => {
      getResultPage(nextErr, nextResultPage, allHistory, resolve, reject);
    });
  } else {
    resolve(allHistory);
  }
}

module.exports = channelShard;