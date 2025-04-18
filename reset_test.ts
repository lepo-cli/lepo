import { reset } from "./reset.ts";
import { assert } from "jsr:@std/assert";
import { join } from "jsr:@std/path/join";

Deno.test({
  name: "reset",
  permissions: {
    read: true,
    write: true,
    run: true,
  },
  fn: () => {
    const testdir = join(
      import.meta.dirname as string,
      "_lepo_testspace_",
      "reset",
    );
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
