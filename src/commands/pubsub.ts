import { TSchema } from "@sinclair/typebox";
import { RedisChannel } from "../channel";
import { RedisCommand } from "../command";
import { Value } from "../key";

/**
 * Publish a message to a channel.
 */
export function PUBLISH<T extends TSchema>(
  channel: RedisChannel<T>,
  message: Value<T>,
) {
  return new RedisCommand<number>([
    "PUBLISH",
    channel.text,
    channel.encode(message),
  ]);
}
