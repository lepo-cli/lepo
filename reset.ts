import { join } from "jsr:@std/path/join";
import { ulid } from "jsr:@std/ulid/ulid";

const few = (now: number): ReadonlyArray<{
  readonly id: string;
  readonly flag: string;
  readonly text: string;
}> => [
  {
    id: ulid(now - 1),
    flag: "l0",
    text: "안녕! 어떤 도움이 필요해?",
  },
];

export const reset = ({ dir, now }: {
  dir: string;
  now?: number;
}): void => {
  Deno.mkdirSync(dir, { recursive: true });
  Deno.removeSync(dir, { recursive: true });
  Deno.mkdirSync(dir, { recursive: true });

  few(now ?? Date.now())
    .map((curr, i, arr): {
      readonly id: string;
      readonly flag: string;
      readonly prev: string;
      readonly text: string;
    } => ({
      ...curr,
      prev: arr[i - 1]?.id ?? "nil",
    }))
    .map(({ id, flag, prev, text }): Readonly<[string, string]> => [
      `${id}-${flag}-${prev}`,
      text,
    ])
    .forEach(([name, text]: Readonly<[string, string]>): void => {
      Deno.writeTextFileSync(join(dir, `${name}.txt`), text);
    });
};
