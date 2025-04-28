import { TAnySchema, TSchema } from "@sinclair/typebox";
import { Decode, Encode } from "@sinclair/typebox/value";
import { RedisValue } from "./command";
import { Value } from "./key";

export type RedisStreamPosition<
  TField extends TSchema = TAnySchema,
  TValue extends TSchema = TAnySchema,
> = {
  $$typeof: "RedisStreamPosition";
  stream: RedisStream<TField, TValue>;
  id: string;
};

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

  /**
   * For use with `XREAD` or `XREADGROUP`. Defines which ID was last delivered to the
   * consumer of a specific stream.
   *
   * - **XREAD special IDs**
   *   - `$` requests entries added after `XREAD` started to block
   *   - `+` requests the last available entry in the stream
   * - **XREADGROUP special IDs**
   *   - `>` requests an entry not yet delivered to a consumer
   */
  position(
    id: "$" | "+" | ">" | (string & {}),
  ): RedisStreamPosition<TField, TValue> {
    return { stream: this, id } as any;
  }

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
  constructor(readonly name: string) {}
}

export class RedisStreamEntry<
  TField extends TSchema = TAnySchema,
  TValue extends TSchema = TAnySchema,
> implements Iterable<[Value<TField>, Value<TValue>]>
{
  declare $$typeof: "RedisStreamEntry";
  readonly data: (Value<TField> | Value<TValue>)[];
  constructor(
    /** The stream this entry belongs to */
    readonly stream: RedisStream<TField, TValue>,
    /** The ID of this entry */
    readonly id: string,
    /** The fields and values of this entry */
    data: RedisValue[],
  ) {
    this.data = stream.decodeEntries(data);
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.data.length; i += 2) {
      yield [this.data[i], this.data[i + 1]] as [Value<TField>, Value<TValue>];
    }
  }

  /**
   * Assert the entry has a single value and return it.
   */
  toValue() {
    if (this.data.length !== 2) {
      throw new TypeError("Entry must have exactly one field-value pair");
    }
    return this.data[1] as Value<TValue>;
  }

  /**
   * Convert the entry's data into a record.
   */
  toRecord() {
    const fieldType = this.stream.fieldSchema.type;
    if (fieldType !== "string" && fieldType !== "number") {
      throw new TypeError(
        `Field schema must be a string or number, got ${fieldType}`,
      );
    }
    type Key = Extract<Value<TField>, string | number>;
    const data = {} as Record<Key, Value<TValue>>;
    for (let i = 0; i < this.data.length; i += 2) {
      data[this.data[i] as Key] = this.data[i + 1] as Value<TValue>;
    }
    return data;
  }

  /**
   * Convert the entry's data into a map.
   */
  toMap() {
    const data = new Map<Value<TField>, Value<TValue>>();
    for (let i = 0; i < this.data.length; i += 2) {
      data.set(
        this.data[i] as Value<TField>,
        this.data[i + 1] as Value<TValue>,
      );
    }
    return data;
  }
}
