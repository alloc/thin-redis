import * as Type from "@sinclair/typebox/type";
import {
  StaticEncode,
  TBoolean,
  TNumber,
  Transform,
  TSchema,
} from "@sinclair/typebox/type";
import { Decode, Encode } from "@sinclair/typebox/value";
import { RedisValue } from "./command";

export abstract class RedisTransform<T extends TSchema = TSchema> {
  readonly schema: T;
  constructor(schema: T) {
    this.schema = createRedisTransform(schema, this.constructor.name) as any;
  }

  /**
   * Get a Redis-encoded value from a JS value.
   */
  encode(value: unknown): RedisValue {
    // The schema is defined for JS, not Redis, so a "decoded" value
    // represents a Redis value.
    return Decode(this.schema as TSchema, value);
  }

  /**
   * Get a JS value from a Redis-encoded value.
   */
  decode(value: unknown): StaticEncode<T> {
    // The schema is defined for JS, not Redis, so an "encoded" value
    // represents a JS value.
    return Encode(this.schema as TSchema, value);
  }
}

/**
 * Wrap the JavaScript types with Redis-targeted transform types.
 *
 * Note: The encode/decode methods are flipped, because TypeBox expects
 * transform types to operate on input values, not output values.
 */
function createRedisTransform(schema: TSchema, instanceType?: string) {
  if (instanceType === "RedisHash") {
    if (schema.type !== "object" || !schema.properties) {
      throw new Error("RedisHash must have an object schema with properties");
    }
    const newSchema = { ...schema.properties };
    for (const field in schema.properties) {
      newSchema[field] = createRedisTransform(schema.properties[field]) as any;
    }
    return Type.Object(newSchema);
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
