export type RedisValue = number | string | Uint8Array;

export class RedisCommand<TResult = unknown> {
  constructor(
    readonly args: [string, ...RedisValue[]],
    readonly decode?: (result: any) => TResult,
  ) {}
}

export type Materialize<TCommands extends (RedisCommand | undefined)[]> = {
  [I in keyof TCommands]: TCommands[I] extends infer TCommand
    ? TCommand extends RedisCommand<infer TResult>
      ? TResult
      : undefined
    : never;
};
