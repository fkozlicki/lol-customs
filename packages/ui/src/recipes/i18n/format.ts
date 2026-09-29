import { cloneElement, isValidElement, type ReactNode } from "react";

/**
 * The recipes' dictionary, as types and two pure functions.
 *
 * Shaped after next-international, which the app uses, so a recipe moved out of the app keeps calling
 * `t("victory")` and `t("best", { count })` the way it did: dotted scopes, `{param}` placeholders, and a
 * React element allowed as a param. Plural keys (`#one`, `#other`) are not supported because no recipe
 * string uses them.
 */

/** A dictionary with the same keys as `T` and any string at each leaf; what `pl` has to satisfy. */
export type Strings<T> = {
  [K in keyof T]: T[K] extends string ? string : Strings<T[K]>;
};

/** Every dotted path to a group of strings: the scopes `useRecipesI18n` accepts. */
export type Scopes<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : `${P}${K}` | Scopes<T[K], `${P}${K}.`>;
}[keyof T & string];

/** The value at a dotted path. */
export type At<T, P extends string> = P extends `${infer H}.${infer R}`
  ? H extends keyof T
    ? At<T[H], R>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/** The keys of one scope that hold a string. */
export type Keys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : never;
}[keyof T & string];

/** The `{param}` names in a string literal. */
export type Params<S> = S extends `${string}{${infer P}}${infer R}`
  ? P | Params<R>
  : never;

type Args<S, V> = [Params<S>] extends [never] ? [] : [Record<Params<S>, V>];

export interface Translate<T> {
  <K extends Keys<T>>(key: K, ...params: Args<T[K], string | number>): string;
  <K extends Keys<T>>(
    key: K,
    params: Record<Params<T[K]>, ReactNode>,
  ): ReactNode;
}

/** The string at a dotted path, or the path itself when there is none, as next-international does. */
export function lookup(strings: object, path: string): string {
  let node: unknown = strings;
  for (const part of path.split(".")) {
    node =
      node && typeof node === "object"
        ? (node as Record<string, unknown>)[part]
        : undefined;
  }
  return typeof node === "string" ? node : path;
}

/**
 * Fills `{param}` placeholders. Returns a string unless a param is a React element, in which case the
 * parts come back as nodes, each element keyed by its param and position.
 */
export function format(
  template: string,
  params?: Record<string, ReactNode>,
): ReactNode {
  if (!params) return template;

  let text = true;
  const parts = template.split(/({[^}]*})/).map((part, index) => {
    const match = part.match(/^{(.*)}$/);
    if (!match) return part;
    const value = params[match[1] as string];
    if (isValidElement(value)) {
      text = false;
      return cloneElement(value, { key: `${match[1]}-${index}` });
    }
    return value;
  });

  return text ? parts.join("") : parts;
}
