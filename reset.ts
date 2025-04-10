import { stringify } from "@libs/xml/stringify";
import { ulid } from "@std/ulid/ulid";

const td = new TextDecoder();

const ls = new Deno.Command("git", { args: ["ls-files"] });

const few = (now: number): ReadonlyArray<{
  readonly id: string;
  readonly flag: string;
  readonly text: string;
}> => [
  {
    id: ulid(now - 4),
    flag: "u1",
    text: "예열해.",
  },
  {
    id: ulid(now - 3),
    flag: "l1",
    text: "응. 그럼 추적 중인 파일을 한 번 볼게.\n" + stringify({
      ["execution-request"]: {
        cmd: "git",
        args: [{ arg: "ls-files" }],
        description: "저장소를 구성하는 파일을 조회하는 명령",
      },
    }),
  },
  {
    id: ulid(now - 2),
    flag: "u1",
    text: stringify({
      ["execution-response"]: {
        stdout: td.decode(ls.outputSync().stdout),
      },
    }),
  },
  {
    id: ulid(now - 1),
    flag: "l1",
    text: "여기에서 어떤 도움이 필요해?",
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
      Deno.writeTextFileSync(`${dir}/${name}.txt`, text);
    });
};

if (import.meta.main) {
  try {
    reset({ dir: ".lepo" });
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
}
