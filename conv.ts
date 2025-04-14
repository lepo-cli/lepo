import { debug } from "./debug.ts";
import type { BubbMeta, BubbName } from "./bubb.ts";
import { readBubbNames } from "./bubb.ts";
import { reset } from "./reset.ts";

class NotFound extends Error {
  override name = "NotFound";
}

class Conflict extends Error {
  override name = "Conflict";
}

const NO_BUBB = Symbol();

export const conv = ({ dir, tail }: {
  dir: string;
  tail?: string;
}): Promise<ReadonlyArray<BubbName>> =>
  Deno.stat(dir)
    .then(({ isDirectory }: Deno.FileInfo): void => {
      if (!isDirectory) throw new Conflict(`"${dir}" conflicts`);
    })
    .then(() => readBubbNames({ dir }))
    .then<ReadonlyArray<BubbName>>(async (names: AsyncGenerator<BubbName>) => {
      const arr: BubbName[] = [];
      const map: Map<string, BubbMeta> = new Map();

      for await (
        const { id, meta: { prev, role, isHidden, path } } of names
      ) {
        arr.push({ id, meta: { prev, role, isHidden, path } });
        map.set(id, { prev, role, isHidden, path });
      }

      if (arr.length === 0) {
        throw NO_BUBB;
      }

      const sorted = arr
        .toSorted(({ id: a }, { id: b }) => a.localeCompare(b, "en-US"));

      const t = tail ?? sorted[sorted.length - 1].id;

      if (!map.has(t)) {
        throw new NotFound(`bubb#${t} not found`);
      }

      const c: BubbName[] = [];

      for (let id: string | undefined = t; id; id = map.get(id)?.prev) {
        if (!map.has(id)) {
          console.warn(`bubb#${id} not found. incomplete conv returned.`);
          break;
        }

        c.push({ id, meta: map.get(id) as BubbMeta });
      }

      return c.toReversed();
    })
    .catch((e) => {
      if (e.code === "ENOENT") {
        debug(`"${dir}" not found`);
        reset({ dir });
        return conv({ dir });
      } else if (e === NO_BUBB) {
        debug(`"${dir}" has no bubb`);
        reset({ dir });
        return conv({ dir });
      } else {
        throw e;
      }
    });
