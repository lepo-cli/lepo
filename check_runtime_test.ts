import { checkRuntime } from "./check_runtime.ts";
import { assertRejects } from "jsr:@std/assert";

Deno.test({
  name: "checkRuntime",
  permissions: { run: true },
  fn: () => checkRuntime(["fd", "git"]),
});

Deno.test({
  name: "checkRuntime fails",
  permissions: { run: true },
  fn: () => assertRejects(() => checkRuntime(["yrmp8ruzn2etjvgnfnx"])).then(),
});
