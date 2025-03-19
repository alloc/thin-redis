import { TSchema } from "@sinclair/typebox";
import { castArrayIfExists } from "radashi";
import { RedisChannel, RedisChannelPattern } from "./channel";
import { RedisCommand, RedisValue } from "./command";
import { MessageEvent, Subscriber } from "./subscriber";
import { ConnectionInstance, RedisClientOptions, RedisResponse } from "./type";
import { createParser } from "./utils/create-parser";
import { encodeCommand } from "./utils/encode-command";
import { getConnectFn } from "./utils/get-connect-fn";
import { stringifyResult } from "./utils/stringify-result";

type MaybeArray<T> = T | readonly T[];

export class RedisClient {
  #encoder = new TextEncoder();
  #decoder = new TextDecoder();
  #connected = false;
  #connection: Promise<ConnectionInstance> | null = null;
  #writeLock = Promise.resolve();
  #responseQueue: {
    resolve: (value: RedisResponse) => void;
    reject: (reason?: any) => void;
  }[] = [];
  #subscriber?: Subscriber;

  public options: RedisClientOptions;
  public config;

  private parser = createParser({
    onReply: (reply) => {
      if (this.options.onReply?.(reply)) {
        return;
      }
      this.#responseQueue.shift()?.resolve(reply);
    },
    onError: (err) => {
      this.#responseQueue.shift()?.reject(err);
    },
  });

  constructor(options: RedisClientOptions) {
    this.options = options;
    this.config = this.getConnectConfig();
  }

  public get connected() {
    return this.#connected;
  }

  public get tls() {
    return this.options.tls;
  }

  private getConnectConfig() {
    if ("url" in this.options) {
      const { hostname, port, password, pathname } = new URL(this.options.url);

      return {
        hostname,
        port: Number(port) || 6379,
        password,
        database: pathname.slice(1) || undefined,
        tls: this.options.tls ?? this.options.url.includes("rediss://"),
      };
    }

    const {
      hostname: host,
      username,
      port,
      password,
      database,
      tls,
    } = this.options;

    const resolvedPort = Number(port) || 6379;

    return {
      hostname: host,
      username,
      port: resolvedPort,
      password,
      database,
      tls,
    };
  }

  public async connect() {
    if (this.#connection) {
      return this.#connection;
    }

    this.#connection = (async () => {
      const connect = await getConnectFn(this.options.connectFn);

      const socket = connect(
        {
          hostname: this.config.hostname,
          port: this.config.port,
        },
        {
          secureTransport: this.config.tls ? "on" : "off",
          allowHalfOpen: false,
        },
      );

      await socket.opened;

      return {
        socket,
        writer: socket.writable.getWriter(),
        reader: socket.readable.getReader(),
      };
    })();

    // Listen for socket close events and parse responses.
    this.#connection.then(async (connection) => {
      try {
        while (true) {
          const result = await Promise.race([
            connection.socket.closed,
            connection.reader.read(),
          ]);
          if (!result) {
            break;
          }
          if (result.value) {
            this.parser(result.value);
          }
          if (result.done) {
            break;
          }
        }
      } finally {
        await this.close();
      }
    });

    if (this.config.password || this.config.database) {
      // AUTH and SELECT block all other commands until they are resolved.
      this.#connection = this.#connection.then(async (connection) => {
        const commands: [string, ...RedisValue[]][] = [];
        if (this.config.password) {
          const username = castArrayIfExists(this.config.username) ?? [];
          commands.push(["AUTH", ...username, this.config.password]);
        }
        if (this.config.database) {
          commands.push(["SELECT", this.config.database]);
        }

        // Wait for writing to finish...
        const promises = await this.writeCommands(commands, connection.writer);
        // Then wait for all commands to finish...
        await Promise.all(promises);

        return connection;
      });
    }

    return this.#connection;
  }

  public async sendOnce<TResult>(
    command: RedisCommand<TResult>,
  ): Promise<TResult>;

  public async sendOnce<const TResults extends any[]>(commands: {
    [I in keyof TResults]: RedisCommand<TResults[I]>;
  }): Promise<TResults>;

  public async sendOnce(command: RedisCommand | RedisCommand[]) {
    try {
      return await this.send(command);
    } finally {
      await this.close();
    }
  }

  public async sendOnceRaw(command: RedisCommand): Promise<RedisResponse>;

  public async sendOnceRaw(commands: RedisCommand[]): Promise<RedisResponse[]>;

  public async sendOnceRaw(command: RedisCommand | RedisCommand[]) {
    try {
      return await this.sendRaw(command);
    } finally {
      await this.close();
    }
  }

  public async send<TResult>(command: RedisCommand<TResult>): Promise<TResult>;

  public async send<const TResults extends any[]>(commands: {
    [I in keyof TResults]: RedisCommand<TResults[I]>;
  }): Promise<TResults>;

  public async send(command: RedisCommand | RedisCommand[]): Promise<any>;

  public async send(command: RedisCommand | RedisCommand[]) {
    if (Array.isArray(command)) {
      const rawResults = await this.sendRaw(command);
      return command.map(({ decode }, index) => {
        const rawResult = rawResults[index];
        const result = stringifyResult(rawResult);
        return decode ? decode(result) : result;
      });
    }
    const rawResult = await this.sendRaw(command);
    const result = stringifyResult(rawResult);
    return command.decode ? command.decode(result) : result;
  }

  public async sendRaw(command: RedisCommand): Promise<RedisResponse>;

  public async sendRaw(command: RedisCommand[]): Promise<RedisResponse[]>;

  public async sendRaw(command: RedisCommand | RedisCommand[]): Promise<any>;

  public async sendRaw(command: RedisCommand | RedisCommand[]) {
    const connection = await this.connect();

    let promises: Promise<RedisResponse>[];

    // Use a write lock to avoid out-of-order command execution.
    await (this.#writeLock = this.#writeLock.then(async () => {
      promises = await this.writeCommands(
        Array.isArray(command) ? command.map((c) => c.args) : [command.args],
        connection.writer,
      );
    }));

    const results = await Promise.all(promises!);
    if (Array.isArray(command)) {
      return results;
    }
    return results[0];
  }

  private async writeCommands(
    commands: [string, ...RedisValue[]][],
    writer: WritableStreamDefaultWriter<Uint8Array>,
  ) {
    const chunks: Array<string | Uint8Array> = [];
    const promises = commands.map((command) => {
      encodeCommand(command, chunks);
      return new Promise<RedisResponse>((resolve, reject) => {
        this.#responseQueue.push({ resolve, reject });
      });
    });
    for (const chunk of chunks) {
      await writer.write(
        chunk instanceof Uint8Array ? chunk : this.#encoder.encode(chunk),
      );
    }
    return promises;
  }

  /**
   * Subscribe to a channel or pattern. Returns a readable stream of
   * `MessageEvent` objects, which can be `for await`ed.
   *
   * You may unsubscribe through the `ReadableStream#cancel` or
   * `MessageEvent#cancel` methods.
   */
  subscribe<T extends TSchema>(
    pattern: MaybeArray<RedisChannel<T> | RedisChannelPattern<T>>,
    signal?: AbortSignal,
  ): ReadableStream<MessageEvent<T>> {
    const subscriber = (this.#subscriber ??= new Subscriber(this.options));
    return subscriber.subscribe(pattern, signal);
  }

  public async close(err?: Error) {
    if (!this.#connection) return;

    const connection = await this.#connection;
    this.#connection = null;
    this.#writeLock = Promise.resolve();

    await connection.socket.close();
    await connection.writer.abort(err);
    await connection.reader.cancel(err);
  }

  public async closeSubscriptions() {
    if (!this.#subscriber) return;

    await this.#subscriber.close();
    this.#subscriber = undefined;
  }
}
