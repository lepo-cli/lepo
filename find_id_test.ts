import type { Ulid } from "./bubb.ts";
import { findId } from "./find_id.ts";
import { join } from "jsr:@std/path/join";
import { assertEquals, assertFalse } from "jsr:@std/assert";

Deno.test({
  name: "findId too long",
  permissions: {
    read: true,
    write: true,
  },
  fn: () => {
    const testdir = join(
      import.meta.dirname as string,
      "_lepo_testspace_",
      "find_id",
    );

    Deno.mkdirSync(testdir, { recursive: true });
    Deno.removeSync(testdir, { recursive: true });
    Deno.mkdirSync(testdir, { recursive: true });

    return Deno.writeTextFile(
      join(testdir, "0123012301230123012301ABCD-u0-nil.txt"),
      "",
    )
      .then(() =>
        findId({
          dir: testdir,
          suffix: "X0123012301230123012301ABCD",
        })
      )
      .then((id?: Ulid) => {
        assertFalse(id);
      })
      .finally(() => {
        Deno.mkdirSync(testdir, { recursive: true });
        Deno.removeSync(testdir, { recursive: true });
      });
  },
});

Deno.test({
  name: "findId not found",
  permissions: {
    read: true,
    write: true,
  },
  fn: () => {
    const testdir = join(
      import.meta.dirname as string,
      "_lepo_testspace_",
      "find_id",
    );

    Deno.mkdirSync(testdir, { recursive: true });
    Deno.removeSync(testdir, { recursive: true });
    Deno.mkdirSync(testdir, { recursive: true });

    return Deno.writeTextFile(
      join(testdir, "0123012301230123012301ABCD-u0-nil.txt"),
      "",
    )
      .then(() => findId({ dir: testdir, suffix: "abc" }))
      .then((id?: Ulid) => {
        assertFalse(id);
      })
      .finally(() => {
        Deno.mkdirSync(testdir, { recursive: true });
        Deno.removeSync(testdir, { recursive: true });
      });
  },
});

Deno.test({
  name: "findId happy",
  permissions: {
    read: true,
    write: true,
  },
  fn: () => {
    const testdir = join(
      import.meta.dirname as string,
      "_lepo_testspace_",
      "find_id",
    );

    Deno.mkdirSync(testdir, { recursive: true });
    Deno.removeSync(testdir, { recursive: true });
    Deno.mkdirSync(testdir, { recursive: true });

    return Deno.writeTextFile(
      join(testdir, "0123012301230123012301ABCD-u0-nil.txt"),
      "",
    )
      .then(() => findId({ dir: testdir, suffix: "abcd" }))
      .then((id?: Ulid) => {
        assertEquals(id, "0123012301230123012301ABCD");
      })
      .finally(() => {
        Deno.mkdirSync(testdir, { recursive: true });
        Deno.removeSync(testdir, { recursive: true });
      });
  },
});
