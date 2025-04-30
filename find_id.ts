import type { BubbName, Ulid } from "./bubb.ts";
import { readBubbNames } from "./bubb.ts";

export const findId = ({ dir, suffix }: {
  dir: string;
  suffix: string;
}): Promise<Ulid | undefined> =>
  suffix.length > 26 ? Promise.resolve(undefined) : Deno.stat(dir)
    .then(({ isDirectory }: Deno.FileInfo): void => {
      if (!isDirectory) throw new Error(`"${dir}" conflicts`);
    })
    .then(() => readBubbNames({ dir }))
    .then(async (names: AsyncGenerator<BubbName>) => {
      let found: Ulid | undefined = undefined;
      let cnt = 0;

      for await (const { id } of names) {
        if (id.endsWith(suffix.toUpperCase())) {
          found = id;
          ++cnt;
        }
      }

      if (cnt > 1) {
        console.warn(
          "multiple bubbs ending with",
          suffix,
          "found.",
          "You can use a longer suffix to avoid.",
        );
      }

      return found;
    });
