const stateHome = ".lepo";

const nil = Symbol();

type Role = "system" | "assistant" | "user";

type BName = {
  readonly id: string;
  readonly role: Role;
  readonly isHidden: boolean;
  readonly prev?: string;
};

const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

const parse = (name: string): BName | false => {
  const [id, flag, prevmd, ...rest] = name.split("-");
  if (rest.length > 1) return false;
  if (!prevmd) return false;
  if (flag.length !== 2) return false;
  const [r, h] = [...flag];
  const role = r === "s"
    ? "system"
    : r === "a"
    ? "assistant"
    : r === "u"
    ? "user"
    : nil;
  if (role === nil) return false;
  const isHidden = h === "0" ? false : h === "1" ? true : nil;
  if (isHidden === nil) return false;
  if (!ulidRegex.test(id)) return false;

  if (prevmd == "nil.md") {
    return { id, role, isHidden };
  }

  if (!prevmd.endsWith(".md")) return false;
  if (prevmd.length !== 29) return false;
  const prev = prevmd.substring(0, 26);
  if (!ulidRegex.test(prev)) return false;
  return { id, role, isHidden, prev };
};

const main = () => {
  Deno.mkdirSync(stateHome, { recursive: true });

  const exFiles: Readonly<BName[]> = [...Deno.readDirSync(stateHome)]
    .filter(({ name, isFile }) =>
      isFile &&
      !name.startsWith(".") &&
      !name.startsWith("_") &&
      name.endsWith(".md")
    )
    .map(({ name }) => name)
    .map(parse)
    .filter((bname) => bname) as BName[];

  const sorted: Readonly<BName[]> = exFiles
    .toSorted((a, b) => a.id.localeCompare(b.id, "en-US"));

  const map = sorted.reduce(
    (acc, { id, role, isHidden, prev }) =>
      acc.set(id, { role, isHidden, prev }),
    new Map<string, {
      readonly role: Role;
      readonly isHidden: boolean;
      readonly prev?: string;
    }>(),
  );

  const last = sorted[sorted.length - 1];

  console.log("map:", map);
  console.log("last:", last);
};

if (import.meta.main) {
  main();
}
