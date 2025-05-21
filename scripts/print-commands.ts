import * as mod from "../src/index.ts";

function extractCommands(mod: any, prefix?: string) {
  return Object.keys(mod)
    .filter(
      (k) =>
        k === k.toUpperCase() &&
        typeof mod[k] === "function" &&
        mod[k].toString().includes("RedisCommand"),
    )
    .map((k) => (prefix ? `${prefix}.${k}` : k));
}

const commands = extractCommands(mod)
  .concat(
    extractCommands(mod.FT, "FT"),
    extractCommands(mod.JSON, "JSON"),
    extractCommands(mod.XGROUP, "XGROUP"),
  )
  .sort();

const redirects = {
  "XGROUP.CREATE": "XGROUP-CREATE",
};

console.log(
  "- " +
    commands
      .map(
        (name) =>
          `[${name}](https://redis.io/docs/latest/commands/${redirects[name] ?? name}/)`,
      )
      .join("\n- "),
);
