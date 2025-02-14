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
 * Set a timeout (in seconds) on a given key. After the timeout has
 * expired, the key will automatically be deleted.
 */
export function EXPIRE(
  key: RedisKey<any>,
  timeout: number,
  ...modifiers: Modifiers<[XX | NX | GT | LT]>
) {
  return new RedisCommand<boolean>(
    ["EXPIRE", key.text, timeout, ...encodeModifiers(modifiers)],
    (result) => result === 1,
  );
}

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
): RedisCommand<boolean>;

export function SET(
  key: RedisKey<any>,
  value: Value<any>,
  ...modifiers: Modifiers
): RedisCommand<any> {
  return new RedisCommand(
    ["SET", key.text, key.encode(value), ...encodeModifiers(modifiers)],
    modifiers.some((m) => m?.token === "GET")
      ? (result) => (result !== null ? key.decode(result) : result)
      : (result) => result === "OK",
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
// Set commands
//

/**
 * Add one or more members to a set
 */
export function SADD<T extends TSchema>(
  key: RedisKey<T>,
  ...members: [Value<T>, ...Value<T>[]]
) {
  return new RedisCommand<number>([
    "SADD",
    key.text,
    ...members.map((member) => key.encode(member)),
  ]);
}

/**
 * Get the number of members in a set (AKA its cardinality).
 */
export function SCARD<T extends TSchema>(key: RedisKey<T>) {
  return new RedisCommand<number>(["SCARD", key.text]);
}

/**
 * Return the difference between multiple sets
 */
export function SDIFF<T extends TSchema>(
  ...keys: [RedisKey<T>, ...RedisKey<T>[]]
) {
  return new RedisCommand<Value<T>[]>(
    ["SDIFF", ...keys.map((key) => key.text)],
    (reply: unknown[]) => reply.map((value) => keys[0].decode(value)),
  );
}

/**
 * Return the intersection of multiple sets
 */
export function SINTER<T extends TSchema>(
  ...keys: [RedisKey<T>, ...RedisKey<T>[]]
) {
  return new RedisCommand<Value<T>[]>(
    ["SINTER", ...keys.map((key) => key.text)],
    (reply: unknown[]) => reply.map((value) => keys[0].decode(value)),
  );
}

/**
 * Check if member is a member of the set
 */
export function SISMEMBER<T extends TSchema>(
  key: RedisKey<T>,
  member: Value<T>,
) {
  return new RedisCommand<boolean>(
    ["SISMEMBER", key.text, key.encode(member)],
    (reply) => reply === 1,
  );
}

/**
 * Get all members in a set
 */
export function SMEMBERS<T extends TSchema>(key: RedisKey<T>) {
  return new RedisCommand<Value<T>[]>(
    ["SMEMBERS", key.text],
    (reply: unknown[]) => reply.map((value) => key.decode(value)),
  );
}

/**
 * Remove and return a random member from a set
 */
export function SPOP<T extends TSchema>(
  key: RedisKey<T>,
): RedisCommand<Value<T> | null>;

/**
 * Remove and return one or multiple random members from a set
 */
export function SPOP<T extends TSchema>(
  key: RedisKey<T>,
  count: number,
): RedisCommand<Value<T>[]>;

export function SPOP<T extends TSchema>(key: RedisKey<T>, count?: number) {
  return new RedisCommand<Value<T> | Value<T>[] | null>(
    count ? ["SPOP", key.text, count.toString()] : ["SPOP", key.text],
    (reply) => {
      if (reply === null) return null;
      return Array.isArray(reply)
        ? reply.map((value) => key.decode(value))
        : key.decode(reply);
    },
  );
}

/**
 * Remove one or more members from a set
 */
export function SREM<T extends TSchema>(
  key: RedisKey<T>,
  ...members: Value<T>[]
) {
  return new RedisCommand<number>([
    "SREM",
    key.text,
    ...members.map((member) => key.encode(member)),
  ]);
}

/**
 * Return the union of multiple sets
 */
export function SUNION<T extends TSchema>(...keys: RedisKey<T>[]) {
  return new RedisCommand<Value<T>[]>(
    ["SUNION", ...keys.map((key) => key.text)],
    (reply: unknown[]) => reply.map((value) => keys[0].decode(value)),
  );
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

/** Set expiry only when the new expiry is greater than current one */
export const GT = /* #__PURE__ */ createModifier("GT");
export type GT = StaticModifier<typeof GT>;

/** Set expiry only when the new expiry is less than current one */
export const LT = /* #__PURE__ */ createModifier("LT");
export type LT = StaticModifier<typeof LT>;

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
