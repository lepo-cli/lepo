import { debug } from "./debug.ts";
import type { BubbName, Role } from "./bubb.ts";
import { conv } from "./conv.ts";
import OpenAI from "jsr:@openai/openai";

export const PREFIX = "\n\x1b[33m>>> LEPO:\x1b[0m ";

const te = new TextEncoder();

const apiKey = Deno.env.get("OPENAI_API_KEY");

if (!apiKey) {
  console.error("OPENAI_API_KEY not set");
  Deno.exit(1);
}

const ai = new OpenAI({ apiKey });
const MODEL = "gpt-4.1-mini";
debug("MODEL:", MODEL);

export const lepo = ({ dir, inst, tail }: {
  dir: string;
  inst: string;
  tail: string;
}): Promise<string> =>
  Deno.stdout.write(te.encode(PREFIX))
    .then<ReadonlyArray<BubbName>>(() => conv({ dir, tail }))
    .then((bnames: ReadonlyArray<BubbName>) =>
      bnames.map(({ meta: { role, path } }): Readonly<[Role, string]> => [
        role,
        Deno.readTextFileSync(path),
      ])
    )
    .then((tuples: ReadonlyArray<Readonly<[Role, string]>>) =>
      tuples.map(([role, text]): {
        readonly role: "assistant" | "user";
        readonly content: string;
      } => ({
        role: role === "lepo" ? "assistant" : "user",
        content: text,
      }))
    )
    .then((
      tuples: ReadonlyArray<{
        readonly role: "assistant" | "user";
        readonly content: string;
      }>,
    ) =>
      ai.responses.stream({
        input: [...tuples],
        instructions: inst,
        model: MODEL,
      })
    )
    .then<string>(async (stream) => {
      for await (const event of stream) {
        const type = event.type;

        if (type === "response.created") {
          debug("model:", event.response.model);
        } else if (type === "response.output_text.delta") {
          Deno.stdout.writeSync(te.encode(event.delta));
        } else if (type === "response.completed") {
          debug("usage:", event.response.usage);

          const output = event.response.output[0];

          if (output?.type !== "message") {
            throw Error(
              'Expected output?.type: "message"' +
                `, Actual output: ${output}` +
                `, Actual output?.type: "${output?.type}"`,
            );
          }

          const content = output.content[0];

          if (content?.type !== "output_text") {
            throw Error(
              'Expected content?.type: "output_text"' +
                `, Actual content: ${content}` +
                `, Actual content?.type: "${content.type}"`,
            );
          }

          return content.text;
        } else {
          debug("\x1b[90mEVENT\x1b[0m", type);
        }
      }

      throw new Error("Unexpected Response");
    });
