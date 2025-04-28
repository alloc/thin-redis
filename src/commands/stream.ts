import { TSchema } from "@sinclair/typebox";
import { RedisCommand, RedisValue } from "../command";
import { Value } from "../key";
import { encodeModifiers, Modifiers, Require } from "../modifier";
import { MAXLEN, MINID, NOMKSTREAM } from "../modifiers";
import { RedisStream } from "../stream";

export * as XGROUP from "./stream/xgroup";

/**
 * Appends the specified stream entry to the stream at the specified key.
 * If the key does not exist, it is created.
 *
 * @returns The ID of the added entry
 * @see https://redis.io/commands/xadd
 */
export function XADD<TField extends TSchema, TValue extends TSchema>(
  stream: RedisStream<TField, TValue>,
  id: string | "*",
  entries: readonly (Value<TField> | Value<TValue>)[],
  ...modifiers: Modifiers<[MAXLEN | MINID]>
): RedisCommand<string>;

/**
 * Appends the specified stream entry to the stream at the specified key.
 * Do not create the stream if it does not exist.
 *
 * @see https://redis.io/commands/xadd
 */
export function XADD<TField extends TSchema, TValue extends TSchema>(
  stream: RedisStream<TField, TValue>,
  id: string | "*",
  entries: readonly (Value<TField> | Value<TValue>)[],
  ...modifiers: Modifiers<[Require<NOMKSTREAM>, MAXLEN | MINID]>
): RedisCommand<null>;

export function XADD(
  stream: RedisStream,
  id: string | "*",
  entries: readonly RedisValue[],
  ...modifiers: Modifiers<any>
): RedisCommand<any> {
  return new RedisCommand([
    "XADD",
    stream.name,
    ...encodeModifiers(modifiers),
    id,
    ...stream.encodeEntries(entries),
  ]);
}
