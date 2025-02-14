import {
  Static,
  TAnySchema,
  TBoolean,
  TObject,
  Transform,
  TRecord,
  TSchema,
  TString,
  TypeGuard,
} from "@sinclair/typebox";
import { Decode, Encode } from "@sinclair/typebox/value";
import { RedisValue } from "./command";

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

export class RedisKey<
  T extends TSchema | Record<string, TSchema> =
    | TAnySchema
    | Record<string, TAnySchema>,
> {
  readonly schema: T;

  constructor(
    readonly text: string,
    schema: T,
  ) {
    this.schema = createRedisTransform(schema) as any;
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
   * Encode a JS value to the type of the key.
   */
  encode(value: Value<T>): RedisValue {
    // The schema is defined for JS, not Redis, so a "decoded" value
    // represents a Redis value.
    return Decode(this.schema as TSchema, value);
  }

  /**
   * Decode a Redis value to the type of the key.
   */
  decode(value: unknown): Value<T> {
    // The schema is defined for JS, not Redis, so an "encoded" value
    // represents a JS value.
    return Encode(this.schema as TSchema, value);
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
}

export type TRedisHashMap = TObject | TRecord<TString, TSchema>;

function createRedisTransform(schema: TSchema | Record<string, TSchema>) {
  if (!TypeGuard.IsSchema(schema)) {
    const newSchema = { ...schema };
    for (const field in schema) {
      newSchema[field] = createRedisTransform(schema[field]) as any;
    }
    return newSchema;
  }
  if (
    schema.type !== "string" &&
    schema.type !== "number" &&
    schema.type !== "uint8array"
  ) {
    if (schema.type === "boolean") {
      return Transform(schema as TBoolean)
        .Decode((value) => (value ? 1 : 0))
        .Encode((value) => value === 1);
    }
    return Transform(schema)
      .Decode((value) => JSON.stringify(value))
      .Encode((value) => JSON.parse(value));
  }
  return schema;
}
