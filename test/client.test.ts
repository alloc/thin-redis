import { Type } from "@sinclair/typebox";
import {
  DEL,
  FLUSHALL,
  FT,
  GET,
  JSON,
  ON,
  PING,
  PREFIX,
  RedisClient,
  RedisCommand,
  RedisIndexKey,
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

test("full-text-search", async () => {
  const redis = new RedisClient({
    url: "redis://localhost:6379/0",
  });

  expect(await redis.send(FLUSHALL())).toEqual("OK");

  const idx = new RedisIndexKey("idx");

  expect(
    await redis.send(
      FT.CREATE(
        idx,
        ["$..field1", "AS", "field1", "TEXT"],
        ON("json"),
        PREFIX("doc:"),
      ),
    ),
    "OK",
  ).toEqual("OK");

  expect(
    await redis.send(
      JSON.SET(new RedisKey("doc:1", Type.Any()), "$", {
        field1: "value1",
      }),
    ),
    "OK",
  ).toEqual("OK");

  const searchResult1 = await redis.send(FT.SEARCH(idx, "@field1:value1"));

  expect(searchResult1).toBeDefined();
  expect(searchResult1[0]).toEqual(1); // Number of results
  expect(searchResult1[1]).toEqual("doc:1"); // Document ID

  const searchResult2 = await redis.send(FT.SEARCH(idx, "@field1:value2"));

  expect(searchResult2).toBeDefined();
  expect(searchResult2[0]).toEqual(0); // No results

  const searchResult3 = await redis.send(FT.SEARCH(idx, "@field1:value*"));

  expect(searchResult3).toBeDefined();
  expect(searchResult3[0]).toEqual(1);
  expect(searchResult3[1]).toEqual("doc:1");

  const searchResult4 = await redis.send(FT.SEARCH(idx, "@field1:*value*"));

  expect(searchResult4).toBeDefined();
  expect(searchResult4[0]).toEqual(1);
  expect(searchResult4[1]).toEqual("doc:1");

  await redis.close();
});

test("error-handling", async () => {
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
