import { StaticEncode, TSchema } from "@sinclair/typebox";
import { RedisCommand } from "../command";
import { RedisEntity } from "../key";
import { RedisModifier } from "../modifier";

/** Return the previous value stored at this key */
export type GET = RedisModifier<"GET">;

/** Get the value of a key */
export function GET<T extends TSchema>(
  key: RedisEntity<T>,
): RedisCommand<StaticEncode<T> | undefined>;

/** Return the previous value stored at this key */
export function GET(): GET;

export function GET<T extends TSchema>(
  key?: RedisEntity<T>,
): GET | RedisCommand<StaticEncode<T> | undefined> {
  if (!key) {
    return new RedisModifier("GET");
  }
  return new RedisCommand(["GET", key.name], (result) =>
    result !== null ? key.decode(result) : undefined,
  );
}

/**
 * Get all keys that match the given pattern.
 */
export function KEYS(pattern: string) {
  return new RedisCommand<string[]>(["KEYS", pattern]);
}
