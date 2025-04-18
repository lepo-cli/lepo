import { debug } from "./debug.ts";
import type { BubbName } from "./bubb.ts";
import { bubb } from "./bubb.ts";
import type { ExecReq, ExecRes } from "./protocol.ts";
import { convert } from "./protocol.ts";
import { save } from "./save.ts";
import { lepo } from "./lepo.ts";
import { PREFIX as META } from "./meta.ts";
import { stringify } from "jsr:@libs/xml/stringify";

const te = new TextEncoder();
const td = new TextDecoder();

export const END = Symbol();

const pretty = ({ cmd, args }: ExecReq): string =>
  `\x1b[32m${cmd}\x1b[0m ${args.join("\x1b[32m,\x1b[0m ")}\n`;

export const loop = ({ dir, inst, prev }: {
  dir: string;
  inst: string;
  prev: string;
}): Promise<string> =>
  bubb({ dir, id: prev })
    .then<string>((name?: BubbName) => {
      if (!name) throw new Error(`bubb#${prev} not found`);

      if (name.meta.role !== "lepo") throw END;

      const execs = convert(Deno.readTextFileSync(name.meta.path));

      if (execs.length === 0) throw END;

      const execRess: ExecRes[] = [];

      for (const { cmd, args } of execs) {
        Deno.stdout.writeSync(te.encode(META + pretty({ cmd, args })));

        const answer = prompt(
          "\x1b[35m위 명령을 실행하시겠습니까?\x1b[0m [y/n]:",
        ) ?? "n";

        if (answer.trim().toLowerCase() !== "y") continue;

        // TODO: 없는 명령어로 실행할 때 에러 처리
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

      if (execRess.length === 0) throw END;

      const text = execRess.map((execRes) =>
        stringify({ ["execution-response"]: execRes })
      ).join("\n");

      debug("text:", text);

      return save({ dir, prev: name.id, role: "user", text })
        .then((id: string) =>
          lepo({ dir, inst, tail: id })
            .then((text: string) => save({ dir, prev: id, role: "lepo", text }))
        );
    })
    .then<string>((id: string) => loop({ dir, inst, prev: id }));
