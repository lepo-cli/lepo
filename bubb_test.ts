import type { BubbName } from "./bubb.ts";
import { bubb } from "./bubb.ts";
import { reset } from "./reset.ts";
import { assert, fail } from "jsr:@std/assert";
import { join } from "jsr:@std/path/join";

Deno.test({
  name: "bubb 없으면 에러 남",
  permissions: {
    read: true,
    write: true,
    run: true,
  },
  fn: () => {
    const testdir = join(
      import.meta.dirname as string,
      "_lepo_testspace_",
      "bubb-1",
    );
    Deno.mkdirSync(testdir, { recursive: true });
    Deno.removeSync(testdir, { recursive: true });
    return bubb({ dir: testdir })
      .then(() => {
        fail();
      })
      .catch(() => {})
      .finally(() => {
        Deno.mkdirSync(testdir, { recursive: true });
        Deno.removeSync(testdir, { recursive: true });
      });
  },
});

Deno.test({
  name: "bubb 있으면 가져와짐",
  permissions: {
    read: true,
    write: true,
    run: true,
  },
  fn: () => {
    const testdir = join(
      import.meta.dirname as string,
      "_lepo_testspace_",
      "bubb-2",
    );
    Deno.mkdirSync(testdir, { recursive: true });
    Deno.removeSync(testdir, { recursive: true });
    try {
      reset({ dir: testdir });
    } catch (_) {
      Deno.mkdirSync(testdir, { recursive: true });
      Deno.removeSync(testdir, { recursive: true });
      fail();
    }
    return bubb({ dir: testdir })
      .then((name?: BubbName) => {
        assert(name);
      })
      .finally(() => {
        Deno.mkdirSync(testdir, { recursive: true });
        Deno.removeSync(testdir, { recursive: true });
      });
  },
});
