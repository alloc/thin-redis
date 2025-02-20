# @alloc/redis-on-workers

Connect to your Redis server using `cloudflare:sockets`.

This package is designed to work with Cloudflare Workers, but it can also be used in node.js thanks to the implementation of [`cloudflare:sockets` for node.js](https://github.com/Ethan-Arrowood/socket).

> [!NOTE]
> This is a fork of [redis-on-workers](https://github.com/kane50613/redis-on-workers) with some improvements:
>
> - Modular commands and key types for tree-shakeable type safety.
> - Integrated with `@sinclair/typebox` for static type-checking and runtime validation.
> - **Experimental:** Supports pub-sub with dedicated `Subscriber` class.

## Installation

```sh
pnpm add @alloc/redis-on-workers
```

## Usage

### Minimal

This is the minimal example to connect to a Redis server.

```ts
import { RedisClient, RedisKey, GET, SET } from "@alloc/redis-on-workers";
import { Type } from "@sinclair/typebox";

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
import { RedisClient } from "@alloc/redis-on-workers";

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
pnpm add @arrowood.dev/socket
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

It's relatively straight-forward to add more commands (see [here](https://github.com/alloc/redis-on-workers/blob/master/src/commands.ts) for examples). If one is missing that you need, please add it and submit a PR.

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

## Development

To run the tests, first install [Redis Stack](https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/). If you don't use Homebrew, you need to update `redis.conf` in this repository to use the correct path to the `redisearch.so` binary.

```sh
brew install redis-stack
```

Then start the Redis server from the root directory:

```sh
redis-stack-server redis.conf
```

Then run the tests. 🥳

```sh
pnpm test
```
