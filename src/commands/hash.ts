import { Static, TSchema } from "@sinclair/typebox";
import { RedisCommand, RedisValue } from "../command";
import { RedisField, RedisKey, Value } from "../key";

/**
 * Get the value of a field in a hash.
 */
export function HGET<
  T extends Record<string, TSchema>,
  TField extends RedisField<T>,
>(key: RedisKey<T>, field: TField) {
  return new RedisCommand<Static<T[TField]>>(
    ["HGET", key.text, field],
    (result) => key.decodeField(field, result),
  );
}

/**
 * Set the value of a field in a hash.
 */
export function HSET<
  T extends Record<string, TSchema>,
  TField extends RedisField<T>,
>(key: RedisKey<T>, field: TField): never;

/**
 * Set the value of a field in a hash.
 */
export function HSET<
  T extends Record<string, TSchema>,
  TField extends RedisField<T>,
>(
  key: RedisKey<T>,
  field: TField,
  value: Value<T[TField]>,
): RedisCommand<number>;

/**
 * Set the values of multiple fields in a hash.
 */
export function HSET<T extends Record<string, TSchema>>(
  key: RedisKey<T>,
  values: { [K in RedisField<T>]?: Value<T[K]> },
): RedisCommand<number>;

export function HSET<T extends Record<string, TSchema>>(
  key: RedisKey<T>,
  field: RedisField<T> | object,
  value?: unknown,
) {
  return new RedisCommand<number>(
    typeof field === "string"
      ? ["HSET", key.text, field, key.encodeField(field, value) as any]
      : [
          "HSET",
          key.text,
          ...encodeHashEntries(key, Object.entries(field)).flat(),
        ],
  );
}

function encodeHashEntries(
  key: RedisKey<Record<string, TSchema>>,
  entries: [string, unknown][],
) {
  if (entries.length === 0) {
    throw new Error("At least one field must be provided");
  }
  for (let i = 0; i < entries.length; i++) {
    entries[i][1] = key.encodeField(entries[i][0], entries[i][1]);
  }
  return entries as [string, RedisValue][];
}
