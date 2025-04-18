import type { BubbName } from "./bubb.ts";
import { conv } from "./conv.ts";
import { assert } from "jsr:@std/assert";
import { join } from "jsr:@std/path/join";

Deno.test({
  name: "conv",
  permissions: {
    read: true,
    write: true,
    run: true,
    env: ["DEV"],
  },
  fn: () => {
    const testdir = join(
      import.meta.dirname as string,
      "_lepo_testspace_",
      "conv",
    );
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
