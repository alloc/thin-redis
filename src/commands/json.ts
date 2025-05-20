import { StaticEncode, TSchema } from "@sinclair/typebox";
import { Parse } from "jsonpath-ts";
import { RedisCommand } from "../command";
import { RedisJSONEntity } from "../key";
import { encodeModifiers, Modifiers } from "../modifier";
import { NX, XX } from "../modifiers";
import { JSONPath } from "../utils/json-path";

/**
 * Set the JSON value at path in key
 * @see https://redis.io/commands/json.set/
 */
export function SET<T extends TSchema, TPath extends JSONPath>(
  key: RedisJSONEntity<T>,
  path: TPath,
  value: Parse<TPath, StaticEncode<T>>,
  ...modifiers: Modifiers<[NX | XX]>
) {
  return new RedisCommand<"OK" | null>([
    "JSON.SET",
    key.name,
    path,
    key.encode(value, path),
    ...encodeModifiers(modifiers),
  ]);
}

type ParseMultiGet<TPaths extends JSONPath[], T> = (
  TPaths extends [
    infer TPath extends JSONPath,
    ...infer TPaths extends JSONPath[],
  ]
    ? { [P in TPath]: Parse<TPath, T>[] } & ParseMultiGet<TPaths, T>
    : unknown
) extends infer TResult
  ? { [K in keyof TResult]: TResult[K] }
  : never;

/**
 * Retrieve the root (`$`) JSON value for the given key.
 *
 * @see https://redis.io/commands/json.get/
 */
export function GET<T extends TSchema>(
  key: RedisJSONEntity<T>,
): RedisCommand<StaticEncode<T> | undefined>;

/**
 * Retrieve the JSON value at the given path in key.
 *
 * @see https://redis.io/commands/json.get/
 */
export function GET<T extends TSchema, TPath extends JSONPath>(
  key: RedisJSONEntity<T>,
  path: TPath,
): RedisCommand<Parse<TPath, StaticEncode<T>> | undefined>;

/**
 * Retrieve the JSON values at the given paths in key.
 *
 * Returns an object with the paths as keys. Each key points to an array of
 * parsed JSON values.
 *
 * @see https://redis.io/commands/json.get/
 */
export function GET<
  T extends TSchema,
  TPaths extends [JSONPath, ...JSONPath[]],
>(
  key: RedisJSONEntity<T>,
  paths: TPaths,
): RedisCommand<ParseMultiGet<TPaths, StaticEncode<T>> | undefined>;

export function GET(key: RedisJSONEntity, path?: JSONPath | JSONPath[]) {
  if (!path) {
    return new RedisCommand(["JSON.GET", key.name], (result) =>
      result !== null ? JSON.parse(result) : undefined,
    );
  }
  if (!Array.isArray(path)) {
    return new RedisCommand(
      ["JSON.GET", key.name],
      (result) => JSON.parse(result)[0],
    );
  }
  const paths: JSONPath[] = path;
  if (!paths.length) {
    throw new Error("Expected at least one path");
  }
  return new RedisCommand(["JSON.GET", key.name, ...paths], (results) => {
    // Normalize the results to an object with the paths as keys.
    return paths.length > 1
      ? JSON.parse(results)
      : { [paths[0]]: JSON.parse(results) };
  });
}
