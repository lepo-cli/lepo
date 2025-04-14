import { checkruntime } from "./checkruntime.ts";

Deno.test({
  name: "checkruntime",
  permissions: { run: true },
  fn: () => checkruntime(),
});
