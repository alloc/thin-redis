import {
  TBoolean,
  TNumber,
  Transform,
  TSchema,
  TypeGuard,
} from "@sinclair/typebox";
import { Decode, Encode } from "@sinclair/typebox/value";
import { RedisValue } from "./command";
import { TRedisHash, Value } from "./key";

export abstract class RedisTransform<
  T extends TSchema | TRedisHash = TSchema | TRedisHash,
> {
  readonly schema: T;
  constructor(schema: T) {
    this.schema = createRedisTransform(schema) as any;
  }

  /**
   * Get a Redis-encoded value from a JS value.
   */
  encode(value: Value<T>): RedisValue {
    // The schema is defined for JS, not Redis, so a "decoded" value
    // represents a Redis value.
    return Decode(this.schema as TSchema, value);
  }

  /**
   * Get a JS value from a Redis-encoded value.
   */
  decode(value: unknown): Value<T> {
    // The schema is defined for JS, not Redis, so an "encoded" value
    // represents a JS value.
    return Encode(this.schema as TSchema, value);
  }
}

function createRedisTransform(schema: TSchema | Record<string, TSchema>) {
  if (!TypeGuard.IsSchema(schema)) {
    const newSchema = { ...schema };
    for (const field in schema) {
      newSchema[field] = createRedisTransform(schema[field]) as any;
    }
    return newSchema;
  }
  if (schema.type !== "string" && schema.type !== "uint8array") {
    if (schema.type === "number") {
      return Transform(schema as TNumber)
        .Decode((value) => String(value))
        .Encode((value) => Number(value));
    }
    if (schema.type === "boolean") {
      return Transform(schema as TBoolean)
        .Decode((value) => (value ? "1" : "0"))
        .Encode((value) => value === "1");
    }
    return Transform(schema)
      .Decode((value) => JSON.stringify(value))
      .Encode((value) => JSON.parse(value));
  }
  return schema;
}
