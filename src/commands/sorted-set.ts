import { StaticEncode, TSchema } from "@sinclair/typebox";
import { RedisCommand, RedisValue } from "../command";
import { RedisSortedSet, RedisSortedSetEntry } from "../key";

/**
 * Adds entries to a sorted set.
 *
 * If the no entries are provided, an error is thrown.
 *
 * @see https://redis.io/commands/zadd
 * @returns The number of elements added to the sorted set (excluding score
 * updates).
 */
export function ZADD<T extends TSchema>(
  key: RedisSortedSet<T>,
  entries: [score: number, value: StaticEncode<T>][],
) {
  if (entries.length === 0) {
    throw new Error("At least one entry is required");
  }
  const flatEntries: RedisValue[] = [];
  for (const [score, value] of entries) {
    flatEntries.push(String(score));
    flatEntries.push(key.encode(value));
  }
  return new RedisCommand<number>(["ZADD", key.name, ...flatEntries]);
}

function parseSortedSetEntry<T extends TSchema>(
  reply: [key: string, data: string, score: string],
  keys: RedisSortedSet<T>[],
) {
  const key = keys.find((key) => key.name === reply[0])!;
  return new RedisSortedSetEntry(
    key,
    key.decode(reply[1]),
    parseFloat(reply[2]),
  );
}

/**
 * Removes and returns the entry with the highest score from the first
 * non-empty sorted set, blocking until one is available or the timeout is
 * reached.
 *
 * @see https://redis.io/commands/bzpopmax
 */
export function BZPOPMAX<T extends TSchema>(
  keys: RedisSortedSet<T>[],
  timeout: number,
) {
  if (keys.length === 0) {
    throw new Error("At least one key is required");
  }
  return new RedisCommand(
    ["BZPOPMAX", ...keys.map((key) => key.name), timeout],
    (reply) => (reply !== null ? parseSortedSetEntry(reply, keys) : null),
  );
}

/**
 * Removes and returns the entry with the lowest score from the first
 * non-empty sorted set, blocking until one is available or the timeout is
 * reached.
 *
 * @see https://redis.io/commands/bzpopmin
 */
export function BZPOPMIN<T extends TSchema>(
  keys: RedisSortedSet<T>[],
  timeout: number,
) {
  if (keys.length === 0) {
    throw new Error("At least one key is required");
  }
  return new RedisCommand(
    ["BZPOPMIN", ...keys.map((key) => key.name), timeout],
    (reply) => (reply !== null ? parseSortedSetEntry(reply, keys) : null),
  );
}

/**
 * Removes the specified values from the sorted set stored at key.
 * Non-existing values are ignored.
 *
 * @see https://redis.io/commands/zrem
 */
export function ZREM<T extends TSchema>(
  key: RedisSortedSet<T>,
  ...values: [StaticEncode<T>, ...StaticEncode<T>[]]
) {
  return new RedisCommand<number>([
    "ZREM",
    key.name,
    ...values.map((value) => key.encode(value)),
  ]);
}
