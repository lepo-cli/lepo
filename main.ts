import { debug } from "./debug.ts";
import type { BubbName, Role } from "./mod.ts";
import { DIR } from "./mod.ts";
import { bubb } from "./bubb.ts";
import { conv } from "./conv.ts";

import { stringify } from "@libs/xml/stringify";
import { readAllSync } from "@std/io/read-all";
import { ulid } from "@std/ulid/ulid";
import type { Content, GenerateContentResponse } from "@google/genai";
import { GoogleGenAI } from "@google/genai";

const ESC: ReadonlySet<string> = new Set(["bye", "exit", "quit"]);
const BYE = Symbol();
const NEVER = Symbol();
const NOT_FOUND = Symbol("not found");

const CC = "\x1b[36m";
const CM = "\x1b[35m";
const CY = "\x1b[33m";
const CR = "\x1b[0m";

const td = new TextDecoder();
const te = new TextEncoder();

const encode = (str: string): string => {
  const wrapped = stringify({ str });
  return wrapped.substring(5, wrapped.length - 6);
};

const instTmpl: string = Deno
  .readTextFileSync(new URL("inst.txt", import.meta.url));

const inst: string = instTmpl.replaceAll(
  "{{wd}}",
  encode(td.decode(new Deno.Command("pwd").outputSync().stdout).trim()),
);

const user = (): Promise<string> => {
  Deno.stdout.writeSync(te.encode(CC + "\n<<< USER: " + CR));
  const query = td.decode(readAllSync(Deno.stdin));
  return ESC.has(query.trim()) ? Promise.reject(BYE) : Promise.resolve(query);
};

const save = ({ dir, prev, role, isHidden, text }: {
  dir: string;
  prev: string;
  role: Role;
  isHidden: boolean;
  text: string;
}): Promise<string> =>
  bubb({ dir, id: prev })
    .then((name?: BubbName): string => {
      if (!name) throw NOT_FOUND;
      return ulid();
    })
    .then<string>((curr: string) =>
      Deno.writeTextFile(
        `${dir}/${curr}-${role.charAt(0)}${isHidden ? "1" : "0"}-${prev}.txt`,
        text,
      )
        .then((): string => curr)
    );

const ai = new GoogleGenAI({ apiKey: Deno.env.get("API_KEY") });
const MODEL = "gemini-2.0-flash-lite";
debug("MODEL:", MODEL);

const lepo = ({ dir, tail }: { dir: string; tail: string }): Promise<string> =>
  Deno.stdout.write(te.encode(CY + ">>> LEPO: " + CR))
    .then<Readonly<BubbName[]>>(() => conv({ dir, tail }))
    .then((bnames: Readonly<BubbName[]>): Readonly<[Role, string]>[] =>
      bnames.map(({ meta: { role, path } }): Readonly<[Role, string]> => [
        role,
        Deno.readTextFileSync(path),
      ])
    )
    .then((tuples: Readonly<[Role, string]>[]): Content[] =>
      tuples.map(([role, text]): Content => ({
        role: role === "lepo" ? "model" : "user",
        parts: [{ text }],
      }))
    )
    .then<AsyncGenerator<GenerateContentResponse>>((contents: Content[]) =>
      ai.models.generateContentStream({
        model: MODEL,
        config: { systemInstruction: inst },
        contents,
      })
    )
    .then<string>(async (gen: AsyncGenerator<GenerateContentResponse>) => {
      const arr: string[] = [];
      for await (const res of gen) {
        const text = res.candidates?.[0].content?.parts?.[0].text;
        Deno.stdout.writeSync(te.encode(text));
        arr.push(text ?? "");
      }
      return arr.join("");
    });

const loop = ({ dir, tail }: { dir: string; tail: string }): Promise<string> =>
  user()
    .then<string>((query: string) =>
      save({
        dir,
        prev: tail,
        role: "user",
        isHidden: false,
        text: stringify({ ["plain-text"]: query }),
      })
    )
    .then<string>((id: string) =>
      lepo({ dir, tail: id }).then<string>((text: string) =>
        save({ dir, prev: tail, role: "lepo", isHidden: false, text })
      )
    )
    .then<string>((id: string) => loop({ dir, tail: id }));

const dir = DIR;
debug("dir:", dir);

conv({ dir })
  .then<BubbName | undefined>(() => bubb({ dir }))
  .then<string>((name?: BubbName) => {
    if (!name) throw NEVER;

    return name.meta.role === "lepo"
      ? name.id
      : lepo({ dir, tail: name.id }).then<string>((text: string) =>
        save({ dir, prev: name.id, role: "lepo", isHidden: false, text })
      );
  })
  .then<string>((id: string) => loop({ dir, tail: id }))
  .catch((e): void => {
    if (e === BYE) {
      Deno.stdout.writeSync(te.encode(`${CM}>>> SYST:${CR} bye\n`));
    } else {
      console.error(e);
      Deno.exit(1);
    }
  });
