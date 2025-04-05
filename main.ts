import { stringify } from "@libs/xml/stringify";
import { readAllSync } from "@std/io/read-all";
import { GoogleGenAI } from "@google/genai";

const BYE = Symbol();

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

const ai = new GoogleGenAI({ apiKey: Deno.env.get("API_KEY") });

const MODEL = "gemini-2.0-flash-lite";

const instTmpl = Deno.readTextFileSync(new URL("inst.txt", import.meta.url));

const lsCommand = new Deno.Command("git", { args: ["ls-files"] });

const inst = instTmpl.replaceAll(
  "{{wd}}",
  encode(td.decode(new Deno.Command("pwd").outputSync().stdout).trim()),
);

const prompt = (): Promise<string> => {
  Deno.stdout.writeSync(te.encode(CC + "\n<<< USER: " + CR));
  const query = td.decode(readAllSync(Deno.stdin));
  return esc.has(query.trim()) ? Promise.reject(BYE) : Promise.resolve(query);
};

const call = async (query: string): Promise<void> => {
  Deno.stdout.writeSync(te.encode(CY + ">>> LEPO: " + CR));

  const gen = await ai.models.generateContentStream({
    model: MODEL,
    config: { systemInstruction: inst },
    contents: [
      {
        role: "user",
        parts: [{ text: stringify({ ["plain-text"]: "예열해." }) }],
      },
      {
        role: "model",
        parts: [{
          text: stringify({
            ["execution-request"]: {
              cmd: "git",
              args: [{ arg: "ls-files" }],
              description: "저장소를 구성하는 파일을 조회하는 명령",
            },
          }),
        }],
      },
      {
        role: "user",
        parts: [{
          text: stringify({
            ["execution-response"]: {
              stdout: td.decode(lsCommand.outputSync().stdout),
            },
          }),
        }],
      },
      {
        role: "model",
        parts: [{
          text: stringify({
            ["plain-text"]: "응. 예열했어. 이제 뭐든지 물어봐!",
          }),
        }],
      },
      { role: "user", parts: [{ text: stringify({ ["plain-text"]: query }) }] },
    ],
  });

  for await (const res of gen) {
    const text = res.candidates?.[0].content?.parts?.[0].text;

    Deno.stdout.writeSync(te.encode(text));
  }
};

const loop = (): Promise<void> => prompt().then(call).then(loop);

loop().catch((e) => {
  if (e === BYE) {
    Deno.stdout.writeSync(te.encode(`${CM}>>> SYST:${CR} bye\n`));
  } else {
    console.error(e);
  }
});
