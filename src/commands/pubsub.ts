import { StaticEncode, TSchema } from "@sinclair/typebox";
import { RedisChannel } from "../channel";
import { RedisCommand } from "../command";

/**
 * Publish a message to a channel.
 */
export function PUBLISH<T extends TSchema>(
  channel: RedisChannel<T>,
  message: StaticEncode<T>,
) {
  return new RedisCommand<number>([
    "PUBLISH",
    channel.name,
    channel.encode(message),
  ]);
}
