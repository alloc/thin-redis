import * as z from 'zod/v4/classic'
import { RedisValue } from "./command";

type ZodRedisType = z.ZodType<unknown, RedisValue>

export abstract class RedisTransform<T extends ZodRedisType = ZodRedisType> {
  readonly schema: T;
  constructor(schema: T) {
    this.schema = wrapSchemaForRedis(schema, this.constructor.name) as any;
  }

  /**
   * Get a Redis-encoded value from a JS value.
   */
  encode(value: z.output<T>): RedisValue {
    return this.schema.encode(value)
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

const wrappedSchemas = new WeakSet<TSchema>();

/**
 * Wrap the JavaScript types with Redis-targeted transform types.
 *
 * Note: The encode/decode methods are flipped, because TypeBox expects
 * transform types to operate on input values, not output values.
 */
function wrapSchemaForRedis(schema: TSchema, instanceType?: string) {
  if (wrappedSchemas.has(schema)) {
    return schema;
  }

  if (instanceType === "RedisHash") {
    if (schema.type !== "object" || !schema.properties) {
      throw new Error("RedisHash must have an object schema with properties");
    }
    const newSchema = { ...schema.properties };
    for (const field in schema.properties) {
      newSchema[field] = wrapSchemaForRedis(schema.properties[field]) as any;
    }
    schema = Type.Object(newSchema);
  } else if (schema.type !== "string" && schema.type !== "uint8array") {
    if (schema.type === "number") {
      schema = Transform(schema as TNumber)
        .Decode((value) => String(value))
        .Encode((value) => Number(value));
    } else if (schema.type === "boolean") {
      schema = Transform(schema as TBoolean)
        .Decode((value) => (value ? "1" : "0"))
        .Encode((value) => value === "1");
    } else {
      schema = Transform(schema)
        .Decode((value) => JSON.stringify(value))
        .Encode((value) => JSON.parse(value));
    }
  }

  wrappedSchemas.add(schema);
  return schema;
}
