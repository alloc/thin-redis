import { TSchema, TString, Type } from "@sinclair/typebox";
import { isString } from "radashi";
import { RedisKey, RedisKeyspace } from "./key";
import { MessageEvent } from "./subscriber";
import { RedisTransform } from "./transform";

/**
 * Channels use the `SUBSCRIBE` command.
 */
export class RedisChannel<
  T extends TSchema = TSchema,
  K extends string | RedisKeyspace = string,
> extends RedisTransform<T> {
  declare $$typeof: "RedisChannel";
  constructor(
    readonly name: K,
    schema: T,
  ) {
    super(schema);
  }

  /**
   * Creates a new channel within a namespace.
   */
  qualify(
    name: K extends RedisKeyspace<infer Key> ? Key : string | number,
  ): RedisChannel<T, string>;
  qualify<T extends TSchema>(
    name: K extends RedisKeyspace<infer Key> ? Key : string | number,
    schema: T,
  ): RedisChannel<T, string>;
  qualify(
    name: K extends RedisKeyspace<infer Key> ? Key : string | number,
    schema: TSchema = this.schema,
  ) {
    return new RedisChannel<any>(`${this.name}:${name}`, schema);
  }

  /**
   * Returns true if the event originated from this channel or a
   * subchannel.
   */
  test(event: MessageEvent<any>): event is MessageEvent<T> {
    return (
      event.key === this ||
      event.channel === this.name ||
      event.channel.startsWith(this.name + ":")
    );
  }
}

/**
 * Channel patterns use the `PSUBSCRIBE` command.
 */
export class RedisChannelPattern<
  T extends TSchema = TSchema,
> extends RedisTransform<T> {
  declare $$typeof: "RedisChannelPattern";
  constructor(
    readonly name: string,
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
  constructor(pattern: string | RedisKey | RedisKeyspace, database?: number) {
    super(
      `__keyspace@${database ?? "*"}__:${isString(pattern) ? pattern : pattern.name}`,
      Type.String(),
    );
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
