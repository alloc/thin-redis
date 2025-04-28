import { TAnySchema, TSchema } from "@sinclair/typebox";
import { Decode, Encode } from "@sinclair/typebox/value";
import { RedisValue } from "./command";
import { Value } from "./key";

export class RedisStream<
  TField extends TSchema = TAnySchema,
  TValue extends TSchema = TAnySchema,
> {
  declare $$typeof: "RedisStream";
  constructor(
    readonly name: string,
    readonly fieldSchema: TField,
    readonly valueSchema: TValue,
  ) {}

  encodeEntries(
    entries: readonly (Value<TField> | Value<TValue>)[],
  ): RedisValue[] {
    return entries.map((entry, index) => {
      if (index % 2 === 0) {
        return this.encodeField(entry as Value<TField>);
      }
      return this.encodeValue(entry as Value<TValue>);
    });
  }

  decodeEntries(
    entries: readonly RedisValue[],
  ): (Value<TField> | Value<TValue>)[] {
    return entries.map((entry, index) => {
      if (index % 2 === 0) {
        return this.decodeField(entry);
      }
      return this.decodeValue(entry);
    });
  }

  /**
   * Encode a field name for a Redis stream entry.
   */
  encodeField(field: Value<TField>): RedisValue {
    // The schema is defined for JS, not Redis, so a "decoded" value
    // represents a Redis value.
    return Decode(this.fieldSchema, field);
  }

  /**
   * Decode a field name from a Redis-encoded value.
   */
  decodeField(field: unknown): Value<TField> {
    // The schema is defined for JS, not Redis, so an "encoded" value
    // represents a JS value.
    return Encode(this.fieldSchema, field);
  }

  /**
   * Encode a value for a Redis stream entry.
   */
  encodeValue(value: Value<TValue>): RedisValue {
    // The schema is defined for JS, not Redis, so a "decoded" value
    // represents a Redis value.
    return Decode(this.valueSchema, value);
  }

  /**
   * Decode a value from a Redis-encoded value.
   */
  decodeValue(value: unknown): Value<TValue> {
    // The schema is defined for JS, not Redis, so an "encoded" value
    // represents a JS value.
    return Encode(this.valueSchema, value);
  }
}

export class RedisConsumerGroup {
  declare $$typeof: "RedisConsumerGroup";
  constructor(
    readonly stream: RedisStream,
    readonly name: string,
  ) {}
}
