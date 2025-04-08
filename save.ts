import type { BubbName, Role } from "./bubb.ts";
import { bubb } from "./bubb.ts";

import { ulid } from "@std/ulid/ulid";

class NotFound extends Error {
  override name = "NotFound";
}

export const save = ({ dir, prev, role, isHidden, text }: {
  dir: string;
  prev: string;
  role: Role;
  isHidden?: boolean;
  text: string;
}): Promise<string> =>
  bubb({ dir, id: prev })
    .then((name?: BubbName): string => {
      if (!name) throw new NotFound(`bubb#${prev} not found`);
      return ulid();
    })
    .then<string>((curr: string) =>
      // TODO: path 라이브러리 쓰기
      Deno.writeTextFile(
        `${dir}/${curr}-${role.charAt(0)}${isHidden ? "1" : "0"}-${prev}.txt`,
        text,
      )
        .then((): string => curr)
    );
