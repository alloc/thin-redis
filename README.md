# redis-on-workers

Connect to your Redis server using `cloudflare:sockets`.

This package is designed to work with Cloudflare Workers, but it can also be used in node.js thanks to the implementation of [`cloudflare:sockets` for node.js](https://github.com/Ethan-Arrowood/socket).

## Installation

```sh
npm install redis-on-workers
```

## Usage

### Minimal

This is the minimal example to connect to a Redis server.

```ts
import { RedisClient, GET, RedisKey, Type } from "redis-on-workers";

const redis = new RedisClient({
  url: "redis://<username>:<password>@<host>:<port>",
});
const key = new RedisKey("foo", Type.String());

await redis.send(SET(key, "bar"));

const value = await redis.send(GET(key));

console.log(value); // bar

// remember to close the connection after use, or use `redis.sendOnce`.
await redis.close();
```

### Raw Uint8Array

This is useful if you want to store binary data. For example, you can store protobuf messages in Redis.

```ts
import { RedisClient } from "redis-on-workers";

const redis = new RedisClient({
  url: "redis://<username>:<password>@<host>:<port>",
});

await redis.sendRaw("SET", "foo", "bar");

const value = await redis.sendRawOnce("GET", "foo");

const decoder = new TextDecoder();

console.log(decoder.decode(value)); // bar
```

### Node.js

Please install the node.js polyfill for `cloudflare:sockets` to use this package in node.js.

```sh
npm install @arrowood.dev/socket
```

## API

### `new RedisClient(options: RedisClientOptions)`

Create a new Redis client, does NOT connect to the server yet, the connection will be established when the first command is sent.

Or you can start connection immediately by using `redis.startConnection()`.

### `RedisClientOptions`

- `url` (string): The URL of the Redis server.
- `tls` (boolean): Whether to use TLS. Default: `false`.
- `logger` (function): A function to log debug messages.
- `connectFn` (function): Polyfill for `cloudflare:sockets`'s `connect` function if you're using it in node.js. Default: `undefined`.
- `onReply` (function): Callback for Redis replies. Default: `undefined`.

## Commands

- `GET(key)`  
  Get the value of a key.
- `GETEX(key, ...modifiers)`  
  Get the value of a key and optionally set its expiration.
- `SET(key, value, ...modifiers)`  
  Set the value of a key and optionally set its expiration.
- `DEL(key, ...keys)`  
  Delete a key or multiple keys.
- `INCR(key)`  
  Increment the value of a key by 1.
- `DECR(key)`  
  Decrement the value of a key by 1.
- `INCRBY(key, amount)`  
  Increment the value of a key by a specific amount.
- `DECRBY(key, amount)`  
  Decrement the value of a key by a specific amount.
- `KEYS(pattern)`  
  Get all keys that match the given pattern.
- `HGET(key, field)`  
  Get the value of a field in a hash.
- `HSET(key, field, value)`  
  Set the value of a field in a hash.
- `HSET(key, values)`  
  Set the values of multiple fields in a hash.
- `PUBLISH(channel, message)`  
  Publish a message to a channel.

### Modifiers

- `NX()`  
  Only set the key if it does not already exist.
- `XX()`  
  Only set the key if it already exists.
- `EX(seconds)`  
  Set the expiration time of a key in seconds.
- `PX(milliseconds)`  
  Set the expiration time of a key in milliseconds.
- `EXAT(timestamp)`  
  Set the expiration time of a key at a specific Unix time.
- `PXAT(timestamp)`  
  Set the expiration time of a key at a specific Unix time in milliseconds.
- `KEEPTTL()`  
  Retain the time to live associated with the key.
- `PERSIST()`  
  Remove the time to live associated with the key.
