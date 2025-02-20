import { Type } from "@sinclair/typebox";
import {
  DEL,
  FLUSHALL,
  GET,
  PING,
  RedisClient,
  RedisCommand,
  RedisKey,
  SADD,
  SCARD,
  SDIFF,
  SET,
  SINTER,
  SISMEMBER,
  SMEMBERS,
  SPOP,
  SREM,
  SUNION,
} from "../src";

const redis = new RedisClient({
  url: "redis://localhost:6379/0",
});

beforeEach(async () => {
  await redis.send(FLUSHALL());
});

afterAll(async () => {
  await redis.close();
});

test("send", async () => {
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

test("set commands", async () => {
  const setKey = new RedisKey("myset", Type.String());
  const member1 = "member1";
  const member2 = "member2";
  const member3 = "member3";

  // SMEMBERS non-existent set
  expect(await redis.send(SMEMBERS(setKey))).toEqual([]);

  // SADD
  expect(await redis.send(SADD(setKey, member1, member2))).toEqual(2);
  expect(await redis.send(SADD(setKey, member1))).toEqual(0); // Already exists

  // SCARD
  expect(await redis.send(SCARD(setKey))).toEqual(2);

  // SMEMBERS
  expect(await redis.send(SMEMBERS(setKey))).toEqual(
    expect.arrayContaining([member1, member2]),
  );

  // SISMEMBER
  expect(await redis.send(SISMEMBER(setKey, member1))).toEqual(true);
  expect(await redis.send(SISMEMBER(setKey, member3))).toEqual(false);

  // SPOP
  let poppedMember = await redis.send(SPOP(setKey));
  expect([member1, member2]).toContain(poppedMember);
  expect(await redis.send(SCARD(setKey))).toEqual(1); // Size reduced by 1

  // SADD back member1 and member2 for further tests
  await redis.send(SADD(setKey, member1, member2));

  // SREM
  expect(await redis.send(SREM(setKey, member1))).toEqual(1);
  expect(await redis.send(SREM(setKey, member3))).toEqual(0); // Not exists
  expect(await redis.send(SCARD(setKey))).toEqual(1); // Size reduced by 1

  // SADD back member1 for further tests
  await redis.send(SADD(setKey, member1));

  const anotherSetKey = new RedisKey("anotherset", Type.String());
  await redis.send(SADD(anotherSetKey, member2, member3));

  // SDIFF
  expect(await redis.send(SDIFF(setKey, anotherSetKey))).toEqual(
    expect.arrayContaining([member1]),
  );

  // SINTER
  expect(await redis.send(SINTER(setKey, anotherSetKey))).toEqual(
    expect.arrayContaining([member2]),
  );

  // SUNION
  expect(await redis.send(SUNION(setKey, anotherSetKey))).toEqual(
    expect.arrayContaining([member1, member2, member3]),
  );

  // DEL set key
  expect(await redis.send(DEL(setKey))).toEqual(1);
  expect(await redis.send(DEL(anotherSetKey))).toEqual(1);
});

test("error handling", async () => {
  await expect(
    redis.sendOnce(new RedisCommand(["MY_GO"])),
  ).rejects.toThrowError(
    "ERR unknown command 'MY_GO', with args beginning with: ",
  );
});
