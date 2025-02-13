import { Static, TNumber, TString, TUint8Array } from "@sinclair/typebox";

export type TRedisValue = TNumber | TString | TUint8Array;
export type RedisValue = Static<TRedisValue>;

export class RedisCommand<TResult = unknown> {
  constructor(
    readonly args: [string, ...RedisValue[]],
    readonly decode?: (result: unknown) => TResult,
  ) {}
}
