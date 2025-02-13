import { Static, TNumber, TSchema, Type } from "@sinclair/typebox";
import { RedisCommand, RedisValue } from "./command";
import { RedisField, RedisKey, Value } from "./key";
import {
  createModifier,
  encodeModifiers,
  RedisModifier,
  StaticModifier,
} from "./modifier";

/** Get the value of a key */
export function GET<T extends TSchema>(
  key: RedisKey<T>,
): RedisCommand<Value<T> | null>;

/** Return the previous value stored at this key */
export function GET(): GET;

export function GET<T extends TSchema>(
  key?: RedisKey<T>,
): GET | RedisCommand<Value<T> | null> {
  if (!key) {
    return new RedisModifier("GET");
  }
  return new RedisCommand(["GET", key.text], (result) =>
    result !== null ? key.decode(result) : result,
  );
}

/**
 * Get all keys that match the given pattern.
 */
export function KEYS(pattern: string) {
  return new RedisCommand<string[]>(["KEYS", pattern]);
}

//
// Write commands
//

/**
 * Get the value of key and optionally set its expiration. `GETEX` is
 * similar to {@link GET}, but is a write command with additional options.
 */
export function GETEX<T extends TSchema>(
  key: RedisKey<T>,
  ...modifiers: Modifiers<[EX | PX | EXAT | PXAT | PERSIST]>
) {
  return new RedisCommand<Value<T> | null>(
    ["GETEX", key.text, ...encodeModifiers(modifiers)],
    (result) => (result !== null ? key.decode(result) : result),
  );
}

/**
 * Set the value of a key and optionally set its expiration.
 */
export function SET<T extends TSchema>(
  key: RedisKey<T>,
  value: Value<T>,
  ...modifiers: Modifiers<
    [NX | XX, Require<GET>, EX | PX | EXAT | PXAT | KEEPTTL]
  >
): RedisCommand<Value<T> | null>;

export function SET<T extends TSchema>(
  key: RedisKey<T>,
  value: Value<T>,
  ...modifiers: Modifiers<[NX | XX, EX | PX | EXAT | PXAT | KEEPTTL]>
): RedisCommand<"OK" | null>;

export function SET(
  key: RedisKey<any>,
  value: Value<any>,
  ...modifiers: Modifiers
): RedisCommand<any> {
  return new RedisCommand(
    ["SET", key.text, key.encode(value), ...encodeModifiers(modifiers)],
    modifiers.some((m) => m?.token === "GET")
      ? (result) => (result !== null ? key.decode(result) : result)
      : undefined,
  );
}

/**
 * Delete a key or multiple keys.
 */
export function DEL(...keys: [RedisKey, ...RedisKey[]]) {
  return new RedisCommand<number>(["DEL", ...keys.map((k) => k.text)]);
}

/**
 * Decrement the value of a key by 1.
 */
export function DECR(key: RedisKey<TNumber>) {
  return new RedisCommand<number>(["DECR", key.text]);
}

/**
 * Decrement the value of a key by a specific amount.
 */
export function DECRBY(key: RedisKey<TNumber>, amount: number) {
  return new RedisCommand<number>(["DECRBY", key.text, amount]);
}

/**
 * Increment the value of a key by 1.
 */
export function INCR(key: RedisKey<TNumber>) {
  return new RedisCommand<number>(["INCR", key.text]);
}

/**
 * Increment the value of a key by a specific amount.
 */
export function INCRBY(key: RedisKey<TNumber>, amount: number) {
  return new RedisCommand<number>(["INCRBY", key.text, amount]);
}

/**
 * Publish a message to a channel.
 */
export function PUBLISH<T extends TSchema>(
  channel: RedisKey<T>,
  message: Value<T>,
) {
  return new RedisCommand<number>([
    "PUBLISH",
    channel.text,
    channel.encode(message),
  ]);
}

//
// Hash commands
//

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

//
// Modifiers
//

/** Only set this key if it doesn't already exist */
export const NX = /* #__PURE__ */ createModifier("NX");
export type NX = StaticModifier<typeof NX>;

/** Only set this key if it already exists */
export const XX = /* #__PURE__ */ createModifier("XX");
export type XX = StaticModifier<typeof XX>;

/** Expiry in seconds */
export const EX = /* #__PURE__ */ createModifier("EX", Type.Number());
export type EX = StaticModifier<typeof EX>;

/** Expiry at specified Unix time, in seconds */
export const EXAT = /* #__PURE__ */ createModifier("EXAT", Type.Number());
export type EXAT = StaticModifier<typeof EXAT>;

/** Expiry in milliseconds */
export const PX = /* #__PURE__ */ createModifier("PX", Type.Number());
export type PX = StaticModifier<typeof PX>;

/** Expiry at specified Unix time, in milliseconds */
export const PXAT = /* #__PURE__ */ createModifier("PXAT", Type.Number());
export type PXAT = StaticModifier<typeof PXAT>;

/** Return the previous value stored at this key */
export type GET = RedisModifier<"GET">;

/** Retain the time to live associated with the key */
export const KEEPTTL = /* #__PURE__ */ createModifier("KEEPTTL");
export type KEEPTTL = StaticModifier<typeof KEEPTTL>;

/** Remove the time to live associated with the key */
export const PERSIST = /* #__PURE__ */ createModifier("PERSIST");
export type PERSIST = StaticModifier<typeof PERSIST>;

type Modifiers<TOptions extends RedisModifier[] = RedisModifier[]> = [
  TOptions,
] extends [RedisModifier[]]
  ? (RedisModifier | undefined)[]
  : TOptions extends [
        infer First extends RedisModifier,
        ...infer Rest extends RedisModifier[],
      ]
    ? Rest extends []
      ? [First]
      : (
            First extends { $$required: infer Req }
              ? true extends Req
                ? First
                : First | undefined
              : First | undefined
          ) extends infer Modifier
        ?
            | [Modifier, ...UndefinedElements<Rest>]
            | [Modifier, ...Modifiers<Rest>]
            | Modifiers<Rest>
        : never
    : never;

/** For modifiers that affect which overload is used. */
type Require<T extends RedisModifier> = T & {
  $$required?: true;
};

type UndefinedElements<T extends unknown[]> = { [K in keyof T]?: undefined };
