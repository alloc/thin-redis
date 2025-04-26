import { RedisCommand } from "./command";

export * from "./commands/hash";
export * from "./commands/pubsub";
export * from "./commands/read";
export * from "./commands/set";
export * from "./commands/write";

export * as FT from "./commands/full-text";
export * as JSON from "./commands/json";

//
// Miscellaneous commands
//

/**
 * Ping the server
 */
export function PING(message?: string) {
  return new RedisCommand<string>(message ? ["PING", message] : ["PING"]);
}
