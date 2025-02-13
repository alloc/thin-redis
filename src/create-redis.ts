import { RedisClient } from "./client";
import type { CreateRedisOptions } from "./type";

export function createRedis(options: CreateRedisOptions | string) {
  return new RedisClient(
    typeof options === "string"
      ? {
          url: options,
        }
      : options,
  );
}
