import { assert } from "jsr:@std/assert@1.0.12";

import { reset } from "./reset.ts";

Deno.test({
  name: "reset",
  permissions: {
    read: true,
    write: true,
    run: true,
  },
  fn: () => {
    const testdir = ".lepo.reset.test";
    Deno.mkdirSync(testdir, { recursive: true });
    Deno.removeSync(testdir, { recursive: true });
    try {
      reset({ dir: testdir });
      let exists = false;
      for (const { isFile } of Deno.readDirSync(testdir)) {
        exists = true;
        assert(isFile);
      }
      assert(exists);
    } finally {
      Deno.mkdirSync(testdir, { recursive: true });
      Deno.removeSync(testdir, { recursive: true });
    }
  },
});
