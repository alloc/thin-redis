# thin-redis

Redis/Valkey client for Node.js and Cloudflare Workers.

- Modular design: choose which commands you need
- Impeccable TypeScript support
- Runtime type validation with `@sinclair/typebox`
- Install `@arrowood.dev/socket` for Node.js support
- Binary values with `sendRaw`
- Secure connection with TLS and Authentication
- RESP2 parser / serializer

## Supported features

**Most commands are not implemented yet.**

Supported features include:

- [x] CRUD operations
- [ ] [Pub/Sub](https://redis.io/docs/latest/develop/interact/pubsub/) (basic)
  - [x] [Key-space notifications](https://redis.io/docs/latest/develop/use/keyspace-notifications/)
  - [x] [Key-event notifications](https://redis.io/docs/latest/develop/use/keyspace-notifications/)
- [ ] [Streams](https://redis.io/docs/latest/develop/data-types/streams/) (basic)
- [ ] [JSON](https://redis.io/docs/latest/develop/data-types/json/) (basic)
- [ ] [Hashes](https://redis.io/docs/latest/develop/data-types/hashes/) (basic)
- [ ] [Sets](https://redis.io/docs/latest/develop/data-types/sets/) (basic)
- [ ] [Full-text search](https://redis.io/docs/latest/develop/interact/search-and-query/query/full-text/) (basic)

## Commands

Contributions welcome! Only the commands I've needed so far are implemented.

- [DECR](https://redis.io/docs/latest/commands/DECR/)
- [DECRBY](https://redis.io/docs/latest/commands/DECRBY/)
- [DEL](https://redis.io/docs/latest/commands/DEL/)
- [EXPIRE](https://redis.io/docs/latest/commands/EXPIRE/)
- [FLUSHALL](https://redis.io/docs/latest/commands/FLUSHALL/)
- [FT.CREATE](https://redis.io/docs/latest/commands/FT.CREATE/)
- [FT.SEARCH](https://redis.io/docs/latest/commands/FT.SEARCH/)
- [GET](https://redis.io/docs/latest/commands/GET/)
- [GETEX](https://redis.io/docs/latest/commands/GETEX/)
- [HGET](https://redis.io/docs/latest/commands/HGET/)
- [HSET](https://redis.io/docs/latest/commands/HSET/)
- [INCR](https://redis.io/docs/latest/commands/INCR/)
- [INCRBY](https://redis.io/docs/latest/commands/INCRBY/)
- [JSON.GET](https://redis.io/docs/latest/commands/JSON.GET/)
- [JSON.SET](https://redis.io/docs/latest/commands/JSON.SET/)
- [KEYS](https://redis.io/docs/latest/commands/KEYS/)
- [PING](https://redis.io/docs/latest/commands/PING/)
- [PUBLISH](https://redis.io/docs/latest/commands/PUBLISH/)
- [SADD](https://redis.io/docs/latest/commands/SADD/)
- [SCARD](https://redis.io/docs/latest/commands/SCARD/)
- [SDIFF](https://redis.io/docs/latest/commands/SDIFF/)
- [SET](https://redis.io/docs/latest/commands/SET/)
- [SINTER](https://redis.io/docs/latest/commands/SINTER/)
- [SISMEMBER](https://redis.io/docs/latest/commands/SISMEMBER/)
- [SMEMBERS](https://redis.io/docs/latest/commands/SMEMBERS/)
- [SPOP](https://redis.io/docs/latest/commands/SPOP/)
- [SREM](https://redis.io/docs/latest/commands/SREM/)
- [SUNION](https://redis.io/docs/latest/commands/SUNION/)
- [XACK](https://redis.io/docs/latest/commands/XACK/)
- [XADD](https://redis.io/docs/latest/commands/XADD/)
- [XDEL](https://redis.io/docs/latest/commands/XDEL/)
- [XGROUP.CREATE](https://redis.io/docs/latest/commands/XGROUP.CREATE/)
- [XREAD](https://redis.io/docs/latest/commands/XREAD/)
- [XREADGROUP](https://redis.io/docs/latest/commands/XREADGROUP/)

## Thanks

This package is a fork of [redis-on-workers](https://github.com/kane50613/redis-on-workers) by [@kane50613](https://github.com/kane50613).

## License

[MIT](LICENSE)
