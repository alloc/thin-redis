import { TAnySchema, TSchema } from "@sinclair/typebox";
import { castArray } from "radashi";
import { RedisChannel, RedisChannelPattern } from "./channel";
import { RedisClient } from "./client";
import { RedisCommand, RedisValue } from "./command";
import { Value } from "./key";
import { RedisClientOptions } from "./type";
import { stringifyResult } from "./utils/stringify-result";

export interface SubscribeCallback<T extends TSchema = TAnySchema> {
  (
    message: Value<T>,
    channel: string,
    pattern: RedisChannel<T> | RedisChannelPattern<T>,
  ): void;
}

type SubscriptionKey<T extends TSchema = TAnySchema> =
  | RedisChannel<T>
  | RedisChannelPattern<T>;

type SubscriptionMap<Key extends SubscriptionKey = SubscriptionKey> = Map<
  string,
  SubscriptionState<Key>
>;

type SubscriptionState<Key extends SubscriptionKey = SubscriptionKey> = {
  subscribePromise: Promise<void> | null;
  streams: Map<
    TransformStream,
    {
      key: Key;
      writer: WritableStreamDefaultWriter<MessageEvent>;
    }
  >;
};

type MessageReply = ["message", channel: string, payload: RedisValue];

type PMessageReply = [
  "pmessage",
  pattern: string,
  channel: string,
  payload: RedisValue,
];

export class Subscriber {
  private client: RedisClient;
  private subs: SubscriptionMap<RedisChannel> = new Map();
  private psubs: SubscriptionMap<RedisChannelPattern> = new Map();

  constructor(options: RedisClientOptions) {
    this.client = new RedisClient({
      ...options,
      onReply: (reply) => {
        const decodedReply = stringifyResult(reply);
        if (!Array.isArray(decodedReply)) {
          return false;
        }
        switch (decodedReply[0]) {
          case "message": {
            const [, channel, payload] = decodedReply as MessageReply;
            this.dispatch(channel, payload, this.subs.get(channel));
            return true;
          }
          case "pmessage": {
            const [, pattern, channel, payload] = decodedReply as PMessageReply;
            this.dispatch(channel, payload, this.psubs.get(pattern));
            return true;
          }
        }
        return false;
      },
    });
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  subscribe(
    keys: SubscriptionKey | readonly SubscriptionKey[],
    signal?: AbortSignal,
  ): ReadableStream<any> {
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    keys = castArray(keys);

    for (const key of keys) {
      let subs: SubscriptionMap;
      let command: string;
      if (key instanceof RedisChannel) {
        subs = this.subs;
        command = "SUBSCRIBE";
      } else {
        subs = this.psubs;
        command = "PSUBSCRIBE";
      }

      let state = subs.get(key.text);
      if (!state) {
        state = {
          streams: new Map(),
          subscribePromise: this.client
            .sendRaw(new RedisCommand([command, key.text]))
            .then(() => {
              state!.subscribePromise = null;
            }),
        };
        subs.set(key.text, state);
      }

      state.streams.set(stream, {
        key,
        writer,
      });

      state.subscribePromise?.catch((error) => {
        stream.writable.abort(error);
      });
    }

    const self = this;
    stream.readable.cancel = async function (reason) {
      this.cancel = Object.getPrototypeOf(this).cancel;

      let cancelling: Promise<void> | undefined;
      if (!this.locked) {
        cancelling = this.cancel(reason);
      }

      for (const key of keys) {
        let subs: SubscriptionMap;
        let command: string;
        if (key instanceof RedisChannel) {
          subs = self.subs;
          command = "UNSUBSCRIBE";
        } else {
          subs = self.psubs;
          command = "PUNSUBSCRIBE";
        }

        const state = subs.get(key.text);
        if (state && state.streams.delete(stream) && state.streams.size === 0) {
          subs.delete(key.text);

          if (subs.size === 0) {
            await self.close();
          } else {
            await self.client.sendRaw(new RedisCommand([command, key.text]));
          }
        }
      }

      await cancelling;
    };

    signal?.addEventListener("abort", () => {
      stream.readable.cancel(signal.reason);
    });

    return stream.readable;
  }

  private dispatch(
    channel: string,
    message: RedisValue,
    state: SubscriptionState | undefined,
  ): void {
    state?.streams.forEach(({ key, writer }, stream) => {
      writer.write(new MessageEvent(message, channel, key, stream));
    });
  }
}

/**
 * Message events are streamed from a `client.subscribe` call.
 */
export class MessageEvent<T extends TSchema = TAnySchema> {
  #stream: TransformStream;

  constructor(
    readonly data: Value<T>,
    readonly channel: string,
    readonly key: SubscriptionKey<T>,
    stream: TransformStream,
  ) {
    this.#stream = stream;
  }

  /**
   * Stop receiving messages from the stream.
   */
  cancel(reason?: any) {
    this.#stream.readable.cancel(reason);
  }
}
