import { StaticEncode, TNumber, TSchema } from "@sinclair/typebox";
import { RedisCommand } from "../command";
import { RedisKey } from "../key";
import { encodeModifiers, Modifiers, Require } from "../modifier";
import {
  EX,
  EXAT,
  GT,
  KEEPTTL,
  LT,
  NX,
  PERSIST,
  PX,
  PXAT,
  XX,
} from "../modifiers";
import { GET } from "./read";

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
    ["EXPIRE", key.name, timeout, ...encodeModifiers(modifiers)],
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
  return new RedisCommand<StaticEncode<T> | undefined>(
    ["GETEX", key.name, ...encodeModifiers(modifiers)],
    (result) => (result !== null ? key.decode(result) : undefined),
  );
}

/**
 * Set the value of a key and optionally set its expiration.
 */
export function SET<T extends TSchema>(
  key: RedisKey<T>,
  value: StaticEncode<T>,
  ...modifiers: Modifiers<
    [NX | XX, Require<GET>, EX | PX | EXAT | PXAT | KEEPTTL]
  >
): RedisCommand<StaticEncode<T> | undefined>;

export function SET<T extends TSchema>(
  key: RedisKey<T>,
  value: StaticEncode<T>,
  ...modifiers: Modifiers<[NX | XX, EX | PX | EXAT | PXAT | KEEPTTL]>
): RedisCommand<boolean>;

export function SET(
  key: RedisKey<any>,
  value: StaticEncode<any>,
  ...modifiers: Modifiers
): RedisCommand<any> {
  return new RedisCommand(
    ["SET", key.name, key.encode(value), ...encodeModifiers(modifiers)],
    modifiers.some((m) => m?.token === "GET")
      ? (result) => (result !== null ? key.decode(result) : undefined)
      : (result) => result === "OK",
  );
}

/**
 * Delete a key or multiple keys.
 */
export function DEL(...keys: [RedisKey, ...RedisKey[]]) {
  return new RedisCommand<number>(["DEL", ...keys.map((k) => k.name)]);
}

/**
 * Decrement the value of a key by 1.
 */
export function DECR(key: RedisKey<TNumber>) {
  return new RedisCommand<number>(["DECR", key.name]);
}

/**
 * Decrement the value of a key by a specific amount.
 */
export function DECRBY(key: RedisKey<TNumber>, amount: number) {
  return new RedisCommand<number>(["DECRBY", key.name, amount]);
}

/**
 * Increment the value of a key by 1.
 */
export function INCR(key: RedisKey<TNumber>) {
  return new RedisCommand<number>(["INCR", key.name]);
}

/**
 * Increment the value of a key by a specific amount.
 */
export function INCRBY(key: RedisKey<TNumber>, amount: number) {
  return new RedisCommand<number>(["INCRBY", key.name, amount]);
}
