import { RedisCommand } from "../command";
import { RedisIndexKey } from "../key";
import { encodeModifiers, Modifiers } from "../modifier";
import {
  FILTER,
  LANGUAGE,
  LANGUAGE_FIELD,
  MAXTEXTFIELDS,
  NOFIELDS,
  NOFREQS,
  NOHL,
  NOOFFSETS,
  ON,
  PAYLOAD_FIELD,
  PREFIX,
  SCORE,
  SCORE_FIELD,
  SKIPINITIALSCAN,
  STOPWORDS,
} from "../modifiers";

/**
 * Create a new index
 *
 * @see https://redis.io/commands/ft.create
 */
export function CREATE(
  index: RedisIndexKey,
  schema: object | string[],
  ...modifiers: Modifiers<
    [
      ON,
      PREFIX,
      FILTER,
      LANGUAGE,
      LANGUAGE_FIELD,
      SCORE,
      SCORE_FIELD,
      PAYLOAD_FIELD,
      MAXTEXTFIELDS,
      NOOFFSETS,
      NOHL,
      NOFIELDS,
      NOFREQS,
      STOPWORDS,
      SKIPINITIALSCAN,
    ]
  >
) {
  return new RedisCommand<string>([
    "FT.CREATE",
    index.text,
    ...encodeModifiers(modifiers),
    "SCHEMA",
    ...(Array.isArray(schema) ? schema : Object.entries(schema).flat()),
  ]);
}

/**
 * Search for documents in an index
 *
 * @see https://redis.io/commands/ft.search
 * @todo Implement modifiers
 */
export function SEARCH(index: RedisIndexKey, query: string) {
  return new RedisCommand<string>(["FT.SEARCH", index.text, query]);
}
