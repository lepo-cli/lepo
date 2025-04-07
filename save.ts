import type { BubbName, Role } from "./bubb.ts";
import { bubb } from "./bubb.ts";

import { ulid } from "@std/ulid/ulid";

const NOT_FOUND = Symbol("not found");

export const save = ({ dir, prev, role, isHidden, text }: {
  dir: string;
  prev: string;
  role: Role;
  isHidden?: boolean;
  text: string;
}): Promise<string> =>
  bubb({ dir, id: prev })
    .then((name?: BubbName): string => {
      if (!name) throw NOT_FOUND;
      return ulid();
    })
    .then<string>((curr: string) =>
      Deno.writeTextFile(
        `${dir}/${curr}-${role.charAt(0)}${isHidden ? "1" : "0"}-${prev}.txt`,
        text,
      )
        .then((): string => curr)
    );
