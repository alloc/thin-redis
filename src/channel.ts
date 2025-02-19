import { TAnySchema, TSchema, TString, Type } from "@sinclair/typebox";
import { RedisKey } from "./key";
import { RedisTransform } from "./transform";

/**
 * Channels use the `SUBSCRIBE` command.
 */
export class RedisChannel<
  T extends TSchema = TAnySchema,
> extends RedisTransform<T> {
  declare $$typeof: "RedisChannel";
  constructor(
    readonly text: string,
    schema: T,
  ) {
    super(schema);
  }
}

/**
 * Channel patterns use the `PSUBSCRIBE` command.
 */
export class RedisChannelPattern<
  T extends TSchema = TAnySchema,
> extends RedisTransform<T> {
  declare $$typeof: "RedisChannelPattern";
  constructor(
    readonly text: string,
    schema: T,
  ) {
    super(schema);
  }
}

/**
 * Subscribe to [keyspace notifications][1].
 *
 * [1]: https://redis.io/docs/latest/develop/use/keyspace-notifications/
 */
export class RedisKeyspacePattern extends RedisChannelPattern<TString> {
  constructor(pattern: string | RedisKey, database?: number) {
    super(`__keyspace@${database ?? "*"}__:${pattern}`, Type.String());
  }
}

/**
 * Subscribe to [keyevent notifications][1].
 *
 * [1]: https://redis.io/docs/latest/develop/use/keyspace-notifications/
 */
export class RedisKeyeventPattern extends RedisChannelPattern<TString> {
  constructor(pattern: string, database?: number) {
    super(`__keyevent@${database ?? "*"}__:${pattern}`, Type.String());
  }
}
