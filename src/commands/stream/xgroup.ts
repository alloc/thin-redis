import { RedisCommand } from "../../command";
import { encodeModifiers, Modifiers } from "../../modifier";
import { ENTRIESREAD, MKSTREAM } from "../../modifiers";
import { RedisStream } from "../../stream";

/**
 * The last entry ID in a stream, from the group's perspective.
 *
 * - `0` handles all past and future entries
 * - `$` only handles entries after the group was created
 * - `string` handles entries after a specific entry ID
 */
type LastEntryId = "0" | "$" | (string & {});

export function CREATE(
  stream: RedisStream,
  group: string,
  id: LastEntryId,
  ...modifiers: Modifiers<[MKSTREAM, ENTRIESREAD]>
): RedisCommand<void> {
  return new RedisCommand([
    "XGROUP",
    "CREATE",
    stream.name,
    group,
    id,
    ...encodeModifiers(modifiers),
  ]);
}
