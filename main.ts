import { debug } from "./debug.ts";
import type { BubbName, Role } from "./bubb.ts";
import { bubb } from "./bubb.ts";
import { conv } from "./conv.ts";
import { END as EXEC_LOOP_END, loop as execLoop } from "./exec.ts";
import { lepo, PREFIX as LEPO } from "./lepo.ts";
import { PREFIX as META } from "./meta.ts";
import { BYE, PREFIX as USER, user } from "./user.ts";
import { save } from "./save.ts";

const loop = ({ dir, prev }: { dir: string; prev: string }): Promise<string> =>
  execLoop({ dir, prev })
    .catch((e): void => {
      if (e !== EXEC_LOOP_END) throw e;
    })
    .then<string>(user)
    .then<string>((text: string) => save({ dir, prev, role: "user", text }))
    .then<string>((id: string) =>
      lepo({ dir, tail: id }).then<string>((text: string) =>
        save({ dir, prev: id, role: "lepo", text })
      )
    )
    .then<string>((id: string) => loop({ dir, prev: id }));

const prefix: ReadonlyMap<Role, string> = new Map([
  ["lepo", LEPO],
  ["meta", META],
  ["user", USER],
]);

const HOW_TO_SEND =
  "\x1b[90m[\x1b[32mEnter\x1b[90m] then [\x1b[32mCtrl + D\x1b[90m] \x1b[0mto submit";

const te = new TextEncoder();

const dir = ".lepo";
debug("dir:", dir);

conv({ dir })
  .then((bnames: ReadonlyArray<BubbName>): void => {
    debug(() => [
      "conv:",
      ...bnames.map(({ id, meta: { role, isHidden } }) =>
        `\n  ${role}[${isHidden ? "x" : " "}]${id}`
      ),
    ]);

    for (const { id, meta: { role, isHidden, path } } of bnames) {
      if (isHidden) continue;
      Deno.stdout.writeSync(te.encode(prefix.get(role)));
      Deno.stdout.writeSync(Deno.readFileSync(path));
      Deno.stdout.writeSync(te.encode(
        `  [ \x1b[32m${
          id.substring(id.length - 4).toLowerCase()
        }\x1b[0m ] \x1b[90m${path}\x1b[0m`,
      ));
    }
  })
  .then<BubbName | undefined>(() => bubb({ dir }))
  .then<string>((name?: BubbName) => {
    if (!name) throw new Error();

    return name.meta.role === "lepo"
      ? name.id
      : lepo({ dir, tail: name.id }).then<string>((text: string) =>
        save({ dir, prev: name.id, role: "lepo", text })
      );
  })
  .then((id: string): string => {
    Deno.stdout.writeSync(te.encode(META + HOW_TO_SEND));
    return id;
  })
  .then<string>((id: string) => loop({ dir, prev: id }))
  .catch((e): void => {
    if (e === BYE) {
      Deno.stdout.writeSync(te.encode(META + "bye\n"));
    } else {
      console.error(e);
      Deno.exit(1);
    }
  });
