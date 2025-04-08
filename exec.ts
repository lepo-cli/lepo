import { debug } from "./debug.ts";
import type { BubbName } from "./bubb.ts";
import { bubb } from "./bubb.ts";
import type { ExecReq, ExecRes } from "./protocol.ts";
import { convert } from "./protocol.ts";
import { save } from "./save.ts";
import { lepo } from "./lepo.ts";
import { PREFIX as META } from "./meta.ts";

import { stringify } from "@libs/xml/stringify";

const te = new TextEncoder();
const td = new TextDecoder();

const NOT_FOUND = Symbol("not found");

export const END = Symbol();

const pretty = ({ cmd, args }: ExecReq): string =>
  `\x1b[32m${cmd}\x1b[0m ${args.join("\x1b[32m,\x1b[0m ")}\n`;

export const loop = ({ dir, prev }: {
  dir: string;
  prev: string;
}): Promise<string> =>
  bubb({ dir, id: prev })
    .then((name?: BubbName): Readonly<ExecReq[]> => {
      if (!name) throw NOT_FOUND;

      return name.meta.role === "lepo"
        ? convert(Deno.readTextFileSync(name.meta.path))
        : [];
    })
    .then((execs: Readonly<ExecReq[]>): Readonly<ExecRes[]> => {
      const execRess: ExecRes[] = [];

      for (const { cmd, args } of execs) {
        Deno.stdout.writeSync(te.encode(META + pretty({ cmd, args })));

        const answer = prompt(
          "\x1b[35m위 명령을 실행하시겠습니까?\x1b[0m [y/n]:",
        ) ?? "n";

        if (answer.trim().toLowerCase() !== "y") continue;

        const {
          success,
          stdout,
          stderr,
          code,
          signal,
        } = new Deno.Command(cmd, { args: [...args] }).outputSync();

        const execRes: ExecRes = signal
          ? {
            stdout: td.decode(stdout),
            stderr: td.decode(stderr),
            code,
            signal,
          }
          : success
          ? { stdout: td.decode(stdout) }
          : {
            stdout: td.decode(stdout),
            stderr: td.decode(stderr),
            code,
          };

        execRess.push(execRes);

        if (execRes.stdout) {
          console.info("\x1b[32m[stdout]\x1b[0m", execRes.stdout);
        }

        if (execRes.stderr) {
          console.info("\x1b[31m[stderr]\x1b[0m", execRes.stderr);
        }
      }

      return execRess;
    })
    .then((execRess: Readonly<ExecRes[]>): Readonly<string[]> =>
      execRess.map((execRes) => stringify({ ["execution-response"]: execRes }))
    )
    .then<string>((texts: Readonly<string[]>) => {
      if (texts.length === 0) {
        throw END;
      } else {
        const text = texts.join("\n");

        debug("text:", text);

        return save({ dir, prev, role: "user", text }).then((id: string) =>
          lepo({ dir, tail: id }).then((text: string) =>
            save({ dir, prev: id, role: "lepo", text })
          )
        );
      }
    })
    .then<string>((id: string) => loop({ dir, prev: id }));
