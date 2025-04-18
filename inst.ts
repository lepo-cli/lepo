import type { SaneStatus } from "./sane_status.ts";
import { stringify } from "jsr:@libs/xml/stringify";
import { join } from "jsr:@std/path/join";

const encode = (str: string): string => {
  if (str.indexOf("{{") !== -1) {
    throw new Error(`str must not contain "{{": ${str}`);
  }

  const wrapped = stringify({ str });
  return wrapped.substring(5, wrapped.length - 6);
};

const instTmpl: string = Deno
  .readTextFileSync(join(import.meta.dirname as string, "inst.txt"));

export const inst = ({ initialDirectory, wd, cmds, saneStatus }: {
  initialDirectory: string;
  wd: string;
  cmds: ReadonlyArray<string>;
  saneStatus: SaneStatus;
}): string => {
  if (!cmds.every((cmd) => cmd.indexOf("{{") === -1)) {
    throw new Error(
      `every cmd of cmds must not contain "{{": ${cmds.join(", ")}`,
    );
  }

  return instTmpl
    .replaceAll("{{initialDirectory}}", encode(initialDirectory))
    .replaceAll("{{wd}}", encode(wd))
    .replaceAll("{{cmds}}", stringify({ cmds: { cmd: cmds } }))
    .replaceAll("{{saneStatus}}", stringify({ context: saneStatus }));
};
