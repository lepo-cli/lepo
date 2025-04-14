import { debug } from "./debug.ts";
import type { BubbName, Role } from "./bubb.ts";
import { conv } from "./conv.ts";

import { stringify } from "@libs/xml/stringify";
import { join } from "@std/path/join";
import type { Content, GenerateContentResponse } from "@google/genai";
import { GoogleGenAI } from "@google/genai";

export const PREFIX = "\n\x1b[33m>>> LEPO:\x1b[0m ";

const te = new TextEncoder();
const td = new TextDecoder();

const apiKey = Deno.env.get("GEMINI_API_KEY");

if (!apiKey) {
  console.error("GEMINI_API_KEY not set");
  Deno.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const MODEL = "gemini-2.0-flash-lite";
debug("MODEL:", MODEL);

const encode = (str: string): string => {
  const wrapped = stringify({ str });
  return wrapped.substring(5, wrapped.length - 6);
};

const instTmpl: string = Deno
  .readTextFileSync(join(import.meta.dirname as string, "inst.txt"));

const inst: string = instTmpl.replaceAll(
  "{{wd}}",
  encode(td.decode(new Deno.Command("pwd").outputSync().stdout).trim()),
);

debug(() => ["inst:", inst.substring(0, 30) + "\x1b[90m...\x1b[0m"]);

export const lepo = ({ dir, tail }: {
  dir: string;
  tail: string;
}): Promise<string> =>
  Deno.stdout.write(te.encode(PREFIX))
    .then<ReadonlyArray<BubbName>>(() => conv({ dir, tail }))
    .then((bnames: ReadonlyArray<BubbName>): Readonly<[Role, string]>[] =>
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
        const text = res.candidates?.[0]?.content?.parts?.[0]?.text;

        Deno.stdout.writeSync(te.encode(text));

        arr.push(text ?? "");
      }

      return arr.join("");
    });
