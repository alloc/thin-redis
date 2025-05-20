import { KindGuard, TSchema } from "@sinclair/typebox";
import * as Type from "@sinclair/typebox/type";

export type JSONPath = `$${string}`;

/**
 * Given a TypeBox schema and a JSON path, return the TypeBox schema that
 * corresponds to the JSON path.
 */
export function resolveSchemaForJSONPath(
  schema: TSchema,
  path: JSONPath,
  state = parseJSONPath(path),
) {
  const part = state.parts[state.index++];
  if (!part) {
    return schema;
  }
  if (part === "$") {
    return resolveSchemaForJSONPath(schema, path, state);
  }
  let key: string | undefined;
  if (part.charCodeAt(0) === 46 /* . */) {
    key = part.slice(1);
  } else if (part.charCodeAt(0) === 91 /* [ */) {
    if (part.charCodeAt(1) === 39 /* ' */) {
      key = part.slice(2, -2);
    }
    // If no single quote is present, then this is either [*] or a specific
    // array index, like [0] or [1].
    else if (KindGuard.IsArray(schema)) {
      return resolveSchemaForJSONPath(schema.items, path, state);
    }
  }
  if (key != null && KindGuard.IsObject(schema) && key in schema.properties) {
    return resolveSchemaForJSONPath(schema.properties[key], path, state);
  }
  return Type.Never();
}

function parseJSONPath(path: JSONPath) {
  return {
    parts: path.match(/(^\$|\.[^.[\]*]+|\[(?:\*|\d+|'[^']+')\])/gi) ?? [],
    index: 0,
  };
}
