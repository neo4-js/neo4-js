// @flow

export * from "./CharGenerator";
export * from "./QueryHelper";
export * from "./ConnectHelper";

export function lazy<T>(t: T | (() => T | null)): T | null {
  if (typeof t === "function") return t();
  return t;
}
