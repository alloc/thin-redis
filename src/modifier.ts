import { Static, TAnySchema, TSchema, TUndefined } from "@sinclair/typebox";
import { Encode } from "@sinclair/typebox/value";
import { RedisValue } from "./command";

export function createModifier<
  K extends string,
  T extends TSchema = TUndefined,
>(token: K, schema?: T): RedisModifierFunction<K, T> {
  if (schema) {
    if (schema.type === "array") {
      return (...args: unknown[]) => {
        const encodedArgs = Encode(schema, args) as RedisValue[];
        return new RedisModifier(token, encodedArgs);
      };
    }
    return (arg?: unknown) => {
      const encodedArg = Encode(schema, arg) as RedisValue;
      return new RedisModifier(token, [encodedArg]);
    };
  }
  const modifier = new RedisModifier(token);
  return () => modifier;
}

export function encodeModifiers(
  modifiers: readonly (RedisModifier | undefined)[],
) {
  if (modifiers.length === 0) {
    return modifiers as never[];
  }
  const encoded: RedisValue[] = [];
  for (const modifier of modifiers) {
    if (!modifier) {
      continue;
    }
    if (modifier.args) {
      encoded.push(modifier.token, ...modifier.args);
    } else {
      encoded.push(modifier.token);
    }
  }
  return encoded;
}

export type RedisModifierFunction<
  K extends string = string,
  T extends TSchema = TAnySchema,
> = (...args: StaticModifierArgs<T>) => RedisModifier<K>;

export class RedisModifier<K extends string = string> {
  constructor(
    readonly token: K,
    readonly args?: RedisValue[],
  ) {}
}

export type StaticModifier<T extends RedisModifierFunction> =
  T extends RedisModifierFunction<infer K> ? RedisModifier<K> : never;

type StaticModifierArgs<T extends TSchema> =
  Static<T> extends infer V
    ? [V] extends [undefined]
      ? []
      : undefined extends V
        ? [V?]
        : [V]
    : never;
