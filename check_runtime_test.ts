import { checkRuntime } from "./check_runtime.ts";

Deno.test({
  name: "checkruntime",
  permissions: { run: true },
  fn: () =>
    checkRuntime(["fd", "rg", "perl", "jq", "git", "ssh", "curl", "elinks"]),
});
