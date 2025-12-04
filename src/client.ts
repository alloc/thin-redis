import { castArrayIfExists } from "radashi";
import { RedisChannel, RedisChannelPattern } from "./channel";
import { Materialize, RedisCommand, RedisValue } from "./command";
import { ExtractMessageEvent, Subscriber } from "./subscriber";
import { RedisClientOptions, RedisResponse } from "./type";
import { createParser } from "./utils/create-parser";
import { encodeCommand } from "./utils/encode-command";
import { getConnectFn } from "./utils/get-connect-fn";
import { stringifyResult } from "./utils/stringify-result";

type MaybeArray<T> = T | readonly T[];

export class RedisClient {
  #encoder = new TextEncoder();
  #connected = false;
  #connection: Promise<Socket> | null = null;
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

      socket.closed.then(this.onClose, this.onClose);
      await socket.opened;

      return socket;
    })();

    // Listen for socket close events and parse responses.
    this.#connection.then(async (socket) => {
      const reader = socket.readable.getReader();
      while (true) {
        const result = await reader.read().catch(() => null);
        if (!result) {
          break;
        }
        if (result.value) {
          this.parser(result.value);
        }
        if (result.done) {
          reader.releaseLock();
          break;
        }
      }
    });

    if (this.config.password || this.config.database) {
      // AUTH and SELECT block all other commands until they are resolved.
      this.#connection = this.#connection.then(async (socket) => {
        const commands: [string, ...RedisValue[]][] = [];
        if (this.config.password) {
          const username = castArrayIfExists(this.config.username) ?? [];
          commands.push(["AUTH", ...username, this.config.password]);
        }
        if (this.config.database) {
          commands.push(["SELECT", this.config.database]);
        }

        // Wait for writing to finish...
        const promises = await this.writeCommands(commands, socket);
        // Then wait for all commands to finish...
        await Promise.all(promises);

        return socket;
      });
    }

    return this.#connection;
  }

  public async send<TResult>(command: RedisCommand<TResult>): Promise<TResult>;

  public async send<const TCommands extends (RedisCommand | undefined)[]>(
    commands: TCommands,
  ): Promise<Materialize<TCommands>>;

  public async send(
    command: RedisCommand | (RedisCommand | undefined)[],
  ): Promise<any>;

  public async send(command: RedisCommand | (RedisCommand | undefined)[]) {
    if (Array.isArray(command)) {
      const rawResults = await this.sendRaw(command);
      return command.map((command, index) => {
        if (!command) {
          return undefined;
        }
        const rawResult = rawResults[index];
        const result = stringifyResult(rawResult);
        return command?.decode ? command.decode(result) : result;
      });
    }
    const rawResult = await this.sendRaw(command);
    const result = stringifyResult(rawResult);
    return command.decode ? command.decode(result) : result;
  }

  public async sendRaw(command: RedisCommand): Promise<RedisResponse>;

  public async sendRaw(
    command: (RedisCommand | undefined)[],
  ): Promise<RedisResponse[]>;

  public async sendRaw(
    command: RedisCommand | (RedisCommand | undefined)[],
  ): Promise<any>;

  public async sendRaw(command: RedisCommand | (RedisCommand | undefined)[]) {
    const socket = await this.connect();

    let promises: (Promise<RedisResponse> | undefined)[];

    // Use a write lock to avoid out-of-order command execution.
    await (this.#writeLock = this.#writeLock.then(async () => {
      promises = await this.writeCommands(
        Array.isArray(command) ? command.map((c) => c?.args) : [command.args],
        socket,
      );
    }));

    const results = await Promise.all(promises!);
    if (Array.isArray(command)) {
      return results;
    }
    return results[0];
  }

  private async writeCommands(
    commands: ([string, ...RedisValue[]] | undefined)[],
    socket: Socket,
  ) {
    const stack = new Error().stack;
    const chunks: Array<string | Uint8Array> = [];
    const promises = commands.map((command) => {
      if (!command) {
        return;
      }
      encodeCommand(command, chunks);
      return new Promise<RedisResponse>((resolve, reject) => {
        this.#responseQueue.push({
          resolve,
          reject(error) {
            error.stack = stack;
            reject(error);
          },
        });
      });
    });

    const writer = socket.writable.getWriter();
    for (const chunk of chunks) {
      await writer.write(
        chunk instanceof Uint8Array ? chunk : this.#encoder.encode(chunk),
      );
    }
    writer.releaseLock();
    return promises;
  }

  /**
   * Subscribe to a channel or pattern. Returns a readable stream of
   * `MessageEvent` objects, which can be `for await`ed.
   *
   * You may unsubscribe through the `ReadableStream#cancel` or
   * `MessageEvent#cancel` methods.
   */
  public subscribe<
    TPattern extends MaybeArray<RedisChannel | RedisChannelPattern>,
  >(
    pattern: TPattern,
    signal?: AbortSignal,
  ): ReadableStream<
    ExtractMessageEvent<TPattern extends any[] ? TPattern[number] : TPattern>
  > {
    const subscriber = (this.#subscriber ??= new Subscriber(this.options));
    return subscriber.subscribe(pattern, signal);
  }

  private onClose = () => {
    this.#connection = null;
    this.#writeLock = Promise.resolve();
  };

  public async close() {
    if (!this.#connection) return;
    const socket = await this.#connection;
    await socket.close();
  }

  public async closeSubscriptions() {
    if (!this.#subscriber) return;

    await this.#subscriber.close();
    this.#subscriber = undefined;
  }
}
