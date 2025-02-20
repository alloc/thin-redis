export type RedisValue = number | string | Uint8Array;

export class RedisCommand<TResult = unknown> {
  constructor(
    readonly args: [string, ...RedisValue[]],
    readonly decode?: (result: any) => TResult,
  ) {}
}
