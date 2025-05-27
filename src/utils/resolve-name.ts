import { isString } from "radashi";
import { RedisKeyspace } from "../key";

export function resolveName(key: { name: string | RedisKeyspace }) {
  return isString(key.name) ? key.name : key.name.name;
}
