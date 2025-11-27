import type { connect } from "cloudflare:sockets";

export type RedisResponse = Uint8Array | number | null | RedisResponse[];

export type StringifyRedisResponse =
  | string
  | number
  | null
  | StringifyRedisResponse[];

export type RedisConnectionOptions =
  | {
      url: string;
    }
  | {
      hostname: string;
      port: string | number;
      username?: string;
      password?: string;
      database?: string;
    };

export type RedisClientOptions = {
  tls?: boolean;
  connectFn?: typeof connect;
  onReply?: (reply: RedisResponse) => boolean;
} & RedisConnectionOptions;

export interface CreateParserOptions {
  onReply: (reply: RedisResponse) => void;
  onError: (err: Error) => void;
}

export type Redis = ((
  cmd: string,
  ...args: (string | number | Buffer)[]
) => Promise<string | null>) & {
  raw: (
    cmd: string,
    ...args: (string | number | Buffer)[]
  ) => Promise<Buffer | null>;
};

export type Socket = ReturnType<typeof connect>;

export interface ConnectionInstance {
  writer: WritableStreamDefaultWriter<any>;
  reader: ReadableStreamDefaultReader<any>;
  socket: Socket;
}
