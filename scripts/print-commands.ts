import * as mod from "../src/index.ts";

const commands = Object.keys(mod)
  .filter(
    (k) =>
      k === k.toUpperCase() &&
      typeof mod[k] === "function" &&
      mod[k].toString().includes("RedisCommand"),
  )
  .sort();

console.log(
  "- " +
    commands
      .map(
        (name) => `[${name}](https://redis.io/docs/latest/commands/${name}/)`,
      )
      .join("\n- "),
);
