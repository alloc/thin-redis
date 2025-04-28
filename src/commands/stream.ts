import { TAnySchema, TSchema } from "@sinclair/typebox";
import { castArray, isArray } from "radashi";
import { RedisCommand, RedisValue } from "../command";
import { Value } from "../key";
import { encodeModifiers, Modifiers, Require } from "../modifier";
import { BLOCK, COUNT, MAXLEN, MINID, NOACK, NOMKSTREAM } from "../modifiers";
import {
  RedisConsumerGroup,
  RedisStream,
  RedisStreamEntry,
  RedisStreamPosition,
} from "../stream";

export * as XGROUP from "./stream/xgroup";

/**
 * Removes one or more entries from a pending message list.
 *
 * @returns The number of entries actually removed
 * @see https://redis.io/commands/xack
 */
export function XACK(
  stream: RedisStream,
  group: RedisConsumerGroup,
  ...ids: [string, ...string[]]
): RedisCommand<number> {
  return new RedisCommand(["XACK", stream.name, group.name, ...ids]);
}

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

/**
 * Removes the specified entries from a stream.
 *
 * @returns The number of entries actually deleted
 * @see https://redis.io/commands/xdel
 */
export function XDEL(
  stream: RedisStream,
  ...ids: [string, ...string[]]
): RedisCommand<number> {
  return new RedisCommand(["XDEL", stream.name, ...ids]);
}

/**
 * Reads data from a stream.
 *
 * @see https://redis.io/commands/xread
 */
export function XREAD<TField extends TSchema, TValue extends TSchema>(
  sources: Source<TField, TValue>,
  ...modifiers: Modifiers<[COUNT, BLOCK]>
): RedisCommand<RedisStreamEntry<TField, TValue>[]>;

/**
 * Reads data from one or more streams.
 *
 * @see https://redis.io/commands/xread
 */
export function XREAD<TSources extends readonly [Source, ...Source[]]>(
  sources: TSources,
  ...modifiers: Modifiers<[COUNT, BLOCK]>
): RedisCommand<{
  [K in keyof TSources]: TSources[K] extends Source<infer TField, infer TValue>
    ? RedisStreamEntry<TField, TValue>[]
    : never;
}>;

export function XREAD(
  sources: Source | readonly Source[],
  ...modifiers: Modifiers<any>
) {
  return new RedisCommand<any[]>(
    ["XREAD", ...encodeModifiers(modifiers), ...encodeSources(sources)],
    (response) => decodeStreamResponse(sources, response),
  );
}

/**
 * Reads data from a stream, using a consumer group.
 *
 * @see https://redis.io/commands/xreadgroup
 */
export function XREADGROUP<TField extends TSchema, TValue extends TSchema>(
  group: RedisConsumerGroup,
  consumer: string,
  sources: Source<TField, TValue>,
  ...modifiers: Modifiers<[COUNT, BLOCK, NOACK]>
): RedisCommand<RedisStreamEntry<TField, TValue>[]>;

/**
 * Reads data from one or more streams, using a consumer group.
 *
 * @see https://redis.io/commands/xreadgroup
 */
export function XREADGROUP<TSources extends readonly [Source, ...Source[]]>(
  group: RedisConsumerGroup,
  consumer: string,
  sources: TSources,
  ...modifiers: Modifiers<[COUNT, BLOCK, NOACK]>
): RedisCommand<{
  [K in keyof TSources]: TSources[K] extends Source<infer TField, infer TValue>
    ? RedisStreamEntry<TField, TValue>[]
    : never;
}>;

export function XREADGROUP<TField extends TSchema, TValue extends TSchema>(
  group: RedisConsumerGroup,
  consumer: string,
  sources: Source<TField, TValue> | readonly Source<TField, TValue>[],
  ...modifiers: Modifiers<[COUNT, BLOCK, NOACK]>
) {
  return new RedisCommand([
    "XREADGROUP",
    "GROUP",
    group.name,
    consumer,
    ...encodeModifiers(modifiers),
    "STREAMS",
    ...encodeSources(sources),
  ]);
}

type Source<
  TField extends TSchema = TAnySchema,
  TValue extends TSchema = TAnySchema,
> = RedisStream<TField, TValue> | RedisStreamPosition<TField, TValue>;

function encodeSources(sources: Source | readonly Source[]) {
  const streams: string[] = [];
  const cursors: string[] = [];
  for (const source of castArray(sources)) {
    if (source instanceof RedisStream) {
      streams.push(source.name);
      cursors.push("0");
    } else {
      streams.push(source.stream.name);
      cursors.push(source.id);
    }
  }
  return [...streams, ...cursors];
}

function decodeStreamResponse(
  sources: Source | readonly Source[],
  response: [string, [string, RedisValue[]][]][] | null,
) {
  if (isArray(sources)) {
    return sources.map(
      (_, index) =>
        response?.[index][1].map(
          ([id, data]) =>
            new RedisStreamEntry(castIndexToStream(sources, index), id, data),
        ) ?? [],
    );
  }
  const stream = castIndexToStream(sources, 0);
  return (
    response?.[0][1].map(
      ([id, data]) => new RedisStreamEntry(stream, id, data),
    ) ?? []
  );
}

function castIndexToStream<TField extends TSchema, TValue extends TSchema>(
  sources: Source<TField, TValue> | readonly Source<TField, TValue>[],
  index: number,
): RedisStream<TField, TValue> {
  const source = isArray(sources) ? sources[index] : sources;
  return source instanceof RedisStream ? source : source.stream;
}
