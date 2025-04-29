import { Static, TAnySchema, TSchema } from "@sinclair/typebox";
import { Decode, Encode } from "@sinclair/typebox/value";
import { RedisValue } from "./command";
import { RedisTransform } from "./transform";

/**
 * The value type of a Redis key that points to a primitive value.
 */
export type Value<T extends TSchema | Record<string, TSchema>> =
  T extends TSchema ? Static<T> : never;

/**
 * A field name of a Redis key that points to a hash map.
 */
export type RedisField<T extends TSchema | Record<string, TSchema>> =
  T extends TSchema ? never : string & keyof T;

/**
 * A Redis key that points to a primitive value or a hash map.
 */
export class RedisKey<
  T extends TSchema | Record<string, TSchema> =
    | TAnySchema
    | Record<string, TAnySchema>,
> extends RedisTransform<T> {
  declare $$typeof: "RedisKey";
  constructor(
    readonly text: string,
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
    return new RedisKey(`${this.text}:${keys.join(":")}`, this.schema);
  }

  /**
   * Use this key as a namespace for a pattern. The `pattern` is appended
   * to the current key with a colon between them.
   */
  match(pattern: string) {
    return this.text + ":" + pattern;
  }

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

  toString() {
    return this.text;
  }
}

export class RedisIndex {
  declare $$typeof: "RedisIndex";
  constructor(readonly text: string) {}
}
