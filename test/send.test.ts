import { Type } from "@sinclair/typebox";
import {
  DEL,
  GET,
  PING,
  RedisClient,
  RedisCommand,
  RedisKey,
  SET,
} from "../src";

test("send", async () => {
  const redis = new RedisClient({
    url: "redis://localhost:6379/0",
  });

  const encoder = new TextEncoder();

  const PONG = encoder.encode("PONG");

  expect(await redis.sendRaw(PING())).toEqual(PONG);

  const foo = new RedisKey("foo", Type.String());

  expect(await redis.send(SET(foo, "bar"))).toEqual(true);
  expect(await redis.send(GET(foo))).toEqual("bar");
  expect(await redis.send(DEL(foo))).toEqual(1);

  // sendOnce will disconnect after the command is resolved.
  expect(redis.connected).toBe(true);
  expect(await redis.sendOnce(GET(foo))).toEqual(undefined);
  expect(redis.connected).toBe(false);

  // This reconnects before sending the command.
  expect(await redis.sendOnce(PING())).toEqual("PONG");
});

test("error handling", async () => {
  const redis = new RedisClient({
    url: "redis://localhost:6379/0",
  });

  await expect(
    redis.sendOnce(new RedisCommand(["MY_GO"])),
  ).rejects.toThrowError(
    "ERR unknown command 'MY_GO', with args beginning with: ",
  );

  await redis.close();
});
