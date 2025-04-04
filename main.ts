import { readAllSync } from "@std/io/read-all";
import { GoogleGenAI } from "@google/genai";

const td = new TextDecoder();
const te = new TextEncoder();

const ai = new GoogleGenAI({ apiKey: Deno.env.get("API_KEY") });

const prompt = (): Promise<string> => {
  Deno.stdout.writeSync(te.encode("<<< USER: "));
  const query = td.decode(readAllSync(Deno.stdin));
  return query.trim() === "bye" ? Promise.reject() : Promise.resolve(query);
};

const call = async (query: string): Promise<void> => {
  Deno.stdout.writeSync(te.encode(">>> ASSI: "));

  const gen = await ai.models.generateContentStream({
    model: "gemini-2.0-flash-lite",
    contents: query,
  });

  for await (const res of gen) {
    const text = res.candidates?.[0].content?.parts?.[0].text;

    Deno.stdout.writeSync(te.encode(text));
  }
};

const loop = (): Promise<void> => prompt().then(call).then(loop);

loop().catch(() => {
  Deno.stdout.writeSync(te.encode(">>> SYST: bye\n"));
});
