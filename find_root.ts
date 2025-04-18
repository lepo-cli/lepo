import { join } from "jsr:@std/path/join";

export const NOWHERE = Symbol();

export const findRoot = ({ dirname, from }: {
  dirname: string;
  from: string;
}, testopts?: {
  readonly fn: (abs: string) => void;
  readonly throws: symbol;
}): string | typeof NOWHERE => {
  if (testopts) testopts.fn(from);

  for (const { name, isDirectory } of Deno.readDirSync(from)) {
    if (!isDirectory) continue;
    if (name === dirname) return from;
  }

  try {
    return findRoot({ dirname, from: join(from, "..") }, testopts);
  } catch (e) {
    if (e === testopts?.throws) throw e;
    else return NOWHERE;
  }
};
