import { Static, TNumber, TSchema } from "@sinclair/typebox";
import { RedisChannel } from "./channel";
import { RedisCommand, RedisValue } from "./command";
import { RedisField, RedisKey, Value } from "./key";
import { encodeModifiers, Modifiers, RedisModifier, Require } from "./modifier";

export * as FT from "./commands/full-text";
export * as JSON from "./commands/json";

/** Return the previous value stored at this key */
export type GET = RedisModifier<"GET">;

/** Get the value of a key */
export function GET<T extends TSchema>(
  key: RedisKey<T>,
): RedisCommand<Value<T> | undefined>;

/** Return the previous value stored at this key */
export function GET(): GET;

export function GET<T extends TSchema>(
  key?: RedisKey<T>,
): GET | RedisCommand<Value<T> | undefined> {
  if (!key) {
    return new RedisModifier("GET");
  }
  return new RedisCommand(["GET", key.text], (result) =>
    result !== null ? key.decode(result) : undefined,
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
 * Remove all keys from all databases
 *
 * @param mode By default, `FLUSHALL` is synchronous. Use `async` to make
 * it asynchronous.
 */
export function FLUSHALL(mode?: "sync" | "async") {
  return new RedisCommand<string>(["FLUSHALL", mode?.toUpperCase() ?? "SYNC"]);
}

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
  return new RedisCommand<Value<T> | undefined>(
    ["GETEX", key.text, ...encodeModifiers(modifiers)],
    (result) => (result !== null ? key.decode(result) : undefined),
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
): RedisCommand<Value<T> | undefined>;

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
      ? (result) => (result !== null ? key.decode(result) : undefined)
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
  channel: RedisChannel<T>,
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
): RedisCommand<Value<T> | undefined>;

/**
 * Remove and return one or multiple random members from a set
 */
export function SPOP<T extends TSchema>(
  key: RedisKey<T>,
  count: number,
): RedisCommand<Value<T>[]>;

export function SPOP<T extends TSchema>(key: RedisKey<T>, count?: number) {
  return new RedisCommand<Value<T> | Value<T>[] | undefined>(
    count ? ["SPOP", key.text, count.toString()] : ["SPOP", key.text],
    (reply) => {
      if (reply === null) return undefined;
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
// Miscellaneous commands
//

/**
 * Ping the server
 */
export function PING(message?: string) {
  return new RedisCommand<string>(message ? ["PING", message] : ["PING"]);
}
