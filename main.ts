import type { Role } from "./mod.ts";
import { DIR } from "./mod.ts";
import { debug } from "./debug.ts";
import { bubb } from "./bubb.ts";
import { conv } from "./conv.ts";

import { stringify } from "@libs/xml/stringify";
import { readAllSync } from "@std/io/read-all";
import { ulid } from "@std/ulid/ulid";
import { type Content, GoogleGenAI } from "@google/genai";

const dir = DIR;

const BYE = Symbol();
const NEVER = Symbol();
const NOT_FOUND = Symbol("not found");

const esc: ReadonlySet<string> = new Set(["bye", "exit", "quit"]);

const CC = "\x1b[36m";
const CM = "\x1b[35m";
const CY = "\x1b[33m";
const CR = "\x1b[0m";

const encode = (str: string): string => {
  const wrapped = stringify({ str });
  return wrapped.substring(5, wrapped.length - 6);
};

const td = new TextDecoder();
const te = new TextEncoder();

const instTmpl = Deno.readTextFileSync(new URL("inst.txt", import.meta.url));

const inst = instTmpl.replaceAll(
  "{{wd}}",
  encode(td.decode(new Deno.Command("pwd").outputSync().stdout).trim()),
);

const user = (): Promise<string> => {
  Deno.stdout.writeSync(te.encode(CC + "\n<<< USER: " + CR));
  const query = td.decode(readAllSync(Deno.stdin));
  return esc.has(query.trim()) ? Promise.reject(BYE) : Promise.resolve(query);
};

const save = ({ dir, prev, role, isHidden, text }: {
  dir: string;
  prev: string;
  role: Role;
  isHidden: boolean;
  text: string;
}): Promise<string> =>
  bubb({ dir, id: prev })
    .then((name) => {
      if (!name) throw NOT_FOUND;
      return ulid();
    })
    .then((curr) =>
      Deno.writeTextFile(
        `${dir}/${curr}-${role.charAt(0)}${isHidden ? "1" : "0"}-${prev}.txt`,
        text,
      )
        .then(() => curr)
    );

const ai = new GoogleGenAI({ apiKey: Deno.env.get("API_KEY") });
const MODEL = "gemini-2.0-flash-lite";
debug("MODEL:", MODEL);

const lepo = ({ dir, tail }: {
  dir: string;
  tail: string;
}): Promise<string> =>
  Deno.stdout.write(te.encode(CY + ">>> LEPO: " + CR))
    .then(() => conv({ dir, tail }))
    .then((bnames) =>
      bnames.map((bname) => [
        bname.meta.role,
        Deno.readTextFileSync(bname.meta.path),
      ]) as Readonly<Readonly<[Role, string]>[]>
    )
    .then((tuples) =>
      tuples.map(([role, text]) => ({
        role: role === "lepo" ? "model" : "user",
        parts: [{ text }],
      })) as Content[]
    )
    .then((contents) =>
      ai.models.generateContentStream({
        model: MODEL,
        config: { systemInstruction: inst },
        contents,
      })
    )
    .then(async (gen) => {
      const arr: string[] = [];
      for await (const res of gen) {
        const text = res.candidates?.[0].content?.parts?.[0].text;
        Deno.stdout.writeSync(te.encode(text));
        arr.push(text ?? "");
      }
      return arr.join("");
    });

const loop = (tail: string): Promise<string> =>
  user()
    .then((query) =>
      save({
        dir,
        prev: tail,
        role: "user",
        isHidden: false,
        text: stringify({ ["plain-text"]: query }),
      })
    )
    .then((tail) =>
      lepo({ dir, tail }).then((text) =>
        save({ dir, prev: tail, role: "lepo", isHidden: false, text })
      )
    )
    .then(loop);

conv({ dir })
  .then(() => bubb({ dir }))
  .then((tail) => {
    if (!tail) throw NEVER;

    return tail.meta.role === "lepo"
      ? tail.id
      : lepo({ dir, tail: tail.id }).then((text) =>
        save({ dir, prev: tail.id, role: "lepo", isHidden: false, text })
      );
  })
  .then(loop)
  .catch((e) => {
    if (e === BYE) {
      Deno.stdout.writeSync(te.encode(`${CM}>>> SYST:${CR} bye\n`));
    } else {
      console.error(e);
    }
  });
