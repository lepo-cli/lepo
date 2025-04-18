import type { BubbName, Role } from "./bubb.ts";
import { bubb } from "./bubb.ts";
import { join } from "jsr:@std/path/join";
import { ulid } from "jsr:@std/ulid/ulid";

const te = new TextEncoder();

export const save = ({ dir, prev, role, isHidden, text }: {
  dir: string;
  prev: string;
  role: Role;
  isHidden?: boolean;
  text: string;
}): Promise<string> =>
  bubb({ dir, id: prev })
    .then((name?: BubbName): string => {
      if (name) return ulid();
      else throw new Error(`bubb#${prev} not found`);
    })
    .then<string>((curr: string) =>
      Promise
        .resolve(`${curr}-${role.charAt(0)}${isHidden ? "1" : "0"}-${prev}`)
        .then((name: string): string => join(dir, `${name}.txt`))
        .then((path: string) =>
          Deno.writeTextFile(path, text).then(() =>
            Deno.stdout.write(
              te.encode(
                `  [ \x1b[32m${
                  curr.substring(curr.length - 4).toLowerCase()
                }\x1b[0m ] \x1b[90m${path}\x1b[0m`,
              ),
            )
          )
        )
        .then((): string => curr)
    );
