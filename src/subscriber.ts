import { TAnySchema, TSchema } from "@sinclair/typebox";
import { RedisClient } from "./client";
import { RedisKey, Value } from "./key";
import { RedisClientOptions } from "./type";

export interface SubscribeCallback<T extends TSchema = TAnySchema> {
  (message: Value<T>, channel: string): void;
}

export type SubscribeOptions = {
  once?: boolean;
};

export class Subscriber {
  private client: RedisClient;
  private callbackMap: Map<
    string,
    Map<SubscribeCallback, SubscribeOptions | undefined>
  > = new Map();

  constructor(options: RedisClientOptions) {
    this.client = new RedisClient({
      ...options,
      onReply(reply) {
        console.log("onReply: %O", reply);
        // this.dispatch(reply);
        return false;
      },
    });
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async subscribe(
    channel: string | RedisKey<TAnySchema>,
    callback: SubscribeCallback,
    options?: SubscribeOptions,
  ): Promise<() => void> {
    if (typeof channel !== "string") {
      channel = channel.text;
    }
    let callbacks = this.callbackMap.get(channel);
    if (!callbacks) {
      callbacks = new Map();
      this.callbackMap.set(channel, callbacks);
      await this.client.sendRaw("SUBSCRIBE", channel);
    }
    callbacks.set(callback, options);
    return () => this.unsubscribe(channel, callback);
  }

  async unsubscribe(
    channel: string | RedisKey<TAnySchema>,
    callback: SubscribeCallback,
  ): Promise<void> {
    if (typeof channel !== "string") {
      channel = channel.text;
    }
    const callbacks = this.callbackMap.get(channel);
    if (callbacks?.delete(callback) && callbacks.size === 0) {
      this.callbackMap.delete(channel);

      if (this.callbackMap.size === 0) {
        await this.close();
      } else {
        await this.client.sendRaw("UNSUBSCRIBE", channel);
      }
    }
  }

  private dispatch(channel: string, message: string): void {
    const callbacks = this.callbackMap.get(channel);
    if (callbacks) {
      callbacks.forEach((options, callback) => {
        if (options?.once) {
          this.unsubscribe(channel, callback);
        }
        callback(message, channel);
      });
    }
  }
}
