import { createRedis } from "./create-redis";
import { CreateRedisOptions } from "./type";

type RedisInstance = ReturnType<typeof createRedis>;

interface MessageHandler {
  (message: string, channel: string): void;
}

export class Subscriber {
  private client: RedisInstance;
  private subscriptions = new Map<string, Set<MessageHandler>>();
  private isListening: boolean = false;

  constructor(options: CreateRedisOptions) {
    this.client = createRedis({
      ...options,
      onReply(reply) {
        console.log("onReply: %O", reply);
        // this.dispatchMessage(reply);
        return false;
      },
    });
  }

  async connect(): Promise<void> {
    if (!this.isListening) {
      this.isListening = true;
      await this.client.startConnection();
    }
  }

  async disconnect(): Promise<void> {
    this.isListening = false;
    await this.client.close();
  }

  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    let handlers = this.subscriptions.get(channel);
    if (!handlers) {
      handlers = new Set();
      this.subscriptions.set(channel, handlers);
      await this.client.sendRaw("SUBSCRIBE", channel);
    }
    handlers.add(handler);
  }

  async unsubscribe(channel: string, handler: MessageHandler): Promise<void> {
    const handlers = this.subscriptions.get(channel);
    if (handlers?.has(handler)) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);

        if (this.subscriptions.size === 0) {
          await this.disconnect();
        } else {
          await this.client.sendRaw("UNSUBSCRIBE", channel);
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
