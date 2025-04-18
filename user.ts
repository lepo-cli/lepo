import { readAllSync } from "jsr:@std/io/read-all";

export const PREFIX = "\n\x1b[36m<<< USER:\x1b[0m ";

export const BYE = Symbol();

const ESC: ReadonlySet<string> = new Set(["bye", "exit", "quit"]);

const te = new TextEncoder();
const td = new TextDecoder();

export const user = (): Promise<string> => {
  Deno.stdout.writeSync(te.encode(PREFIX));
  const query = td.decode(readAllSync(Deno.stdin));
  return ESC.has(query.trim()) ? Promise.reject(BYE) : Promise.resolve(query);
};
