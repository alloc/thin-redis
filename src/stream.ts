import {
  StaticEncode,
  TObject,
  TRecord,
  TSchema,
  TString,
} from "@sinclair/typebox";
import { RedisValue } from "./command";
import { RedisKey, RedisKeyspace } from "./key";

/** Any valid schema for a Redis stream entry. */
export type TRedisStreamEntry =
  | TObject<Record<string, TSchema>>
  | TRecord<TString, TSchema>;

export type ReadStreamSpecialId = "$" | "+" | ">";

export type RedisStreamPosition<
  T extends TRedisStreamEntry = TRedisStreamEntry,
> = {
  $$typeof: "RedisStreamPosition";
  stream: RedisStream<T>;
  id: ReadStreamSpecialId | (string & {});
};

export class RedisStream<
  T extends TRedisStreamEntry = TRedisStreamEntry,
  K extends string | RedisKeyspace = string,
> extends RedisKey<T, K> {
  declare $$typeof: "RedisKey" & { subtype: "RedisStream" };

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
  position(id: ReadStreamSpecialId | (string & {})): RedisStreamPosition<T> {
    return { stream: this, id } as any;
  }
}

export class RedisConsumerGroup {
  declare $$typeof: "RedisConsumerGroup";
  constructor(readonly name: string) {}
}

export class RedisStreamEntry<T extends TRedisStreamEntry = TRedisStreamEntry> {
  declare $$typeof: "RedisStreamEntry";
  readonly data: StaticEncode<T>;
  constructor(
    /** The stream this entry belongs to */
    readonly stream: RedisStream<T, string>,
    /** The ID of this entry */
    readonly id: string,
    /** The fields and values of this entry */
    entry: RedisValue[],
  ) {
    const data: Record<string, RedisValue> = {};
    for (let i = 0; i < entry.length; i += 2) {
      data[entry[i] as string] = entry[i + 1];
    }
    this.data = this.stream.decode(data) as any;
  }
}
