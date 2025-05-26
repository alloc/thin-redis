import * as Type from "@sinclair/typebox/type";
import { StaticEncode, TObject, TSchema } from "@sinclair/typebox/type";
import { Decode, Encode } from "@sinclair/typebox/value";
import { isString } from "radashi";
import { RedisValue } from "./command";
import { RedisTransform } from "./transform";
import { JSONPath, resolveSchemaForJSONPath } from "./utils/json-path";

/**
 * Represents a namespace of keys in a Redis database.
 */
export class RedisKeyspace<K extends string | number = string | number> {
  declare $$typeof: "RedisKeyspace" & { K: K };
  constructor(readonly name: string) {}

  /**
   * Creates a string pattern that matches all keys in the keyspace.
   *
   * You may pass this to the `RedisKeyspacePattern` constructor.
   */
  any() {
    return `${this.name}:*` as const;
  }
}

/**
 * Represents a key in a Redis database with an unknown data structure. For
 * example, it could be a primitive, hash, stream, etc.
 */
export abstract class RedisKey<
  T extends TSchema = TSchema,
  K extends string | RedisKeyspace = string,
> extends RedisTransform<T> {
  declare $$typeof: "RedisKey";

  constructor(
    readonly name: K,
    schema: T = Type.Unknown() as T,
  ) {
    super(schema);
  }

  /**
   * Creates a new key within a namespace.
   */
  qualify(
    name: K extends RedisKeyspace<infer Key> ? Key : string | number,
  ): RedisKey<T, string>;
  qualify<T extends TSchema>(
    name: K extends RedisKeyspace<infer Key> ? Key : string | number,
    schema: T,
  ): RedisKey<T, string>;
  qualify(
    name: K extends RedisKeyspace<infer Key> ? Key : string | number,
    schema: TSchema = this.schema,
  ) {
    const RedisKey = this.constructor as new (
      name: string,
      schema: TSchema,
    ) => any;

    return new RedisKey(
      `${isString(this.name) ? this.name : this.name.name}:${name}`,
      schema,
    );
  }
}

/**
 * Represents a key in a Redis database with a single datum, like a
 * primitive or a JSON object.
 */
export class RedisEntity<
  T extends TSchema = TSchema,
  K extends string | RedisKeyspace = string,
> extends RedisKey<T, K> {
  declare $$typeof: "RedisKey" & { subtype: "RedisEntity" };
  declare qualify: {
    (
      name: K extends RedisKeyspace<infer Key> ? Key : string | number,
    ): RedisEntity<T, string>;
    <T extends TSchema>(
      name: K extends RedisKeyspace<infer Key> ? Key : string | number,
      schema: T,
    ): RedisEntity<T, string>;
  };
}

/**
 * Represents a key in a Redis database with a JSON value.
 *
 * You must use `JSON.*` commands to read or edit this key's value. Of
 * course, you may use key-focused commands (e.g. `DEL` may delete this
 * key).
 *
 * @see https://redis.io/docs/latest/develop/data-types/json/
 */
export class RedisJSONEntity<
  T extends TSchema = TSchema,
  K extends string | RedisKeyspace = string,
> extends RedisKey<T, K> {
  declare $$typeof: "RedisKey" & { subtype: "RedisJSONEntity" };

  encode(value: unknown, path?: JSONPath): RedisValue {
    // The schema is defined for JS, not Redis, so a "decoded" value
    // represents a Redis value.
    return Decode(
      path ? resolveSchemaForJSONPath(this.schema, path) : this.schema,
      value,
    );
  }

  decode(value: unknown, path?: JSONPath): StaticEncode<T> {
    // The schema is defined for JS, not Redis, so an "encoded" value
    // represents a JS value.
    return Encode(
      path ? resolveSchemaForJSONPath(this.schema, path) : this.schema,
      value,
    );
  }
}

export class RedisSet<
  T extends TSchema = TSchema,
  K extends string | RedisKeyspace = string,
> extends RedisKey<T, K> {
  declare $$typeof: "RedisKey" & { subtype: "RedisSet" };
  declare qualify: {
    (
      name: K extends RedisKeyspace<infer Key> ? Key : string | number,
    ): RedisSet<T, string>;
    <T extends TSchema>(
      name: K extends RedisKeyspace<infer Key> ? Key : string | number,
      schema: T,
    ): RedisSet<T, string>;
  };
}

export class RedisHash<
  T extends Record<string, TSchema> = Record<string, TSchema>,
  K extends string | RedisKeyspace = string,
> extends RedisKey<TObject<T>, K> {
  declare $$typeof: "RedisKey" & { subtype: "RedisHash" };
  declare qualify: {
    (
      name: K extends RedisKeyspace<infer Key> ? Key : string | number,
    ): RedisHash<T, string>;
    <T extends TSchema>(
      name: K extends RedisKeyspace<infer Key> ? Key : string | number,
      schema: T,
    ): RedisHash<T, string>;
  };

  /**
   * Like `encode`, but for keys that point to a hash map.
   */
  encodeField<TField extends keyof T>(
    field: TField,
    value: StaticEncode<T[TField]>,
  ): RedisValue {
    // The schema is defined for JS, not Redis, so a "decoded" value
    // represents a Redis value.
    return Decode(this.schema.properties[field], value) as any;
  }

  /**
   * Like `decode`, but for keys that point to a hash map.
   */
  decodeField<TField extends keyof T>(
    field: TField,
    value: unknown,
  ): StaticEncode<T[TField]> {
    // The schema is defined for JS, not Redis, so an "encoded" value
    // represents a JS value.
    return Encode(this.schema.properties[field], value);
  }
}

export class RedisSortedSet<
  T extends TSchema = TSchema,
  K extends string | RedisKeyspace = string,
> extends RedisKey<T, K> {
  declare $$typeof: "RedisKey" & { subtype: "RedisSortedSet" };
  declare qualify: {
    (
      name: K extends RedisKeyspace<infer KeyType> ? KeyType : string | number,
    ): RedisSortedSet<T, string>;
    <T extends TSchema>(
      name: K extends RedisKeyspace<infer KeyType> ? KeyType : string | number,
      schema: T,
    ): RedisSortedSet<T, string>;
  };
}

export class RedisSortedSetEntry<T extends TSchema> {
  declare $$typeof: "RedisSortedSetEntry";
  constructor(
    public readonly key: RedisSortedSet<T>,
    public readonly data: StaticEncode<T>,
    public readonly score: number,
  ) {}
}

export class RedisIndex {
  declare $$typeof: "RedisIndex";
  constructor(readonly name: string) {}
}
