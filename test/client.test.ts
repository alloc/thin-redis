import { Type } from "@sinclair/typebox";
import assert, { deepEqual, equal } from "node:assert";
import { test } from "node:test";
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

  deepEqual(await redis.sendRaw(PING()), PONG);

  const foo = new RedisKey("foo", Type.String());

  equal(await redis.send(SET(foo, "bar")), "OK");

  equal(await redis.send(GET(foo)), "bar");

  equal(await redis.send(DEL(foo)), 1);

  equal(redis.connected, true);

  equal(await redis.sendOnce(GET(foo)), null);

  equal(redis.connected, false);

  equal(await redis.sendOnce(PING()), "PONG");
});

test("full-text-search", async () => {
  const redis = new RedisClient({
    url: "redis://localhost:6379/0",
  });

  equal(await redis.send(FLUSHALL()), "OK");

  const idx = new RedisIndexKey("idx");

  equal(
    await redis.send(
      FT.CREATE(idx, { field1: "TEXT" }, ON("hash"), PREFIX("doc:")),
    ),
    "OK",
  );

  equal(
    await redis.send(
      JSON.SET(new RedisKey("doc:1", Type.Any()), "$", {
        field1: "value1",
      }),
    ),
    "OK",
  );

  const searchResult1 = await redis.send(FT.SEARCH(idx, "@field1:value1"));

  assert(searchResult1);
  equal(searchResult1[0], 1); // Number of results
  equal(searchResult1[1], "doc:1"); // Document ID

  const searchResult2 = await redis.send(FT.SEARCH(idx, "@field1:value2"));

  assert(searchResult2);
  equal(searchResult2[0], 0); // No results

  const searchResult3 = await redis.send(FT.SEARCH(idx, "@field1:value*"));

  assert(searchResult3);
  equal(searchResult3[0], 1);
  equal(searchResult3[1], "doc:1");

  const searchResult4 = await redis.send(FT.SEARCH(idx, "@field1:*value*"));

  assert(searchResult4);
  equal(searchResult4[0], 1);
  equal(searchResult4[1], "doc:1");

  await redis.close();
});

test("error-handling", async () => {
  const redis = new RedisClient({
    url: "redis://localhost:6379/0",
  });

  assert.rejects(redis.sendOnce(new RedisCommand(["MY_GO"])), {
    message: "ERR unknown command 'MY_GO', with args beginning with: ",
  });

  await redis.close();
});
