# Sharded Ably Channels

This repo contains a demonstration of how to easily distribute communications across multiple channels and connections, which can be beneficial for communication which needs to exceed the rate limits of any single channel or connection.

There are no guarantees of ordering of messages when using this. It's possible for a message to be sent to one channel, another to be sent to another channel, and then for the latter message to be delivered to one of the subscribing clients first.

## How to use this

`index.js` contains the sample code. You just need to pass [ClientOptions](https://ably.com/documentation/realtime/usage#client-options), a namespace to use for the sharding, and then the number of channels you'd like to be used.

An example of using this is in `test.js`. In it, an instance of a channelShard is made, and then it makes use of the instance's `publish` and `subscribe` functions to handle the sharded subscribing and publishing.

**Note** that `test.js` expects there to be a `.env` file which contains `ABLY_OPTIONS`. For a simple test, you can simply assign this to be an [Ably API key from one of your Ably Apps](https://ably.com/accounts/any/apps/any/app_keys).

Currently rudementary uses of Subscribe, Publish, and History are supported for sharded channels.

### Instantiating

To instantiate sharding, you will need to supply:

- [ClientOptions](https://ably.com/documentation/realtime/usage#client-options) : Used to specify authentication and any other connection configurations
- Namespace : What should prefix the channels this will be using. For example, if you were to specify `foo`, and wanted 3 shards, then this will make use of real channels `foo:0`, `foo:1`, and `foo:2`
- Number of shards : How many shards you'd like to make use of

```javascript
var myChannelShard = channelShard(clientOptions, namespace, numShards);
```

### Subscribe

```javascript
myChannelShard.subscribe(callback(msg));
```

### Publish

```javascript
myChannelShard.publish(name, data, callback(err));
```

### History

History using this project will return an array of all messages from all the channel shards which match the options specified as a parameter. These will be organized by the timestamp at which they were acknowledged by an Ably server. This may not match with the actual publish order.

```javascript
myChannelShard.history(options, callback(err, history));
```