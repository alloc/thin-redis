import { Static, StaticDecode, TSchema } from "@sinclair/typebox";
import { Decode, Encode } from "@sinclair/typebox/value";
import { RedisValue } from "./command";
import { RedisTransform } from "./transform";

export type TRedisHash<TValue extends TSchema = TSchema> = Record<
  string,
  TValue
>;

/**
 * The value type of a Redis key that points to a primitive value or a hash map.
 */
export type Value<T extends TSchema | TRedisHash> = T extends TSchema
  ? StaticDecode<T>
  : { [K in RedisField<T>]?: StaticDecode<T[K]> };

/**
 * A field name of a Redis key that points to a hash map.
 */
export type RedisField<T extends TSchema | TRedisHash> = T extends TSchema
  ? never
  : Extract<keyof T, string>;

/**
 * A Redis key that points to a primitive value or a hash map.
 */
export class RedisKey<
  T extends TSchema | TRedisHash = TSchema | TRedisHash,
> extends RedisTransform<T> {
  declare $$typeof: "RedisKey";
  constructor(
    readonly name: string,
    schema: T,
  ) {
    super(schema);
  }

  /**
   * Derive a new key by prefixing the current key with the given keys. When multiple keys are
   * passed in, they will be joined with a colon.
   */
  join(...keys: (string | number)[]) {
    if (keys.length === 0) return this;
    return new RedisKey(`${this.name}:${keys.join(":")}`, this.schema);
  }

  /**
   * Use this key as a namespace for a pattern. The `pattern` is appended
   * to the current key with a colon between them.
   */
  match(pattern: string) {
    return this.name + ":" + pattern;
  }
}

export class RedisSet<T extends TSchema = TSchema> extends RedisKey<T> {
  declare $$typeof: "RedisKey" & { subtype: "RedisSet" };
}

export class RedisHash<T extends TRedisHash = TRedisHash> extends RedisKey<T> {
  declare $$typeof: "RedisKey" & { subtype: "RedisHash" };

  /**
   * Like `encode`, but for keys that point to a hash map.
   */
  encodeField<TField extends RedisField<T>>(
    field: TField,
    value: Static<T[TField]>,
  ): RedisValue {
    // The schema is defined for JS, not Redis, so a "decoded" value
    // represents a Redis value.
    return Decode(this.schema[field], value) as any;
  }

  /**
   * Like `decode`, but for keys that point to a hash map.
   */
  decodeField<TField extends RedisField<T>>(
    field: TField,
    value: unknown,
  ): T extends TSchema ? never : Static<T[TField]> {
    // The schema is defined for JS, not Redis, so an "encoded" value
    // represents a JS value.
    return Encode(this.schema[field], value);
  }
}

export class RedisIndex {
  declare $$typeof: "RedisIndex";
  constructor(readonly name: string) {}
}
