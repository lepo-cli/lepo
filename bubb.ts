import type { BubbMeta, BubbName } from "./mod.ts";
import { DIR } from "./mod.ts";

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const NIL = Symbol();
export const CONFLICT = Symbol(
  "dirname conflicts. check out --save-to options to address it.",
);
export const BUBB_NOT_FOUND = Symbol("bubb not found.");

export async function* toBubbName({ dir, entries }: {
  dir: string;
  entries: AsyncIterable<Deno.DirEntry>;
}): AsyncGenerator<BubbName> {
  for await (const { name, isFile } of entries) {
    if (!isFile) continue;

    const [id, flag, prevtxt, ...rest] = name.split("-");

    // 정확히 3 부분이어야 함
    if (rest.length > 1) continue;
    if (!prevtxt) continue;

    // flag 는 정확히 두글자임
    if (flag.length !== 2) continue;

    const [r, h] = [...flag];

    // role 은 s, l, u 중 하나임
    const role = r === "u"
      ? "user"
      : r === "l"
      ? "lepo"
      : r === "s"
      ? "syst"
      : NIL;
    if (role === NIL) continue;

    // isHidden 은 0, 1 중 하나임
    const isHidden = h === "0" ? false : h === "1" ? true : NIL;
    if (isHidden === NIL) continue;

    // id 는 ulid 형식이어야 함
    if (!ULID_REGEX.test(id)) continue;

    const path = `${dir}/${name}`;

    // head 분기
    if (prevtxt === "nil.txt") {
      yield { id, meta: { role, isHidden, path } };
    } else {
      // .txt 로 끝나야 함
      if (!prevtxt.endsWith(".txt")) continue;

      // prev 는 ulid 형식이어야 함
      if (prevtxt.length !== 30) continue;
      const prev = prevtxt.substring(0, 26);
      if (!ULID_REGEX.test(prev)) continue;

      yield { id, meta: { role, isHidden, prev, path } };
    }
  }
}

export const bubb = ({ dir, id: i }: {
  dir: string;
  id?: string;
}): Promise<BubbName | undefined> =>
  Deno.stat(dir)
    .then(({ isDirectory }) => {
      if (!isDirectory) throw CONFLICT;
    })
    .then(() => Deno.readDir(dir))
    .then((entries) => toBubbName({ dir, entries }))
    .then<BubbName | undefined>(async (names) => {
      const arr: BubbName[] = [];
      const map: Map<string, BubbMeta> = new Map();

      for await (const { id, meta: { prev, role, isHidden, path } } of names) {
        if (i) {
          map.set(id, { prev, role, isHidden, path });
        } else {
          arr.push({ id, meta: { prev, role, isHidden, path } });
        }

        if (i === id) break;
      }

      return i
        ? (map.has(i) ? { id: i, meta: map.get(i) as BubbMeta } : undefined)
        : arr
          .toSorted(({ id: a }, { id: b }) => b.localeCompare(a, "en-US"))[0];
    });

if (import.meta.main) {
  bubb({ dir: DIR });
}
