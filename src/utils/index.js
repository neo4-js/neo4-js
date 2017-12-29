// @flow

export * from "./CharGenerator";
export * from "./QueryHelper";
export * from "./ConnectHelper";

export function lazy<T>(t: T | (() => T)): T {
  if (typeof t === "function") return t();
  return t;
}
