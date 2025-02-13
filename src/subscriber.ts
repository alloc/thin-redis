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

  async subscribe<T extends TSchema>(
    channel: RedisKey<T>,
    handler: MessageHandler<T>,
  ): Promise<() => void> {
    let handlers = this.subscriptions.get(channel.text);
    if (!handlers) {
      handlers = new Set();
      this.subscriptions.set(channel.text, handlers);
      await this.client.sendRaw("SUBSCRIBE", channel.text);
    }
    handlers.add(handler);
    return () => this.unsubscribe(channel, handler);
  }

  async unsubscribe<T extends TSchema>(
    channel: RedisKey<T>,
    handler: MessageHandler<T>,
  ): Promise<void> {
    const handlers = this.subscriptions.get(channel.text);
    if (handlers?.has(handler)) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel.text);

        if (this.subscriptions.size === 0) {
          await this.close();
        } else {
          await this.client.sendRaw("UNSUBSCRIBE", channel.text);
        }
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
