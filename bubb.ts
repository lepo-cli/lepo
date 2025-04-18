import { join } from "jsr:@std/path/join";

export type Role = "user" | "lepo" | "meta";

export type BubbMeta = {
  readonly prev?: string;
  readonly role: Role;
  readonly isHidden: boolean;
  readonly path: string;
};

export type BubbName = {
  readonly id: string;
  readonly meta: BubbMeta;
};

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const NIL = Symbol();

export async function* readBubbNames({ dir }: {
  dir: string;
}): AsyncGenerator<BubbName> {
  for await (const { name, isFile } of Deno.readDir(dir)) {
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
      : r === "m"
      ? "meta"
      : NIL;
    if (role === NIL) continue;

    // isHidden 은 0, 1 중 하나임
    const isHidden = h === "0" ? false : h === "1" ? true : NIL;
    if (isHidden === NIL) continue;

    // id 는 ulid 형식이어야 함
    if (!ULID_REGEX.test(id)) continue;

    const path = join(dir, name);

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
    .then(({ isDirectory }: Deno.FileInfo): void => {
      if (!isDirectory) throw new Error(`"${dir}" conflicts`);
    })
    .then(() => readBubbNames({ dir }))
    .then<BubbName | undefined>(async (names: AsyncGenerator<BubbName>) => {
      const arr: BubbName[] = [];
      const map: Map<string, BubbMeta> = new Map();

      for await (const { id, meta: { prev, role, isHidden, path } } of names) {
        if (i) {
          map.set(id, { prev, role, isHidden, path });
        } else {
          arr.push({ id, meta: { prev, role, isHidden, path } });
        }

        if (id === i) break;
      }

      return i
        ? (map.has(i) ? { id: i, meta: map.get(i) as BubbMeta } : undefined)
        : arr
          .toSorted(({ id: a }, { id: b }) => b.localeCompare(a, "en-US"))[0];
    });
