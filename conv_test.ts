import { assert } from "jsr:@std/assert@1.0.12";

import type { BubbName } from "./bubb.ts";
import { conv } from "./conv.ts";

import { join } from "@std/path/join";

Deno.test({
  name: "conv",
  permissions: {
    read: true,
    write: true,
    run: true,
    env: ["DEV"],
  },
  fn: () => {
    const testdir = join(import.meta.dirname as string, "testspace", "conv");
    Deno.mkdirSync(testdir, { recursive: true });
    Deno.removeSync(testdir, { recursive: true });
    return conv({ dir: testdir })
      .then((bnames: ReadonlyArray<BubbName>): void => {
        assert(bnames.length > 0);
      })
      .finally(() => {
        Deno.mkdirSync(testdir, { recursive: true });
        Deno.removeSync(testdir, { recursive: true });
      });
  },
});
