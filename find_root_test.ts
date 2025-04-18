import { findRoot } from "./find_root.ts";
import { join } from "jsr:@std/path/join";
import { assertEquals, fail } from "jsr:@std/assert";

const ROOT = Symbol();

Deno.test({
  name: "findRoot",
  permissions: {
    read: true,
    write: true,
  },
  fn: () => {
    const testdir = join(
      import.meta.dirname as string,
      "_lepo_testspace_",
      "find_root",
    );

    Deno.mkdirSync(testdir, { recursive: true });
    Deno.removeSync(testdir, { recursive: true });
    Deno.mkdirSync(testdir, { recursive: true });

    try {
      const nolepo = join(testdir, "a", "b", "c");
      const yeslepo = join(testdir, "d", "e", "f");
      const herelepo = join(testdir, "d", ".lepo");
      Deno.mkdirSync(nolepo, { recursive: true });
      Deno.mkdirSync(yeslepo, { recursive: true });
      Deno.mkdirSync(herelepo);

      try {
        findRoot({ dirname: ".lepo", from: nolepo }, {
          fn: (abs: string): void => {
            if (abs.endsWith("_lepo_testspace_")) throw ROOT;
          },
          throws: ROOT,
        });
        fail();
      } catch (e) {
        assertEquals(e, ROOT);
      }

      assertEquals(
        findRoot({ dirname: ".lepo", from: yeslepo }),
        join(testdir, "d"),
      );
    } finally {
      Deno.mkdirSync(testdir, { recursive: true });
      Deno.removeSync(testdir, { recursive: true });
    }
  },
});
