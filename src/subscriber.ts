import { TAnySchema, TSchema } from "@sinclair/typebox";
import { RedisClient } from "./client";
import { createRedis } from "./create-redis";
import { RedisKey, Value } from "./key";
import { RedisClientOptions } from "./type";

type RedisInstance = ReturnType<typeof createRedis>;

interface MessageHandler<T extends TSchema = TAnySchema> {
  (message: Value<T>, channel: string): void;
}

export class Subscriber {
  private client: RedisInstance;
  private subscriptions = new Map<string, Set<MessageHandler>>();

  constructor(options: RedisClientOptions) {
    this.client = new RedisClient({
      ...options,
      onReply(reply) {
        console.log("onReply: %O", reply);
        // this.dispatchMessage(reply);
        return false;
      },
    });
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async subscribe(
    channel: string,
    handler: MessageHandler,
  ): Promise<() => void>;

  async subscribe<T extends TSchema>(
    channel: RedisKey<T>,
    handler: MessageHandler<T>,
  ): Promise<() => void>;

  async subscribe(
    channel: string | RedisKey<TAnySchema>,
    handler: MessageHandler,
  ): Promise<() => void> {
    if (typeof channel !== "string") {
      channel = channel.text;
    }
    let handlers = this.subscriptions.get(channel);
    if (!handlers) {
      handlers = new Set();
      this.subscriptions.set(channel, handlers);
      await this.client.sendRaw("SUBSCRIBE", channel);
    }
    handlers.add(handler);
    return () => this.unsubscribe(channel, handler);
  }

  async unsubscribe(channel: string, handler: MessageHandler): Promise<void>;

  async unsubscribe<T extends TSchema>(
    channel: RedisKey<T>,
    handler: MessageHandler<T>,
  ): Promise<void>;

  async unsubscribe(
    channel: string | RedisKey<TAnySchema>,
    handler: MessageHandler,
  ): Promise<void> {
    if (typeof channel !== "string") {
      channel = channel.text;
    }
    const handlers = this.subscriptions.get(channel);
    if (handlers?.delete(handler) && handlers.size === 0) {
      this.subscriptions.delete(channel);

      if (this.subscriptions.size === 0) {
        await this.close();
      } else {
        await this.client.sendRaw("UNSUBSCRIBE", channel);
      }
    }
  }

  private dispatchMessage(channel: string, message: string): void {
    const handlers = this.subscriptions.get(channel);
    if (handlers) {
      handlers.forEach((handler: MessageHandler) => handler(message, channel));
    }
  }
}
